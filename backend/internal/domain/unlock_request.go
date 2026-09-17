package domain

import "time"

// Unlock request statuses
const (
	UnlockStatusPending         = "pending"
	UnlockStatusApproved        = "approved"
	UnlockStatusRejected        = "rejected"
	UnlockStatusRetryRequested  = "retry_requested"
)

// UnlockRequest is created ONLY when a student completes ALL required quizzes
// in a Unit with a score >= 90% on each. It is NEVER created for a single quiz pass.
//
// The idempotencyKey (userId_unitId) prevents duplicate requests from being
// created if the submission endpoint is called more than once.
//
// Admin actions on this document use Firestore transactions to ensure atomicity:
//   Approve → unit status = available, notification created, audit log written
//   Reject  → request marked rejected, audit log written
type UnlockRequest struct {
	ID                string             `firestore:"id" json:"id"`
	UserID            string             `firestore:"userId" json:"userId"`
	UnitID            string             `firestore:"unitId" json:"unitId"`         // The completed unit
	CompletedQuizIDs  []string           `firestore:"completedQuizIds" json:"completedQuizIds"`
	QuizScores        map[string]int     `firestore:"quizScores" json:"quizScores"` // quizId → score
	LowestScore       int                `firestore:"lowestScore" json:"lowestScore"`
	TotalRetries      int                `firestore:"totalRetries" json:"totalRetries"`
	ToUnitID          string             `firestore:"toUnitId" json:"toUnitId"`     // Unit to unlock on approval
	Status            string             `firestore:"status" json:"status"`
	IdempotencyKey    string             `firestore:"idempotencyKey" json:"idempotencyKey"` // userId_unitId
	RequestedAt       time.Time          `firestore:"requestedAt" json:"requestedAt"`
	ReviewedAt        *time.Time         `firestore:"reviewedAt" json:"reviewedAt"`
	ReviewedBy        string             `firestore:"reviewedBy" json:"reviewedBy"`
	AdminNote         string             `firestore:"adminNote" json:"adminNote"`
}

// UnlockRequestAdminView includes extra student info for the admin dashboard.
type UnlockRequestAdminView struct {
	UnlockRequest
	StudentName  string `json:"studentName"`
	StudentEmail string `json:"studentEmail"`
	UnitTitle    string `json:"unitTitle"`
}

// AdminReviewRequest is the payload for admin approve/reject/retry actions.
type AdminReviewRequest struct {
	AdminNote string `json:"adminNote"`
}
