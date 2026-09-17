package domain

import "time"

// Unit is a top-level curriculum grouping (e.g. "The Simple Present Tense").
// A Unit contains multiple Chapters. Progression unlocks happen at the Unit level.
type Unit struct {
	ID           string    `firestore:"id" json:"id"`
	Title        string    `firestore:"title" json:"title"`
	Description  string    `firestore:"description" json:"description"`
	Order        int       `firestore:"order" json:"order"`
	ChapterCount int       `firestore:"chapterCount" json:"chapterCount"`
	IsActive     bool      `firestore:"isActive" json:"isActive"`
	CreatedAt    time.Time `firestore:"createdAt" json:"createdAt"`
}

// UnitStatus represents a student's access state for a Unit.
// The backend is the only authority that changes this.
type UnitStatus struct {
	UserID    string `firestore:"userId" json:"userId"`
	UnitID    string `firestore:"unitId" json:"unitId"`
	Status    string `firestore:"status" json:"status"` // locked | available | completed
	BestScore int    `firestore:"bestScore" json:"bestScore"`
}
