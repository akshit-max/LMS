package domain

import "time"

// Notification types
const (
	NotifTypeRankUp        = "rank_up"
	NotifTypeChapterUnlock = "chapter_unlock"
	NotifTypeBadgeEarned   = "badge_earned"
	NotifTypeStreakMilestone = "streak_milestone"
	NotifTypeBotUnlock     = "bot_unlock"
	NotifTypeQuestionApproved = "question_approved"
	NotifTypeUnlockReviewed = "unlock_reviewed"
)

// Notification is created by the backend (never the frontend) for in-app alerts.
type Notification struct {
	ID        string    `firestore:"id" json:"id"`
	UserID    string    `firestore:"userId" json:"userId"`
	Type      string    `firestore:"type" json:"type"`
	Title     string    `firestore:"title" json:"title"`
	Body      string    `firestore:"body" json:"body"`
	IsRead    bool      `firestore:"isRead" json:"isRead"`
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
}

// AuditLog records all sensitive admin actions for security auditing.
type AuditLog struct {
	ID        string                 `firestore:"id" json:"id"`
	ActorID   string                 `firestore:"actorId" json:"actorId"`
	Action    string                 `firestore:"action" json:"action"`
	TargetID  string                 `firestore:"targetId" json:"targetId"`
	Details   map[string]interface{} `firestore:"details" json:"details"`
	Timestamp time.Time              `firestore:"timestamp" json:"timestamp"`
	IPAddress string                 `firestore:"ipAddress" json:"ipAddress"`
}
