package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"grammoquest/internal/domain"
	"grammoquest/internal/middleware"
	"grammoquest/internal/repository"
	"grammoquest/internal/service"
)

// AdminHandler handles all admin HTTP endpoints.
type AdminHandler struct {
	userRepo     *repository.UserRepository
	adminService *service.AdminService
}

func NewAdminHandler(userRepo *repository.UserRepository, adminService *service.AdminService) *AdminHandler {
	return &AdminHandler{userRepo: userRepo, adminService: adminService}
}

// ListUsers handles GET /api/v1/admin/users
func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch users")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}

// ApproveUser handles POST /api/v1/admin/users/{uid}/approve
// Sets accountStatus → active. Student progression init in M4.
func (h *AdminHandler) ApproveUser(w http.ResponseWriter, r *http.Request) {
	targetUID := chi.URLParam(r, "uid")
	if targetUID == "" {
		respondError(w, http.StatusBadRequest, "uid required")
		return
	}
	err := h.userRepo.Update(r.Context(), targetUID, map[string]interface{}{
		"accountStatus": "active",
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to approve user")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "approved", "uid": targetUID})
}

// SuspendUser handles POST /api/v1/admin/users/{uid}/suspend
func (h *AdminHandler) SuspendUser(w http.ResponseWriter, r *http.Request) {
	targetUID := chi.URLParam(r, "uid")
	err := h.userRepo.Update(r.Context(), targetUID, map[string]interface{}{
		"accountStatus": "suspended",
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to suspend user")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "suspended", "uid": targetUID})
}

// ─── Unlock Request handlers ──────────────────────────────────────────────────

// ListUnlockRequests handles GET /api/v1/admin/unlock-requests
// Returns all pending unlock requests enriched with student/unit info.
func (h *AdminHandler) ListUnlockRequests(w http.ResponseWriter, r *http.Request) {
	requests, err := h.adminService.GetPendingRequests(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch unlock requests")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"requests": requests})
}

// ApproveUnlock handles POST /api/v1/admin/unlock-requests/{requestID}/approve
func (h *AdminHandler) ApproveUnlock(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	requestID := chi.URLParam(r, "requestID")

	var body domain.AdminReviewRequest
	_ = json.NewDecoder(r.Body).Decode(&body)

	if err := h.adminService.ApproveUnlock(r.Context(), adminUID, requestID, body.AdminNote); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "approved"})
}

// RejectUnlock handles POST /api/v1/admin/unlock-requests/{requestID}/reject
func (h *AdminHandler) RejectUnlock(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	requestID := chi.URLParam(r, "requestID")

	var body domain.AdminReviewRequest
	_ = json.NewDecoder(r.Body).Decode(&body)

	if err := h.adminService.RejectUnlock(r.Context(), adminUID, requestID, body.AdminNote); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "rejected"})
}

// RequestRetry handles POST /api/v1/admin/unlock-requests/{requestID}/retry
func (h *AdminHandler) RequestRetry(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	requestID := chi.URLParam(r, "requestID")

	var body domain.AdminReviewRequest
	_ = json.NewDecoder(r.Body).Decode(&body)

	if err := h.adminService.RequestRetry(r.Context(), adminUID, requestID, body.AdminNote); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "retry_requested"})
}
