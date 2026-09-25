package domain

import "time"

// Chapter is a lesson within a Unit. Each Chapter has an associated Quiz.
type Chapter struct {
	ID             string    `firestore:"id" json:"id"`
	UnitID         string    `firestore:"unitId" json:"unitId"`
	Title          string    `firestore:"title" json:"title"`
	Description    string    `firestore:"description" json:"description"`
	Order          int       `firestore:"order" json:"order"`
	LessonVideoURL string    `firestore:"lessonVideoUrl" json:"lessonVideoUrl"`
	PDFURL         string    `firestore:"pdfUrl" json:"pdfUrl"`
	QuizID         string    `firestore:"quizId" json:"quizId"`
	IsActive       bool      `firestore:"isActive" json:"isActive"`
	Status         string    `firestore:"status" json:"status"` // draft | published | archived
	CreatedAt      time.Time `firestore:"createdAt" json:"createdAt"`
	CreatedBy      string    `firestore:"createdBy" json:"createdBy"`
}

// ChapterStatus records a student's progress for a specific chapter.
// Document ID in Firestore: {userId}_{chapterId}
// The backend is the ONLY authority that writes to this — never the frontend.
type ChapterStatus struct {
	UserID          string     `firestore:"userId" json:"userId"`
	ChapterID       string     `firestore:"chapterId" json:"chapterId"`
	UnitID          string     `firestore:"unitId" json:"unitId"`
	Status          string     `firestore:"status" json:"status"` // locked | available | completed
	BestScore       int        `firestore:"bestScore" json:"bestScore"`
	BestStars       int        `firestore:"bestStars" json:"bestStars"`
	UnlockRequestID string     `firestore:"unlockRequestId" json:"unlockRequestId"`
	CompletedAt     *time.Time `firestore:"completedAt" json:"completedAt"`
}
