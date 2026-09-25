package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"grammoquest/internal/domain"
	"grammoquest/internal/middleware"
	"grammoquest/internal/repository"
	"grammoquest/internal/service"
)

// QuizHandler handles quiz lifecycle HTTP endpoints.
type QuizHandler struct {
	quizService *service.QuizService
}

func NewQuizHandler(quizService *service.QuizService) *QuizHandler {
	return &QuizHandler{quizService: quizService}
}

// StartAttempt handles POST /api/v1/quizzes/{quizID}/start
// Creates an in-progress attempt and returns shuffled, sanitized questions.
// correctAnswer is NEVER included in the response.
func (h *QuizHandler) StartAttempt(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	quizID := chi.URLParam(r, "quizID")

	resp, err := h.quizService.StartAttempt(r.Context(), uid, quizID)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, resp)
}

// CheckAnswer handles POST /api/v1/attempts/{attemptID}/check-answer
// Validates a single question answer server-side and persists it to the in-progress attempt.
// Provides instant correct/wrong feedback without exposing the correct answer.
// Idempotent: if the same question is answered twice, the original result is returned (HTTP 200).
func (h *QuizHandler) CheckAnswer(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	attemptID := chi.URLParam(r, "attemptID")

	var req domain.CheckAnswerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.QuestionID == "" || req.SelectedAnswer == "" {
		respondError(w, http.StatusBadRequest, "questionId and selectedAnswer are required")
		return
	}

	result, err := h.quizService.CheckAnswer(r.Context(), uid, attemptID, req)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrAttemptNotFound):
			respondError(w, http.StatusNotFound, "attempt not found")
		case errors.Is(err, repository.ErrAttemptNotInProgress):
			respondError(w, http.StatusConflict, "attempt is already completed")
		default:
			respondError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	respondJSON(w, http.StatusOK, result)
}


// SubmitAttempt handles POST /api/v1/attempts/{attemptID}/submit
// Accepts only questionId + selectedAnswer per question.
// All grading, score, stars, XP are calculated server-side.
func (h *QuizHandler) SubmitAttempt(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	attemptID := chi.URLParam(r, "attemptID")

	var req domain.AttemptSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.quizService.SubmitAttempt(r.Context(), uid, attemptID, req.Answers)
	if err != nil {
		switch err {
		case repository.ErrAttemptAlreadyCompleted:
			respondError(w, http.StatusConflict, "attempt already submitted")
		case repository.ErrAttemptNotFound:
			respondError(w, http.StatusNotFound, "attempt not found")
		default:
			respondError(w, http.StatusInternalServerError, "failed to submit attempt")
		}
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetAttempt handles GET /api/v1/attempts/{attemptID}
// Returns a completed attempt result (used for result page refresh/resume).
func (h *QuizHandler) GetAttempt(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	attemptID := chi.URLParam(r, "attemptID")

	attempt, err := h.quizService.GetAttempt(r.Context(), uid, attemptID)
	if err != nil {
		respondError(w, http.StatusNotFound, "attempt not found")
		return
	}
	respondJSON(w, http.StatusOK, attempt)
}
