package domain

import "time"

// Quiz belongs to a Chapter. A Chapter has exactly one Quiz.
// A Unit's quiz completion check evaluates all chapter quizzes in the unit.
type Quiz struct {
	ID          string    `firestore:"id" json:"id"`
	ChapterID   string    `firestore:"chapterId" json:"chapterId"`
	UnitID      string    `firestore:"unitId" json:"unitId"`
	Title       string    `firestore:"title" json:"title"`
	QuestionIDs []string  `firestore:"questionIds" json:"questionIds"`
	PassingScore int      `firestore:"passingScore" json:"passingScore"` // default 90
	Tier        string    `firestore:"tier" json:"tier"` // admin | teacher | student
	CreatedBy   string    `firestore:"createdBy" json:"createdBy"`
	IsActive    bool      `firestore:"isActive" json:"isActive"`
	CreatedAt   time.Time `firestore:"createdAt" json:"createdAt"`
}

// QuizPublic is what the frontend receives — metadata only, no correctAnswer.
type QuizPublic struct {
	ID           string           `json:"id"`
	ChapterID    string           `json:"chapterId"`
	UnitID       string           `json:"unitId"`
	Title        string           `json:"title"`
	TotalQuestions int            `json:"totalQuestions"`
	PassingScore int              `json:"passingScore"`
}
