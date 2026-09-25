package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"grammoquest/internal/domain"
	"grammoquest/internal/media"
	"grammoquest/internal/middleware"
	"grammoquest/internal/service"
)

// CMSHandler handles all admin Curriculum Management System (CMS) endpoints.
// All routes are protected by the admin role middleware in the router.
type CMSHandler struct {
	cmsService *service.CMSService
	mediaSvc   media.MediaService
}

func NewCMSHandler(cmsService *service.CMSService, mediaSvc media.MediaService) *CMSHandler {
	return &CMSHandler{cmsService: cmsService, mediaSvc: mediaSvc}
}

// ── Units ──────────────────────────────────────────────────────────────────────

// ListUnitsAdmin handles GET /api/v1/admin/cms/units
func (h *CMSHandler) ListUnitsAdmin(w http.ResponseWriter, r *http.Request) {
	units, err := h.cmsService.ListUnitsAdmin(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list units")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"units": units})
}

// GetUnit handles GET /api/v1/admin/cms/units/{unitID}
func (h *CMSHandler) GetUnit(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unitID")
	unit, err := h.cmsService.GetUnitAdmin(r.Context(), unitID)
	if err != nil {
		respondError(w, http.StatusNotFound, "unit not found")
		return
	}
	respondJSON(w, http.StatusOK, unit)
}

// CreateUnit handles POST /api/v1/admin/cms/units
func (h *CMSHandler) CreateUnit(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	var req service.CreateUnitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.CreatedBy = adminUID
	unit, err := h.cmsService.CreateUnit(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, unit)
}

// UpdateUnit handles PATCH /api/v1/admin/cms/units/{unitID}
func (h *CMSHandler) UpdateUnit(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	unitID := chi.URLParam(r, "unitID")
	var req service.UpdateUnitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.UpdatedBy = adminUID
	if err := h.cmsService.UpdateUnit(r.Context(), unitID, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ── Chapters ───────────────────────────────────────────────────────────────────

// ListChaptersAdmin handles GET /api/v1/admin/cms/units/{unitID}/chapters
func (h *CMSHandler) ListChaptersAdmin(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unitID")
	chapters, err := h.cmsService.ListChaptersAdmin(r.Context(), unitID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list chapters")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"chapters": chapters})
}

// GetChapter handles GET /api/v1/admin/cms/chapters/{chapterID}
func (h *CMSHandler) GetChapter(w http.ResponseWriter, r *http.Request) {
	chapterID := chi.URLParam(r, "chapterID")
	chapter, err := h.cmsService.GetChapterAdmin(r.Context(), chapterID)
	if err != nil {
		respondError(w, http.StatusNotFound, "chapter not found")
		return
	}
	// Also fetch quiz for this chapter
	quiz, _ := h.cmsService.GetQuizByChapter(r.Context(), chapterID)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"chapter": chapter,
		"quiz":    quiz,
	})
}

// CreateChapter handles POST /api/v1/admin/cms/units/{unitID}/chapters
func (h *CMSHandler) CreateChapter(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	unitID := chi.URLParam(r, "unitID")
	var req service.CreateChapterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.UnitID = unitID
	req.CreatedBy = adminUID
	chapter, err := h.cmsService.CreateChapter(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, chapter)
}

// UpdateChapter handles PATCH /api/v1/admin/cms/chapters/{chapterID}
func (h *CMSHandler) UpdateChapter(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	chapterID := chi.URLParam(r, "chapterID")
	var req service.UpdateChapterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.UpdatedBy = adminUID
	if err := h.cmsService.UpdateChapter(r.Context(), chapterID, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ── Quizzes ────────────────────────────────────────────────────────────────────

// GetQuizAdmin handles GET /api/v1/admin/cms/quizzes/{quizID}
func (h *CMSHandler) GetQuizAdmin(w http.ResponseWriter, r *http.Request) {
	quizID := chi.URLParam(r, "quizID")
	quiz, err := h.cmsService.GetQuizAdmin(r.Context(), quizID)
	if err != nil || quiz == nil {
		respondError(w, http.StatusNotFound, "quiz not found")
		return
	}
	// Fetch questions for this quiz
	questions, _ := h.cmsService.ListQuestionsAdmin(r.Context(), quizID)
	adminQs := make([]domain.AdminQuestion, 0, len(questions))
	for _, q := range questions {
		adminQs = append(adminQs, q.ToAdmin())
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"quiz":      quiz,
		"questions": adminQs,
	})
}

// CreateQuiz handles POST /api/v1/admin/cms/chapters/{chapterID}/quiz
func (h *CMSHandler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	chapterID := chi.URLParam(r, "chapterID")
	var req service.CreateQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.ChapterID = chapterID
	req.CreatedBy = adminUID
	quiz, err := h.cmsService.CreateQuiz(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, quiz)
}

// UpdateQuiz handles PATCH /api/v1/admin/cms/quizzes/{quizID}
func (h *CMSHandler) UpdateQuiz(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	quizID := chi.URLParam(r, "quizID")
	var req service.UpdateQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.UpdatedBy = adminUID
	if err := h.cmsService.UpdateQuiz(r.Context(), quizID, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ── Questions ──────────────────────────────────────────────────────────────────

// ListQuestionsAdmin handles GET /api/v1/admin/cms/quizzes/{quizID}/questions
func (h *CMSHandler) ListQuestionsAdmin(w http.ResponseWriter, r *http.Request) {
	quizID := chi.URLParam(r, "quizID")
	questions, err := h.cmsService.ListQuestionsAdmin(r.Context(), quizID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list questions")
		return
	}
	adminQs := make([]domain.AdminQuestion, 0, len(questions))
	for _, q := range questions {
		adminQs = append(adminQs, q.ToAdmin())
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"questions": adminQs})
}

// CreateQuestion handles POST /api/v1/admin/cms/quizzes/{quizID}/questions
func (h *CMSHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	quizID := chi.URLParam(r, "quizID")
	var req service.CreateQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.QuizID = quizID
	req.CreatedBy = adminUID
	question, err := h.cmsService.CreateQuestion(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, question.ToAdmin())
}

// UpdateQuestion handles PATCH /api/v1/admin/cms/questions/{questionID}
func (h *CMSHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	questionID := chi.URLParam(r, "questionID")
	var req service.UpdateQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.UpdatedBy = adminUID
	if err := h.cmsService.UpdateQuestion(r.Context(), questionID, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ArchiveQuestion handles DELETE /api/v1/admin/cms/questions/{questionID}
// Soft-deletes the question (status=archived) to preserve historical attempts.
func (h *CMSHandler) ArchiveQuestion(w http.ResponseWriter, r *http.Request) {
	adminUID := middleware.GetUID(r)
	questionID := chi.URLParam(r, "questionID")
	if err := h.cmsService.ArchiveQuestion(r.Context(), adminUID, questionID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "archived"})
}

// ── Media Upload ───────────────────────────────────────────────────────────────

// UploadMedia handles POST /api/v1/admin/cms/media/upload
// Accepts multipart/form-data with field "file" and optional "folder".
// Returns the Cloudinary secure URL.
func (h *CMSHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	if h.mediaSvc == nil {
		respondError(w, http.StatusServiceUnavailable, "media service not configured")
		return
	}

	// Limit upload size to 100MB
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "failed to parse multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "file field is required")
		return
	}
	defer file.Close()

	folder := r.FormValue("folder")
	if folder == "" {
		folder = "lessons"
	}
	// Sanitize folder name
	folder = strings.ReplaceAll(folder, "..", "")
	folder = strings.Trim(folder, "/")

	// Write to a temp file so we can pass a path to the MediaService
	ext := filepath.Ext(header.Filename)
	tmp, err := os.CreateTemp("", "grammoquest-upload-*"+ext)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create temp file")
		return
	}
	defer os.Remove(tmp.Name())
	defer tmp.Close()

	if _, err := io.Copy(tmp, file); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to buffer upload")
		return
	}
	tmp.Close()

	url, err := h.mediaSvc.UploadMedia(r.Context(), tmp.Name(), folder)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "upload failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"url": url})
}
