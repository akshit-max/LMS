package domain

import "time"

// Attempt statuses
const (
	AttemptStatusInProgress = "in_progress"
	AttemptStatusCompleted  = "completed"
)

// AnswerSubmission is what the frontend sends per question — selected answer only.
// The backend calculates correctness; the client never sends isCorrect.
type AnswerSubmission struct {
	QuestionID     string `json:"questionId"`
	SelectedAnswer string `json:"selectedAnswer"`
	TimeTakenMs    int64  `json:"timeTakenMs"` // optional client-side timing for speed scoring
}

// StoredAnswer is the server-calculated result stored in Firestore after grading.
type StoredAnswer struct {
	QuestionID     string `firestore:"questionId" json:"questionId"`
	SelectedAnswer string `firestore:"selectedAnswer" json:"selectedAnswer"`
	IsCorrect      bool   `firestore:"isCorrect" json:"isCorrect"`
	TimeTakenMs    int64  `firestore:"timeTakenMs" json:"timeTakenMs"`
}

// Attempt represents a single quiz attempt lifecycle: in_progress → completed.
// questionOrder is assigned at start-time (shuffled) and is authoritative.
// All score/stars/xp/passed fields are calculated server-side on submission.
type Attempt struct {
	ID            string         `firestore:"id" json:"id"`
	UserID        string         `firestore:"userId" json:"userId"`
	QuizID        string         `firestore:"quizId" json:"quizId"`
	ChapterID     string         `firestore:"chapterId" json:"chapterId"`
	UnitID        string         `firestore:"unitId" json:"unitId"`
	QuestionOrder []string       `firestore:"questionOrder" json:"questionOrder"`
	StartedAt     time.Time      `firestore:"startedAt" json:"startedAt"`
	CompletedAt   *time.Time     `firestore:"completedAt" json:"completedAt"`
	Status        string         `firestore:"status" json:"status"`
	Answers       []StoredAnswer `firestore:"answers" json:"answers"`
	// Server-calculated fields — never trusted from client
	Score         int  `firestore:"score" json:"score"`
	StarsEarned   int  `firestore:"starsEarned" json:"starsEarned"`
	XPEarned      int  `firestore:"xpEarned" json:"xpEarned"`
	Passed        bool `firestore:"passed" json:"passed"`
	AttemptNumber int  `firestore:"attemptNumber" json:"attemptNumber"`
}

// AttemptStartRequest is sent by the client to start a quiz.
type AttemptStartRequest struct {
	QuizID string `json:"quizId"`
}

// AttemptStartResponse is returned when a quiz session is created.
// Contains the attemptId and the sanitized (no correctAnswer) ordered questions.
type AttemptStartResponse struct {
	AttemptID string           `json:"attemptId"`
	Questions []QuestionPublic `json:"questions"`
	StartedAt time.Time        `json:"startedAt"`
}

// AttemptSubmitRequest is sent by the client to submit answers.
// Only selectedAnswer is trusted from client — backend calculates everything else.
type AttemptSubmitRequest struct {
	Answers []AnswerSubmission `json:"answers"`
}

// AttemptResult is the full result returned after submission.
// Only here does the frontend learn correctAnswers and explanations.
type AttemptResult struct {
	AttemptID       string           `json:"attemptId"`
	Score           int              `json:"score"`
	StarsEarned     int              `json:"starsEarned"`
	XPEarned        int              `json:"xpEarned"`
	Passed          bool             `json:"passed"`
	AttemptNumber   int              `json:"attemptNumber"`
	QuestionResults []QuestionResult `json:"questionResults"`
	// Progression info
	UnitComplete       bool   `json:"unitComplete"`
	UnlockRequestCreated bool `json:"unlockRequestCreated"`
	PersonalBest       bool   `json:"personalBest"`
}
