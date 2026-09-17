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
	userRepo          *repository.UserRepository
	adminService      *service.AdminService
	curriculumService *service.CurriculumService
	progressRepo      *repository.ProgressRepository
	questionAdminRepo *repository.QuestionAdminRepository
}

func NewAdminHandler(
	userRepo *repository.UserRepository,
	adminService *service.AdminService,
	curriculumService *service.CurriculumService,
	progressRepo *repository.ProgressRepository,
	questionAdminRepo *repository.QuestionAdminRepository,
) *AdminHandler {
	return &AdminHandler{
		userRepo:          userRepo,
		adminService:      adminService,
		curriculumService: curriculumService,
		progressRepo:      progressRepo,
		questionAdminRepo: questionAdminRepo,
	}
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
// Sets accountStatus → active and initializes chapter status for the student.
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

	// Initialize chapter status for the newly approved student so they can access Unit 1 content.
	// Errors here are non-fatal — the approval is already recorded.
	if h.curriculumService != nil {
		if initErr := h.curriculumService.InitializeChaptersForStudent(r.Context(), targetUID); initErr != nil {
			// Log but don't fail the request — student is approved, chapters can be re-initialized
			_ = initErr
		}
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "approved", "uid": targetUID})
}

// SuspendUser handles POST /api/v1/admin/users/{uid}/suspend
func (h *AdminHandler) SuspendUser(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	targetUID := chi.URLParam(r, "uid")

	if adminUID == targetUID {
		respondError(w, http.StatusForbidden, "Admins cannot suspend themselves")
		return
	}

	err := h.userRepo.Update(r.Context(), targetUID, map[string]interface{}{
		"accountStatus": "suspended",
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to suspend user")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "suspended", "uid": targetUID})
}

// GetUserProgress handles GET /api/v1/admin/users/{uid}/progress
func (h *AdminHandler) GetUserProgress(w http.ResponseWriter, r *http.Request) {
	targetUID := chi.URLParam(r, "uid")
	// The caller is already authenticated and authorized as admin via middleware in the router.
	progress, err := h.progressRepo.Get(r.Context(), targetUID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch progress")
		return
	}
	if progress == nil {
		respondError(w, http.StatusNotFound, "progress not found")
		return
	}
	respondJSON(w, http.StatusOK, progress)
}

// ReactivateUser handles POST /api/v1/admin/users/{uid}/reactivate
func (h *AdminHandler) ReactivateUser(w http.ResponseWriter, r *http.Request) {
	targetUID := chi.URLParam(r, "uid")
	err := h.userRepo.Update(r.Context(), targetUID, map[string]interface{}{
		"accountStatus": "active",
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to reactivate user")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "active", "uid": targetUID})
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

// ─── Question Management ──────────────────────────────────────────────────────

// ListQuestions handles GET /api/v1/admin/questions?chapterId=xxx
// Returns ALL question fields including correctAnswer — admin only.
func (h *AdminHandler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	chapterID := r.URL.Query().Get("chapterId")

	var questions interface{}
	var err error

	if chapterID != "" {
		questions, err = h.questionAdminRepo.GetByChapter(r.Context(), chapterID)
	} else {
		questions, err = h.questionAdminRepo.GetAll(r.Context())
	}

	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch questions")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"questions": questions})
}

// SetQuestionApproval handles POST /api/v1/admin/questions/{questionID}/approval
// Body: { "status": "approved" | "rejected" | "pending" }
func (h *AdminHandler) SetQuestionApproval(w http.ResponseWriter, r *http.Request) {
	questionID := chi.URLParam(r, "questionID")

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Status == "" {
		respondError(w, http.StatusBadRequest, "status required (approved|rejected|pending)")
		return
	}
	if body.Status != domain.ApprovalStatusApproved && body.Status != domain.ApprovalStatusRejected && body.Status != domain.ApprovalStatusPending {
		respondError(w, http.StatusBadRequest, "invalid status")
		return
	}

	if err := h.questionAdminRepo.SetApprovalStatus(r.Context(), questionID, body.Status); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update question status")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": body.Status, "questionId": questionID})
}

