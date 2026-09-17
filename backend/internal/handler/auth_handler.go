package handler

import (
	"encoding/json"
	"net/http"

	"grammoquest/internal/middleware"
	"grammoquest/internal/service"
)

// AuthHandler handles authentication-related HTTP endpoints.
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// GetOrCreateProfile handles POST /api/v1/auth/profile
// Called after Firebase Auth login to create or retrieve the user's Firestore profile.
// The Firebase UID comes from the verified JWT in the middleware — not from the request body.
func (h *AuthHandler) GetOrCreateProfile(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	if uid == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req service.ProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Override uid from JWT — never trust uid from body
	req.UID = uid

	user, err := h.authService.GetOrCreateProfile(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create profile")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// GetMyProfile handles GET /api/v1/auth/me
// Returns the current user's profile.
func (h *AuthHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	uid := middleware.GetUID(r)
	if uid == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.authService.GetProfile(r.Context(), uid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch profile")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// --- Shared response helpers ---

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
