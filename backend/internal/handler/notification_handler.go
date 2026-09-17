package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"grammoquest/internal/middleware"
	"grammoquest/internal/repository"
)

// NotificationHandler serves student notifications and student-level unlock request status.
type NotificationHandler struct {
	notifRepo    *repository.NotificationRepository
	unlockRepo   *repository.UnlockRequestRepository
}

func NewNotificationHandler(
	notifRepo *repository.NotificationRepository,
	unlockRepo *repository.UnlockRequestRepository,
) *NotificationHandler {
	return &NotificationHandler{notifRepo: notifRepo, unlockRepo: unlockRepo}
}

// ListNotifications handles GET /api/v1/notifications
func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	notifs, err := h.notifRepo.GetForUser(r.Context(), uid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch notifications")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"notifications": notifs})
}

// UnreadCount handles GET /api/v1/notifications/unread-count
func (h *NotificationHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	count, err := h.notifRepo.UnreadCount(r.Context(), uid)
	if err != nil {
		count = 0
	}
	respondJSON(w, http.StatusOK, map[string]int{"unreadCount": count})
}

// MarkRead handles POST /api/v1/notifications/{notifID}/read
func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	notifID := chi.URLParam(r, "notifID")
	if err := h.notifRepo.MarkRead(r.Context(), notifID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to mark notification as read")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GetMyUnlockRequests handles GET /api/v1/me/unlock-requests
// Returns the student's own unlock requests (so they can see pending/approved/rejected status).
func (h *NotificationHandler) GetMyUnlockRequests(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	requests, err := h.unlockRepo.GetForUser(r.Context(), uid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch unlock requests")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"requests": requests})
}
