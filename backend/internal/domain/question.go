package domain

import "time"

// Question types
const (
	QuestionTypeMCQ        = "mcq"
	QuestionTypeTrueFalse  = "true_false"
	QuestionTypeFillBlank  = "fill_blank"
	QuestionTypeReorder    = "reorder"
	QuestionTypeDragDrop   = "drag_drop"
	QuestionTypeMatch      = "match"
	QuestionTypeOddOneOut  = "odd_one_out"
)

// Tiers
const (
	TierAdmin   = "admin"
	TierTeacher = "teacher"
	TierStudent = "student"
)

// Approval statuses
const (
	ApprovalStatusApproved = "approved"
	ApprovalStatusPending  = "pending"
	ApprovalStatusRejected = "rejected"
)

// Question is the full server-side representation.
// The correctAnswer field MUST NEVER be sent to the frontend.
// Use QuestionPublic for all API responses to the client.
type Question struct {
	ID             string    `firestore:"id" json:"id"`
	QuizID         string    `firestore:"quizId" json:"quizId"`
	Type           string    `firestore:"type" json:"type"`
	Text           string    `firestore:"text" json:"text"`
	Options        []string  `firestore:"options" json:"options"`
	CorrectAnswer  string    `firestore:"correctAnswer" json:"-"` // json:"-" ensures it's never serialized
	Explanation    string    `firestore:"explanation" json:"-"`   // json:"-" only sent post-submission
	Difficulty     string    `firestore:"difficulty" json:"difficulty"`
	GrammarTopic   string    `firestore:"grammarTopic" json:"grammarTopic"`
	ChapterID      string    `firestore:"chapterId" json:"chapterId"`
	UnitID         string    `firestore:"unitId" json:"unitId"`
	Tier           string    `firestore:"tier" json:"tier"`
	CreatedBy      string    `firestore:"createdBy" json:"createdBy"`
	ApprovalStatus string    `firestore:"approvalStatus" json:"approvalStatus"`
	Status         string    `firestore:"status" json:"status"` // active | archived (soft-delete)
	Order          int       `firestore:"order" json:"order"`
	UsageCount     int       `firestore:"usageCount" json:"usageCount"`
	CreatedAt      time.Time `firestore:"createdAt" json:"createdAt"`
}

// QuestionPublic is the sanitized projection sent to the frontend during a quiz.
// It contains ZERO information about the correct answer.
type QuestionPublic struct {
	ID      string   `json:"id"`
	Type    string   `json:"type"`
	Text    string   `json:"text"`
	Options []string `json:"options"`
}

// QuestionResult is included in the attempt result response AFTER the student submits.
// Only then does the frontend learn what the correct answer was and see the explanation.
type QuestionResult struct {
	QuestionID    string `json:"questionId"`
	SelectedAnswer string `json:"selectedAnswer"`
	CorrectAnswer  string `json:"correctAnswer"`
	IsCorrect      bool   `json:"isCorrect"`
	Explanation    string `json:"explanation"`
	TimeTakenMs    int64  `json:"timeTakenMs"`
}

// ToPublic converts a full Question to its frontend-safe projection.
func (q *Question) ToPublic() QuestionPublic {
	return QuestionPublic{
		ID:      q.ID,
		Type:    q.Type,
		Text:    q.Text,
		Options: q.Options,
	}
}

// Question status constants (soft-delete)
const (
	QuestionStatusActive   = "active"
	QuestionStatusArchived = "archived"
)

// AdminQuestion is the full representation sent to admin endpoints.
// It exposes correctAnswer and explanation — never use this for student responses.
type AdminQuestion struct {
	ID             string    `json:"id"`
	QuizID         string    `json:"quizId"`
	Type           string    `json:"type"`
	Text           string    `json:"text"`
	Options        []string  `json:"options"`
	CorrectAnswer  string    `json:"correctAnswer"`
	Explanation    string    `json:"explanation"`
	Difficulty     string    `json:"difficulty"`
	GrammarTopic   string    `json:"grammarTopic"`
	ChapterID      string    `json:"chapterId"`
	UnitID         string    `json:"unitId"`
	Tier           string    `json:"tier"`
	CreatedBy      string    `json:"createdBy"`
	ApprovalStatus string    `json:"approvalStatus"`
	Status         string    `json:"status"`
	Order          int       `json:"order"`
	UsageCount     int       `json:"usageCount"`
	CreatedAt      time.Time `json:"createdAt"`
}

// ToAdmin converts a Question to its admin-safe projection (includes correctAnswer).
func (q *Question) ToAdmin() AdminQuestion {
	return AdminQuestion{
		ID:             q.ID,
		QuizID:         q.QuizID,
		Type:           q.Type,
		Text:           q.Text,
		Options:        q.Options,
		CorrectAnswer:  q.CorrectAnswer,
		Explanation:    q.Explanation,
		Difficulty:     q.Difficulty,
		GrammarTopic:   q.GrammarTopic,
		ChapterID:      q.ChapterID,
		UnitID:         q.UnitID,
		Tier:           q.Tier,
		CreatedBy:      q.CreatedBy,
		ApprovalStatus: q.ApprovalStatus,
		Status:         q.Status,
		Order:          q.Order,
		UsageCount:     q.UsageCount,
		CreatedAt:      q.CreatedAt,
	}
}
