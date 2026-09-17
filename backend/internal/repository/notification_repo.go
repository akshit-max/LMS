package repository

import (
	"context"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"

	"grammoquest/internal/domain"
)

const (
	notificationsCollection = "notifications"
	auditLogsCollection     = "auditLogs"
)

// NotificationRepository handles in-app notifications and audit logs.
type NotificationRepository struct {
	db *firestore.Client
}

func NewNotificationRepository(db *firestore.Client) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create stores a new notification for a student.
func (r *NotificationRepository) Create(ctx context.Context, n *domain.Notification) error {
	n.ID = uuid.New().String()
	n.CreatedAt = time.Now()
	_, err := r.db.Collection(notificationsCollection).Doc(n.ID).Set(ctx, n)
	return err
}

// GetForUser returns all notifications for a user, newest first.
func (r *NotificationRepository) GetForUser(ctx context.Context, userID string) ([]*domain.Notification, error) {
	docs, err := r.db.Collection(notificationsCollection).
		Where("userId", "==", userID).
		OrderBy("createdAt", firestore.Desc).
		Limit(50).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	notifs := make([]*domain.Notification, 0, len(docs))
	for _, doc := range docs {
		var n domain.Notification
		if err := doc.DataTo(&n); err != nil {
			continue
		}
		notifs = append(notifs, &n)
	}
	return notifs, nil
}

// MarkRead marks a notification as read.
func (r *NotificationRepository) MarkRead(ctx context.Context, notifID string) error {
	_, err := r.db.Collection(notificationsCollection).Doc(notifID).Update(ctx, []firestore.Update{
		{Path: "isRead", Value: true},
	})
	return err
}

// UnreadCount returns the count of unread notifications for a user.
func (r *NotificationRepository) UnreadCount(ctx context.Context, userID string) (int, error) {
	docs, err := r.db.Collection(notificationsCollection).
		Where("userId", "==", userID).
		Where("isRead", "==", false).
		Documents(ctx).GetAll()
	if err != nil {
		return 0, err
	}
	return len(docs), nil
}

// WriteAuditLog records an admin action.
func (r *NotificationRepository) WriteAuditLog(ctx context.Context, log *domain.AuditLog) error {
	log.ID = uuid.New().String()
	log.Timestamp = time.Now()
	_, err := r.db.Collection(auditLogsCollection).Doc(log.ID).Set(ctx, log)
	return err
}
