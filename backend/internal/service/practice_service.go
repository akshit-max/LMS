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

// PracticeService handles Practice Arena sessions.
//
// CRITICAL INVARIANT:
//   Practice attempts NEVER update:
//     - ChapterStatus (no completion, no best score update)
//     - StudentProgress (no XP, no stars, no streak, no daily mission)
//     - ProgressionService (no unit completion check, no unlock request)
//     - Badges (no awards)
//     - Notifications (none sent)
//
//   Practice is purely for learning — no game rewards, no progression side effects.
//   The student can practice the same quiz as many times as they want.
//
// Practice attempts ARE stored in Firestore (with a "practice" status prefix)
// so the result page can function. They are filtered out from all progression logic.
type PracticeService struct {
	quizRepo    *repository.QuizRepository
	attemptRepo *repository.AttemptRepository
}

func NewPracticeService(
	quizRepo *repository.QuizRepository,
	attemptRepo *repository.AttemptRepository,
) *PracticeService {
	return &PracticeService{quizRepo: quizRepo, attemptRepo: attemptRepo}
}

// PracticeResult is returned after a practice submission.
// It includes correctness data but NO progression/reward fields.
type PracticeResult struct {
	AttemptID       string                 `json:"attemptId"`
	Score           int                    `json:"score"`
	CorrectCount    int                    `json:"correctCount"`
	TotalQuestions  int                    `json:"totalQuestions"`
	QuestionResults []domain.QuestionResult `json:"questionResults"`
	MaxCombo        int                    `json:"maxCombo"`
}

// StartPractice creates a practice session — same as StartAttempt but tagged "practice_in_progress".
func (s *PracticeService) StartPractice(ctx context.Context, userID, quizID string) (*domain.AttemptStartResponse, error) {
	quiz, err := s.quizRepo.GetByID(ctx, quizID)
	if err != nil || quiz == nil {
		return nil, fmt.Errorf("quiz not found: %s", quizID)
	}

	questions, err := s.quizRepo.GetQuestionsForQuiz(ctx, quiz)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch questions: %w", err)
	}
	if len(questions) == 0 {
		return nil, errors.New("quiz has no questions")
	}

	// Shuffle question order
	shuffled := make([]*domain.Question, len(questions))
	copy(shuffled, questions)
	rand.New(rand.NewSource(time.Now().UnixNano())).Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	questionOrder := make([]string, len(shuffled))
	publicQuestions := make([]domain.QuestionPublic, len(shuffled))
	for i, q := range shuffled {
		questionOrder[i] = q.ID
		pub := q.ToPublic()
		if q.Type == domain.QuestionTypeMCQ || q.Type == domain.QuestionTypeTrueFalse || q.Type == domain.QuestionTypeFillBlank {
			shuffledOpts := make([]string, len(pub.Options))
			copy(shuffledOpts, pub.Options)
			rand.Shuffle(len(shuffledOpts), func(a, b int) {
				shuffledOpts[a], shuffledOpts[b] = shuffledOpts[b], shuffledOpts[a]
			})
			pub.Options = shuffledOpts
		}
		publicQuestions[i] = pub
	}

	attemptID := uuid.New().String()
	now := time.Now()

	// Tag practice attempts with "practice_" prefix status so they are
	// never processed by normal progression/grading pipelines.
	attempt := &domain.Attempt{
		ID:            attemptID,
		UserID:        userID,
		QuizID:        quizID,
		ChapterID:     quiz.ChapterID,
		UnitID:        quiz.UnitID,
		QuestionOrder: questionOrder,
		StartedAt:     now,
		Status:        "practice_in_progress", // custom status — excluded from all progression
		AttemptNumber: 0,                      // practice attempts are not numbered
	}

	if err := s.attemptRepo.Create(ctx, attempt); err != nil {
		return nil, fmt.Errorf("failed to create practice attempt: %w", err)
	}

	return &domain.AttemptStartResponse{
		AttemptID: attemptID,
		Questions: publicQuestions,
		StartedAt: now,
	}, nil
}

// SubmitPractice grades answers and returns results WITHOUT any progression side effects.
func (s *PracticeService) SubmitPractice(ctx context.Context, userID, attemptID string, submissions []domain.AnswerSubmission) (*PracticeResult, error) {
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		return nil, fmt.Errorf("attempt not found: %w", err)
	}
	if attempt.UserID != userID {
		return nil, errors.New("attempt does not belong to this user")
	}
	// Only process practice attempts
	if !strings.HasPrefix(attempt.Status, "practice_") {
		return nil, errors.New("not a practice attempt")
	}

	submissionMap := make(map[string]domain.AnswerSubmission, len(submissions))
	for _, sub := range submissions {
		submissionMap[sub.QuestionID] = sub
	}

	questionResults := make([]domain.QuestionResult, 0, len(attempt.QuestionOrder))
	correctCount := 0
	maxCombo, currentCombo := 0, 0

	for _, qid := range attempt.QuestionOrder {
		q, err := s.quizRepo.GetQuestionByID(ctx, qid)
		if err != nil || q == nil {
			currentCombo = 0
			continue
		}

		sub, answered := submissionMap[qid]
		selectedAnswer := ""
		timeTakenMs := int64(0)
		if answered {
			selectedAnswer = sub.SelectedAnswer
			timeTakenMs = sub.TimeTakenMs
		}

		isCorrect := strings.EqualFold(strings.TrimSpace(selectedAnswer), strings.TrimSpace(q.CorrectAnswer))
		if isCorrect {
			correctCount++
			currentCombo++
			if currentCombo > maxCombo {
				maxCombo = currentCombo
			}
		} else {
			currentCombo = 0
		}

		questionResults = append(questionResults, domain.QuestionResult{
			QuestionID:     qid,
			SelectedAnswer: selectedAnswer,
			CorrectAnswer:  q.CorrectAnswer, // safe to reveal — practice is educational
			IsCorrect:      isCorrect,
			Explanation:    q.Explanation,
			TimeTakenMs:    timeTakenMs,
		})
	}

	total := len(attempt.QuestionOrder)
	score := 0
	if total > 0 {
		score = (correctCount * 100) / total
	}

	// Mark practice attempt as completed (practice_completed) — no progression side effects.
	_ = s.attemptRepo.SetPracticeCompleted(ctx, attemptID)

	return &PracticeResult{
		AttemptID:       attemptID,
		Score:           score,
		CorrectCount:    correctCount,
		TotalQuestions:  total,
		QuestionResults: questionResults,
		MaxCombo:        maxCombo,
	}, nil
}
