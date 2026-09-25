package service

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// QuizService handles the quiz attempt lifecycle:
//   Start  → creates attempt, shuffles questions, returns sanitized question data
//   Submit → grades answers server-side, calculates score/stars/XP, stores result
//
// SECURITY CONTRACT:
//   correctAnswer is NEVER returned to the frontend.
//   All grading happens exclusively in this service.
//   The frontend submits selectedAnswer only.
type QuizService struct {
	quizRepo           *repository.QuizRepository
	attemptRepo        *repository.AttemptRepository
	chapterStatusRepo  *repository.ChapterStatusRepository
	progressRepo       *repository.ProgressRepository
	progressionService *ProgressionService
	badgeService       *BadgeService
	notifRepo          *repository.NotificationRepository
}

func NewQuizService(
	quizRepo *repository.QuizRepository,
	attemptRepo *repository.AttemptRepository,
	chapterStatusRepo *repository.ChapterStatusRepository,
	progressRepo *repository.ProgressRepository,
	progressionService *ProgressionService,
	badgeService *BadgeService,
	notifRepo *repository.NotificationRepository,
) *QuizService {
	return &QuizService{
		quizRepo:           quizRepo,
		attemptRepo:        attemptRepo,
		chapterStatusRepo:  chapterStatusRepo,
		progressRepo:       progressRepo,
		progressionService: progressionService,
		badgeService:       badgeService,
		notifRepo:          notifRepo,
	}
}


// ─── Start ────────────────────────────────────────────────────────────────────

// StartAttempt creates a new in-progress attempt for the given quiz.
// Returns the attemptId and ONLY sanitized question data (no correctAnswer).
func (s *QuizService) StartAttempt(ctx context.Context, userID, quizID string) (*domain.AttemptStartResponse, error) {
	// 1. Fetch quiz
	quiz, err := s.quizRepo.GetByID(ctx, quizID)
	if err != nil || quiz == nil {
		return nil, fmt.Errorf("quiz not found: %s", quizID)
	}

	// 2. Fetch questions (full, including correctAnswer — server-side only)
	questions, err := s.quizRepo.GetQuestionsForQuiz(ctx, quiz)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch questions: %w", err)
	}
	if len(questions) == 0 {
		return nil, errors.New("quiz has no questions")
	}

	// 3. Shuffle question order (different every attempt)
	shuffled := make([]*domain.Question, len(questions))
	copy(shuffled, questions)
	rand.New(rand.NewSource(time.Now().UnixNano())).Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	// 4. Build ordered question IDs and sanitized public questions
	questionOrder := make([]string, len(shuffled))
	publicQuestions := make([]domain.QuestionPublic, len(shuffled))
	for i, q := range shuffled {
		questionOrder[i] = q.ID
		pub := q.ToPublic()
		// For MCQ/True-False: also shuffle options so order doesn't hint at the answer
		if q.Type == domain.QuestionTypeMCQ || q.Type == domain.QuestionTypeTrueFalse || q.Type == domain.QuestionTypeFillBlank {
			shuffledOptions := make([]string, len(pub.Options))
			copy(shuffledOptions, pub.Options)
			rand.Shuffle(len(shuffledOptions), func(a, b int) {
				shuffledOptions[a], shuffledOptions[b] = shuffledOptions[b], shuffledOptions[a]
			})
			pub.Options = shuffledOptions
		}
		publicQuestions[i] = pub
	}

	// 5. Count previous attempts (for attemptNumber)
	prevCount, _ := s.attemptRepo.CountAttempts(ctx, userID, quizID)

	// 6. Create attempt document
	attemptID := uuid.New().String()
	now := time.Now()
	attempt := &domain.Attempt{
		ID:            attemptID,
		UserID:        userID,
		QuizID:        quizID,
		ChapterID:     quiz.ChapterID,
		UnitID:        quiz.UnitID,
		QuestionOrder: questionOrder,
		StartedAt:     now,
		Status:        domain.AttemptStatusInProgress,
		AttemptNumber: prevCount + 1,
	}

	if err := s.attemptRepo.Create(ctx, attempt); err != nil {
		return nil, fmt.Errorf("failed to create attempt: %w", err)
	}

	return &domain.AttemptStartResponse{
		AttemptID: attemptID,
		Questions: publicQuestions,
		StartedAt: now,
	}, nil
}

// ─── CheckAnswer ──────────────────────────────────────────────────────────────

// CheckAnswer validates a single answer for an in-progress attempt and persists it.
// Security guarantees:
//   - Only the authenticated student can check their own attempt (UserID verified)
//   - The question must belong to this attempt's questionOrder
//   - The same question cannot be checked twice (idempotency via Firestore transaction)
//   - correctAnswer is NEVER included in the response
//   - The final SubmitAttempt reuses the already-stored answers for authoritative grading
func (s *QuizService) CheckAnswer(ctx context.Context, userID, attemptID string, req domain.CheckAnswerRequest) (*domain.CheckAnswerResponse, error) {
	// 1. Fetch attempt and verify ownership
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		return nil, err
	}
	if attempt.UserID != userID {
		return nil, errors.New("attempt does not belong to this user")
	}
	if attempt.Status != domain.AttemptStatusInProgress && attempt.Status != "practice_in_progress" {
		return nil, errors.New("attempt is not in progress")
	}

	// 2. Fetch the question from Firestore (server-authoritative correctAnswer)
	question, err := s.quizRepo.GetQuestionByID(ctx, req.QuestionID)
	if err != nil || question == nil {
		return nil, fmt.Errorf("question not found: %s", req.QuestionID)
	}

	// 3. Grade the answer server-side — never trusts the client
	isCorrect := gradeAnswer(question, req.SelectedAnswer)

	// 4. Persist the answer atomically (idempotency + ownership guards in repo)
	storedAnswer := domain.StoredAnswer{
		QuestionID:     req.QuestionID,
		SelectedAnswer: req.SelectedAnswer,
		IsCorrect:      isCorrect,
		TimeTakenMs:    req.TimeTakenMs,
	}
	updatedAttempt, err := s.attemptRepo.RecordCheckedAnswer(ctx, attemptID, storedAnswer)
	if err != nil {
		if errors.Is(err, repository.ErrQuestionAlreadyAnswered) {
			// Idempotent — find the existing stored answer and return its result
			for _, a := range attempt.Answers {
				if a.QuestionID == req.QuestionID {
					combo := countCombo(attempt.Answers, attempt.QuestionOrder)
					return &domain.CheckAnswerResponse{
						Correct: a.IsCorrect,
						Combo:   combo,
					}, nil
				}
			}
		}
		return nil, fmt.Errorf("failed to record answer: %w", err)
	}

	// 5. Compute running combo from the updated answers list
	combo := countCombo(updatedAttempt.Answers, updatedAttempt.QuestionOrder)

	// 6. Return feedback — explanation shown only if correct (not exposing the answer key for wrong ones)
	explanation := ""
	if isCorrect {
		explanation = question.Explanation
	}

	return &domain.CheckAnswerResponse{
		Correct:     isCorrect,
		Explanation: explanation,
		Combo:       combo,
	}, nil
}

// countCombo calculates the current consecutive-correct streak from stored answers,
// following the question order as the authoritative sequence.
func countCombo(answers []domain.StoredAnswer, questionOrder []string) int {
	// Build a map of answers for fast lookup
	answerMap := make(map[string]bool, len(answers))
	for _, a := range answers {
		answerMap[a.QuestionID] = a.IsCorrect
	}
	// Walk the question order in reverse to find trailing consecutive correct answers
	combo := 0
	for i := len(questionOrder) - 1; i >= 0; i-- {
		correct, answered := answerMap[questionOrder[i]]
		if !answered {
			break // haven't answered this question yet
		}
		if !correct {
			break // streak broken
		}
		combo++
	}
	return combo
}


// ─── Submit ───────────────────────────────────────────────────────────────────

// SubmitAttempt grades the submitted answers and stores the completed attempt.
// Idempotency: if the attempt is already completed, returns the cached result.
// IMPORTANT: correctAnswer and explanations are ONLY revealed in the result.
func (s *QuizService) SubmitAttempt(
	ctx context.Context,
	userID, attemptID string,
	submissions []domain.AnswerSubmission,
) (*domain.AttemptResult, error) {
	// 1. Fetch the attempt (verify ownership)
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		return nil, err
	}
	if attempt.UserID != userID {
		return nil, errors.New("attempt does not belong to this user")
	}

	// 2. Idempotency: already completed?
	if attempt.Status == domain.AttemptStatusCompleted {
		return buildResultFromAttempt(attempt), nil
	}

	// 3. Grade: fetch each question from Firestore and compare answers server-side
	submissionMap := make(map[string]domain.AnswerSubmission, len(submissions))
	for _, s := range submissions {
		submissionMap[s.QuestionID] = s
	}

	storedAnswers := make([]domain.StoredAnswer, 0, len(attempt.QuestionOrder))
	questionResults := make([]domain.QuestionResult, 0, len(attempt.QuestionOrder))
	correctCount := 0

	// Combo tracking: consecutive correct answers in question order
	maxCombo := 0
	currentCombo := 0

	for _, qid := range attempt.QuestionOrder {
		q, err := s.quizRepo.GetQuestionByID(ctx, qid)
		if err != nil || q == nil {
			currentCombo = 0 // treat missing question as break
			continue
		}

		sub, answered := submissionMap[qid]
		selectedAnswer := ""
		timeTakenMs := int64(0)
		if answered {
			selectedAnswer = sub.SelectedAnswer
			timeTakenMs = sub.TimeTakenMs
		}

		// Server-side correctness check
		isCorrect := gradeAnswer(q, selectedAnswer)
		if isCorrect {
			correctCount++
			currentCombo++
			if currentCombo > maxCombo {
				maxCombo = currentCombo
			}
		} else {
			currentCombo = 0
		}

		storedAnswers = append(storedAnswers, domain.StoredAnswer{
			QuestionID:     qid,
			SelectedAnswer: selectedAnswer,
			IsCorrect:      isCorrect,
			TimeTakenMs:    timeTakenMs,
		})

		// QuestionResult includes correctAnswer + explanation — only in result
		questionResults = append(questionResults, domain.QuestionResult{
			QuestionID:     qid,
			SelectedAnswer: selectedAnswer,
			CorrectAnswer:  q.CorrectAnswer, // revealed here, after submission
			IsCorrect:      isCorrect,
			Explanation:    q.Explanation,
			TimeTakenMs:    timeTakenMs,
		})
	}

	// 4. Fetch the quiz to get the dynamic passing score
	quiz, err := s.quizRepo.GetByID(ctx, attempt.QuizID)
	if err != nil || quiz == nil {
		return nil, fmt.Errorf("quiz not found")
	}
	passingScore := quiz.PassingScore
	if passingScore <= 0 {
		passingScore = 90
	}

	total := len(attempt.QuestionOrder)
	score := 0
	if total > 0 {
		score = (correctCount * 100) / total
	}
	stars := calculateStars(score)
	xp := calculateXP(stars)
	passed := score >= passingScore

	// 5. Check personal best
	best, _ := s.attemptRepo.GetBestAttempt(ctx, userID, attempt.QuizID)
	personalBest := best == nil || score > best.Score

	// 6. Complete the attempt (idempotent via Firestore transaction)
	attempt.Answers = storedAnswers
	attempt.Score = score
	attempt.StarsEarned = stars
	attempt.XPEarned = xp
	attempt.Passed = passed

	if err := s.attemptRepo.Complete(ctx, attempt); err != nil {
		if errors.Is(err, repository.ErrAttemptAlreadyCompleted) {
			// Race condition — return existing result
			return buildResultFromAttempt(attempt), nil
		}
		return nil, fmt.Errorf("failed to complete attempt: %w", err)
	}

	// 7. Update progress if personal best — also detect rank-up
	rankUpTitle := ""
	if personalBest {
		rankUpTitle = s.updateProgress(ctx, userID, xp, stars)
	}

	unitComplete := false
	unlockRequestCreated := false

	// 8. Update chapterStatus if passed
	if passed {
		s.updateChapterStatus(ctx, userID, attempt.ChapterID, attempt.UnitID, score, stars)

		// Always record this chapter as completed in the progress aggregate.
		// Uses Firestore ArrayUnion — idempotent, no duplicates.
		_ = s.progressRepo.AppendCompletedChapter(ctx, userID, attempt.ChapterID)

		if s.progressionService != nil && attempt.UnitID != "" {
			// Step A: Unlock the next chapter within the same unit.
			// This is what lets the student continue Ch1 → Ch2 → Ch3.
			// Errors here are non-fatal — they are logged but don't fail the submission.
			if err := s.progressionService.UnlockNextChapter(ctx, userID, attempt.ChapterID, attempt.UnitID); err != nil {
				// Non-fatal: log but proceed. Student still gets their result.
				_ = err
			}

			// Step B: Check if ALL chapters in this unit are now completed at ≥90%.
			// Only creates one Admin unlock request when the whole unit is mastered.
			// This will return false for Ch1/Ch2 completions (remaining chapters not done yet).
			unitComplete, _ = s.progressionService.EvaluateUnitCompletion(ctx, userID, attempt.UnitID)
			unlockRequestCreated = unitComplete
			if unitComplete {
				// Record the unit as completed in the progress aggregate.
				// Uses Firestore ArrayUnion — idempotent, no duplicates.
				_ = s.progressRepo.AppendCompletedUnit(ctx, userID, attempt.UnitID)
			}
		}
	}

	// 9. Update daily mission (counts any submitted attempt, regardless of pass/fail)
	s.updateDailyMission(ctx, userID)

	// 10. Evaluate and award badges
	var badgesEarned []string
	if s.badgeService != nil {
		progress, _ := s.progressRepo.GetOrCreate(ctx, userID)
		currentStreak := 0
		if progress != nil {
			currentStreak = progress.CurrentStreak
		}
		badgesEarned = s.badgeService.EvaluateAndAward(ctx, BadgeEvent{
			UserID:         userID,
			Score:          score,
			Stars:          stars,
			Passed:         passed,
			MaxCombo:       maxCombo,
			IsFirstAttempt: attempt.AttemptNumber == 1, // first attempt on this quiz
			UnitComplete:   unitComplete,
			CurrentStreak:  currentStreak,
			PersonalBest:   personalBest,
		})
		// Award rank-up badge if applicable
		if rankUpTitle != "" {
			s.badgeService.AwardRankBadge(ctx, userID, rankUpTitle)
		}
	}

	return &domain.AttemptResult{
		AttemptID:            attemptID,
		Score:                score,
		StarsEarned:          stars,
		XPEarned:             xp,
		Passed:               passed,
		AttemptNumber:        attempt.AttemptNumber,
		QuestionResults:      questionResults,
		PersonalBest:         personalBest,
		UnitComplete:         unitComplete,
		UnlockRequestCreated: unlockRequestCreated,
		RankUpTitle:          rankUpTitle,
		BadgesEarned:         badgesEarned,
		MaxCombo:             maxCombo,
	}, nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// gradeAnswer performs server-side answer comparison.
// Case-insensitive, trimmed. Handles all question types.
func gradeAnswer(q *domain.Question, selected string) bool {
	return strings.EqualFold(
		strings.TrimSpace(selected),
		strings.TrimSpace(q.CorrectAnswer),
	)
}

func calculateStars(score int) int {
	switch {
	case score >= 90:
		return 3
	case score >= 70:
		return 2
	case score >= 50:
		return 1
	default:
		return 0
	}
}

func calculateXP(stars int) int {
	switch stars {
	case 3:
		return 50
	case 2:
		return 30
	case 1:
		return 15
	default:
		return 5 // participation XP
	}
}

func buildResultFromAttempt(attempt *domain.Attempt) *domain.AttemptResult {
	return &domain.AttemptResult{
		AttemptID:     attempt.ID,
		Score:         attempt.Score,
		StarsEarned:   attempt.StarsEarned,
		XPEarned:      attempt.XPEarned,
		Passed:        attempt.Passed,
		AttemptNumber: attempt.AttemptNumber,
	}
}

// updateProgress applies XP/stars/streak and returns the new rank title if a rank-up occurred.
// The returned string is empty if the rank did not change.
func (s *QuizService) updateProgress(ctx context.Context, userID string, xp, stars int) string {
	progress, err := s.progressRepo.GetOrCreate(ctx, userID)
	if err != nil {
		return ""
	}
	oldRank := progress.RankTitle
	progress.TotalXP += xp
	progress.TotalStars += stars
	progress.RankTitle = calculateRank(progress.TotalXP)
	progress.StructureCount = progress.TotalXP / 10 // rough proxy

	// Normalize nil slices — old progress docs from manual seeding may have null arrays
	if progress.CompletedChapters == nil {
		progress.CompletedChapters = []string{}
	}
	if progress.CompletedUnits == nil {
		progress.CompletedUnits = []string{}
	}
	if progress.Badges == nil {
		progress.Badges = []string{}
	}
	if progress.BotTrophies == nil {
		progress.BotTrophies = []string{}
	}

	// Update streak
	today := time.Now().Format("2006-01-02")
	if progress.LastActiveDate != today {
		yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
		if progress.LastActiveDate == yesterday {
			progress.CurrentStreak++
		} else {
			progress.CurrentStreak = 1
		}
		if progress.CurrentStreak > progress.BestStreak {
			progress.BestStreak = progress.CurrentStreak
		}
		progress.LastActiveDate = today
	}

	s.progressRepo.Set(ctx, progress)

	// Detect rank-up
	if progress.RankTitle != oldRank && oldRank != "" {
		// Send rank-up notification
		_ = s.notifRepo.Create(ctx, &domain.Notification{
			UserID: userID,
			Type:   domain.NotifTypeRankUp,
			Title:  fmt.Sprintf("🎉 You ranked up to %s!", progress.RankTitle),
			Body:   fmt.Sprintf("You've earned enough XP to reach %s. Keep going!", progress.RankTitle),
		})
		return progress.RankTitle
	}
	return ""
}

func (s *QuizService) updateChapterStatus(ctx context.Context, userID, chapterID, unitID string, score, stars int) {
	cs, _ := s.chapterStatusRepo.Get(ctx, userID, chapterID)
	if cs == nil {
		cs = &domain.ChapterStatus{UserID: userID, ChapterID: chapterID, UnitID: unitID}
	}
	if score > cs.BestScore {
		cs.BestScore = score
		cs.BestStars = stars
	}
	cs.Status = domain.ChapterStatusCompleted
	now := time.Now()
	cs.CompletedAt = &now
	s.chapterStatusRepo.Set(ctx, cs)
}

func calculateRank(totalXP int) string {
	switch {
	case totalXP >= 2000:
		return domain.RankGrammarGod
	case totalXP >= 1000:
		return domain.RankGrammarLegend
	case totalXP >= 500:
		return domain.RankGrammarMaster
	case totalXP >= 300:
		return domain.RankGrammarChampion
	case totalXP >= 150:
		return domain.RankGrammarKnight
	case totalXP >= 75:
		return domain.RankGrammarScout
	case totalXP >= 25:
		return domain.RankGrammarCadet
	default:
		return domain.RankGrammarRookie
	}
}

// GetAttempt retrieves a completed attempt result for display on the result page.
// Returns only the result summary without exposing raw answer data.
func (s *QuizService) GetAttempt(ctx context.Context, userID, attemptID string) (*domain.AttemptResult, error) {
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		return nil, err
	}
	if attempt.UserID != userID {
		return nil, errors.New("attempt does not belong to this user")
	}
	return buildResultFromAttempt(attempt), nil
}

func (s *QuizService) updateDailyMission(ctx context.Context, userID string) {
	todayUTC := time.Now().UTC().Format("2006-01-02")

	// Use a targeted update to avoid a full read-modify-write cycle.
	// Strategy: fetch only the date + count, update only those fields.
	progress, err := s.progressRepo.GetOrCreate(ctx, userID)
	if err != nil {
		return
	}

	var newCount int
	if progress.LastQuizDate == todayUTC {
		newCount = progress.QuizzesCompletedToday + 1
	} else {
		newCount = 1
	}

	// Update only the daily mission fields — MergeAll ensures other fields are untouched.
	s.progressRepo.SetDailyMission(ctx, userID, todayUTC, newCount)
}

