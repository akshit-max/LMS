package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"grammoquest/internal/domain"
	"grammoquest/internal/middleware"
	"grammoquest/internal/service"
)

// PracticeHandler handles Practice Arena endpoints.
// Practice sessions use the same quiz/question infrastructure but:
//   - No progression: no chapter status update, no unit completion, no unlock request
//   - No XP/stars awarded
//   - No daily mission count
//   - Untimed (timer is frontend-only; backend does not enforce it)
//
// The quiz start is the same as normal — creates an attempt.
// The submit is different — grades answers but skips all progression/reward side effects.
type PracticeHandler struct {
	practiceService *service.PracticeService
}

func NewPracticeHandler(practiceService *service.PracticeService) *PracticeHandler {
	return &PracticeHandler{practiceService: practiceService}
}

// StartPractice handles POST /api/v1/practice/quizzes/{quizID}/start
func (h *PracticeHandler) StartPractice(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	quizID := chi.URLParam(r, "quizID")

	resp, err := h.practiceService.StartPractice(r.Context(), uid, quizID)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, resp)
}

// SubmitPractice handles POST /api/v1/practice/attempts/{attemptID}/submit
// Grades answers but does NOT update any progression, XP, stars, or missions.
func (h *PracticeHandler) SubmitPractice(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	attemptID := chi.URLParam(r, "attemptID")

	var req domain.AttemptSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.practiceService.SubmitPractice(r.Context(), uid, attemptID, req.Answers)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, result)
}
