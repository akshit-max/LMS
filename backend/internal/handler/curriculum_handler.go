package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"grammoquest/internal/middleware"
	"grammoquest/internal/service"
)

// CurriculumHandler handles curriculum HTTP endpoints.
type CurriculumHandler struct {
	curriculumService *service.CurriculumService
}

func NewCurriculumHandler(curriculumService *service.CurriculumService) *CurriculumHandler {
	return &CurriculumHandler{curriculumService: curriculumService}
}

// ListUnits handles GET /api/v1/units
// Returns all units with the student's status for each.
func (h *CurriculumHandler) ListUnits(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	units, err := h.curriculumService.GetUnitsForStudent(r.Context(), uid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch units")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"units": units})
}

// ListChapters handles GET /api/v1/units/{unitID}/chapters
func (h *CurriculumHandler) ListChapters(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	unitID := chi.URLParam(r, "unitID")

	chapters, err := h.curriculumService.GetChaptersForStudent(r.Context(), uid, unitID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch chapters")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"chapters": chapters})
}

// GetChapter handles GET /api/v1/chapters/{chapterID}
func (h *CurriculumHandler) GetChapter(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	chapterID := chi.URLParam(r, "chapterID")

	chapter, err := h.curriculumService.GetChapterDetail(r.Context(), uid, chapterID)
	if err != nil {
		respondError(w, http.StatusNotFound, "chapter not found")
		return
	}
	respondJSON(w, http.StatusOK, chapter)
}

// GetProgress handles GET /api/v1/progress
func (h *CurriculumHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	progress, err := h.curriculumService.GetStudentProgress(r.Context(), uid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch progress")
		return
	}
	respondJSON(w, http.StatusOK, progress)
}

// ListChaptersRaw handles GET /api/v1/admin/units/{unitID}/chapters
// Admin-only endpoint: returns raw chapter list without student-status enrichment.
// The student-facing /units/{unitID}/chapters endpoint enriches chapters with
// the requesting user's chapterStatus — which would return "locked" for admin
// since admins have no chapterStatus documents.
func (h *CurriculumHandler) ListChaptersRaw(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unitID")
	chapters, err := h.curriculumService.GetChaptersRaw(r.Context(), unitID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch chapters")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"chapters": chapters})
}

// ListUnitsRaw handles GET /api/v1/admin/units
// Admin-only: returns units without student-status enrichment.
func (h *CurriculumHandler) ListUnitsRaw(w http.ResponseWriter, r *http.Request) {
	units, err := h.curriculumService.GetUnitsRaw(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch units")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"units": units})
}
