package handler

import (
	"net/http"

	"grammoquest/internal/middleware"
	"grammoquest/internal/repository"
)

// BadgeHandler serves badge-related endpoints for students.
type BadgeHandler struct {
	badgeRepo *repository.BadgeRepository
}

func NewBadgeHandler(badgeRepo *repository.BadgeRepository) *BadgeHandler {
	return &BadgeHandler{badgeRepo: badgeRepo}
}

// ListMyBadges handles GET /api/v1/me/badges
// Returns all badge awards for the authenticated student, enriched with catalog details.
func (h *BadgeHandler) ListMyBadges(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	badges, err := h.badgeRepo.GetForUser(r.Context(), uid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch badges")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"badges": badges})
}
