package middleware

import (
	"context"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
)

// contextKey is a private type for context keys to avoid collisions.
type contextKey string

const (
	// ContextKeyUID is the key for the authenticated user's Firebase UID in the request context.
	ContextKeyUID  contextKey = "uid"
	// ContextKeyRole is the key for the user's role (set from Firestore, not token claims).
	ContextKeyRole contextKey = "role"
)

// AuthMiddleware verifies the Firebase ID token in the Authorization header.
// It sets the uid in the request context for downstream handlers.
// Role is NOT trusted from the token — it is fetched from Firestore by the service layer.
func AuthMiddleware(authClient *auth.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
				return
			}

			idToken := parts[1]
			token, err := authClient.VerifyIDToken(context.Background(), idToken)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			// Store UID in context — this is the only value we trust from the token
			ctx := context.WithValue(r.Context(), ContextKeyUID, token.UID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUID retrieves the authenticated user's UID from the request context.
// Returns empty string if not set (should not happen after AuthMiddleware).
func GetUID(r *http.Request) string {
	uid, _ := r.Context().Value(ContextKeyUID).(string)
	return uid
}

// RequireRole is middleware that checks a user's role from the context.
// This is set by the handler/service after fetching from Firestore — not from the JWT.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(ContextKeyRole).(string)
			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		})
	}
}

// WithRole adds a role to the request context (called by handlers after Firestore lookup).
func WithRole(r *http.Request, role string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), ContextKeyRole, role))
}
