package service

import (
	"context"
	"errors"
	"fmt"

	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// ProgressionService evaluates unit mastery and creates unlock requests.
//
// PROGRESSION RULE (immutable):
//   A single quiz passing at ≥90% → chapter completed.
//   This does NOT create an unlock request.
//
//   An unlock request is created ONLY when:
//     ALL required quizzes in the unit have been completed
//     AND every quiz score was ≥ 90%
//     AND no pending/approved unlock request already exists for this unit.
//
//   The check happens after every chapter completion, but the request is
//   created only once (idempotency key = userId_unitId).
//
// This service is intentionally separate from QuizService and CurriculumService
// to keep the progression domain isolated and testable.
type ProgressionService struct {
	chapterRepo       *repository.ChapterRepository
	chapterStatusRepo *repository.ChapterStatusRepository
	attemptRepo       *repository.AttemptRepository
	unlockRepo        *repository.UnlockRequestRepository
	notifRepo         *repository.NotificationRepository
	unitRepo          *repository.UnitRepository
}

func NewProgressionService(
	chapterRepo *repository.ChapterRepository,
	chapterStatusRepo *repository.ChapterStatusRepository,
	attemptRepo *repository.AttemptRepository,
	unlockRepo *repository.UnlockRequestRepository,
	notifRepo *repository.NotificationRepository,
	unitRepo *repository.UnitRepository,
) *ProgressionService {
	return &ProgressionService{
		chapterRepo:       chapterRepo,
		chapterStatusRepo: chapterStatusRepo,
		attemptRepo:       attemptRepo,
		unlockRepo:        unlockRepo,
		notifRepo:         notifRepo,
		unitRepo:          unitRepo,
	}
}

// EvaluateUnitCompletion is called after every successful chapter/quiz completion.
// It checks whether ALL quizzes in the unit now satisfy mastery (≥90%).
// If yes, it creates exactly one UnlockRequest (idempotent).
//
// Returns:
//   unitComplete = true  → all quizzes passed, unlock request created (or already existed)
//   unitComplete = false → not all quizzes done yet
func (s *ProgressionService) EvaluateUnitCompletion(ctx context.Context, userID, unitID string) (bool, error) {
	// 1. Get all chapters in this unit
	chapters, err := s.chapterRepo.GetByUnit(ctx, unitID)
	if err != nil {
		return false, fmt.Errorf("fetch chapters: %w", err)
	}
	if len(chapters) == 0 {
		return false, nil
	}

	// 2. Check every chapter's status for this student
	quizScores := make(map[string]int, len(chapters))
	completedQuizIDs := make([]string, 0, len(chapters))
	lowestScore := 100
	totalRetries := 0

	for _, ch := range chapters {
		st, err := s.chapterStatusRepo.Get(ctx, userID, ch.ID)
		if err != nil {
			return false, err
		}

		// If any chapter is not completed, unit is not done
		if st == nil || st.Status != domain.ChapterStatusCompleted {
			return false, nil
		}

		// If any best score < 90, unit is not done
		if st.BestScore < 90 {
			return false, nil
		}

		quizScores[ch.QuizID] = st.BestScore
		completedQuizIDs = append(completedQuizIDs, ch.QuizID)
		if st.BestScore < lowestScore {
			lowestScore = st.BestScore
		}

		// Count retries for this chapter
		count, _ := s.attemptRepo.CountAttempts(ctx, userID, ch.QuizID)
		if count > 1 {
			totalRetries += count - 1
		}
	}

	// 3. All chapters completed at ≥90% — determine the next unit to unlock
	unit, err := s.unitRepo.GetByID(ctx, unitID)
	if err != nil || unit == nil {
		return false, fmt.Errorf("fetch unit: %w", err)
	}

	// 4. Create idempotent unlock request
	idempotencyKey := fmt.Sprintf("%s_%s", userID, unitID)
	req := &domain.UnlockRequest{
		UserID:           userID,
		UnitID:           unitID,
		CompletedQuizIDs: completedQuizIDs,
		QuizScores:       quizScores,
		LowestScore:      lowestScore,
		TotalRetries:     totalRetries,
		ToUnitID:         "", // TBD by admin or future auto-progression
		Status:           domain.UnlockStatusPending,
		IdempotencyKey:   idempotencyKey,
	}

	err = s.unlockRepo.CreateIdempotent(ctx, req)
	if err != nil {
		if errors.Is(err, repository.ErrUnlockRequestAlreadyExists) {
			// Already exists — not an error, just idempotent
			return true, nil
		}
		return false, fmt.Errorf("create unlock request: %w", err)
	}

	return true, nil
}

// UnlockNextChapter sets the chapter immediately after currentChapterID to "available".
// Called after every successful chapter completion (score ≥ 90%).
//
// Idempotency guarantees:
//   - If the next chapter is already "available" or "completed", this is a no-op.
//   - If currentChapter is the last chapter in the unit, this is a no-op
//     (unit-level completion is handled by EvaluateUnitCompletion separately).
//
// This is intentionally NOT responsible for creating the Admin unlock request —
// that remains the sole responsibility of EvaluateUnitCompletion, which fires
// only when ALL chapters in the unit are completed at ≥90%.
func (s *ProgressionService) UnlockNextChapter(ctx context.Context, userID, currentChapterID, unitID string) error {
	// 1. Get all chapters in this unit, sorted by order (guaranteed by GetByUnit)
	chapters, err := s.chapterRepo.GetByUnit(ctx, unitID)
	if err != nil {
		return fmt.Errorf("UnlockNextChapter: fetch chapters: %w", err)
	}

	// 2. Find the index of the current chapter
	currentIdx := -1
	for i, ch := range chapters {
		if ch.ID == currentChapterID {
			currentIdx = i
			break
		}
	}

	if currentIdx == -1 {
		// currentChapterID not found in this unit — data inconsistency, log and skip
		return fmt.Errorf("UnlockNextChapter: chapter %s not found in unit %s", currentChapterID, unitID)
	}

	if currentIdx >= len(chapters)-1 {
		// Last chapter — no next chapter to unlock.
		// EvaluateUnitCompletion will handle the unit-level unlock request.
		return nil
	}

	// 3. Get the next chapter
	nextChapter := chapters[currentIdx+1]

	// 4. Check existing status — never downgrade completed → available
	existing, err := s.chapterStatusRepo.Get(ctx, userID, nextChapter.ID)
	if err != nil {
		return fmt.Errorf("UnlockNextChapter: get next chapter status: %w", err)
	}
	if existing != nil && (existing.Status == domain.ChapterStatusCompleted || existing.Status == domain.ChapterStatusAvailable) {
		// Already at or beyond "available" — idempotent no-op
		return nil
	}

	// 5. Set next chapter to available, preserving any existing bestScore/bestStars
	nextCS := &domain.ChapterStatus{
		UserID:    userID,
		ChapterID: nextChapter.ID,
		UnitID:    unitID,
		Status:    domain.ChapterStatusAvailable,
		BestScore: 0,
		BestStars: 0,
	}
	if existing != nil {
		nextCS.BestScore = existing.BestScore
		nextCS.BestStars = existing.BestStars
	}

	if err := s.chapterStatusRepo.Set(ctx, nextCS); err != nil {
		return fmt.Errorf("UnlockNextChapter: write next chapter status: %w", err)
	}
	return nil
}
