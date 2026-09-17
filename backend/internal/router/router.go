package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"grammoquest/internal/config"
	"grammoquest/internal/domain"
	"grammoquest/internal/handler"
	"grammoquest/internal/media"
	"grammoquest/internal/middleware"
	"grammoquest/internal/repository"
	"grammoquest/internal/service"
)

// New creates the main chi router with all routes registered.
// Dependencies are wired via manual dependency injection — no DI framework.
func New(fb *config.FirebaseClients, cfg *config.Config, mediaSvc media.MediaService) http.Handler {
	// ─── Repositories ────────────────────────────────────────────────────────
	userRepo          := repository.NewUserRepository(fb.Firestore)
	unitRepo          := repository.NewUnitRepository(fb.Firestore)
	chapterRepo       := repository.NewChapterRepository(fb.Firestore)
	chapterStatusRepo := repository.NewChapterStatusRepository(fb.Firestore)
	progressRepo      := repository.NewProgressRepository(fb.Firestore)
	quizRepo          := repository.NewQuizRepository(fb.Firestore)
	attemptRepo       := repository.NewAttemptRepository(fb.Firestore)
	unlockRepo        := repository.NewUnlockRequestRepository(fb.Firestore)
	notifRepo         := repository.NewNotificationRepository(fb.Firestore)

	// ─── Services ────────────────────────────────────────────────────────────
	authService       := service.NewAuthService(userRepo)
	curriculumService := service.NewCurriculumService(unitRepo, chapterRepo, chapterStatusRepo, progressRepo)

	// ProgressionService must be created before QuizService (passed as dep)
	progressionService := service.NewProgressionService(
		chapterRepo, chapterStatusRepo, attemptRepo, unlockRepo, notifRepo, unitRepo,
	)

	quizService := service.NewQuizService(
		quizRepo, attemptRepo, chapterStatusRepo, progressRepo, progressionService,
	)

	adminService := service.NewAdminService(
		unlockRepo, chapterRepo, chapterStatusRepo, notifRepo, userRepo, unitRepo, fb.Firestore,
	)

	// ─── Handlers ─────────────────────────────────────────────────────────────
	authHandler         := handler.NewAuthHandler(authService)
	curriculumHandler   := handler.NewCurriculumHandler(curriculumService)
	adminHandler        := handler.NewAdminHandler(userRepo, adminService)
	quizHandler         := handler.NewQuizHandler(quizService)
	notifHandler        := handler.NewNotificationHandler(notifRepo, unlockRepo)

	// ─── Middleware ───────────────────────────────────────────────────────────
	authMiddleware := middleware.AuthMiddleware(fb.Auth)
	corsMiddleware := middleware.CORSMiddleware(cfg.FrontendURL)

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)
	r.Use(func(next http.Handler) http.Handler { return corsMiddleware(next) })

	// Health check (no auth)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"grammoquest-api","milestone":"M4"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(authMiddleware)

		// ── Auth ──────────────────────────────────────────────────────────────
		r.Post("/auth/profile", authHandler.GetOrCreateProfile)
		r.Get("/auth/me", authHandler.GetMyProfile)

		// ── Student: Curriculum ───────────────────────────────────────────────
		r.Get("/units", curriculumHandler.ListUnits)
		r.Get("/units/{unitID}/chapters", curriculumHandler.ListChapters)
		r.Get("/chapters/{chapterID}", curriculumHandler.GetChapter)
		r.Get("/progress", curriculumHandler.GetProgress)

		// ── Quiz Engine ───────────────────────────────────────────────────────
		r.Post("/quizzes/{quizID}/start", quizHandler.StartAttempt)
		r.Post("/attempts/{attemptID}/submit", quizHandler.SubmitAttempt)
		r.Get("/attempts/{attemptID}", quizHandler.GetAttempt)

		// ── Student: Notifications + Own Unlock Requests ──────────────────────
		r.Get("/notifications", notifHandler.ListNotifications)
		r.Get("/notifications/unread-count", notifHandler.UnreadCount)
		r.Post("/notifications/{notifID}/read", notifHandler.MarkRead)
		r.Get("/me/unlock-requests", notifHandler.GetMyUnlockRequests)

		// ── Admin ─────────────────────────────────────────────────────────────
		// Role is always verified from Firestore — never trusted from the JWT.
		r.Route("/admin", func(r chi.Router) {
			r.Use(requireRoleMiddleware(userRepo, domain.RoleAdmin))

			// User management
			r.Get("/users", adminHandler.ListUsers)
			r.Post("/users/{uid}/approve", adminHandler.ApproveUser)
			r.Post("/users/{uid}/suspend", adminHandler.SuspendUser)

			// Unlock request queue — the core M4 admin workflow
			r.Get("/unlock-requests", adminHandler.ListUnlockRequests)
			r.Post("/unlock-requests/{requestID}/approve", adminHandler.ApproveUnlock)
			r.Post("/unlock-requests/{requestID}/reject", adminHandler.RejectUnlock)
			r.Post("/unlock-requests/{requestID}/retry", adminHandler.RequestRetry)
		})
	})

	return r
}

// requireRoleMiddleware verifies the user's role from Firestore (never from JWT).
func requireRoleMiddleware(userRepo *repository.UserRepository, allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			uid := middleware.GetUID(r)
			if uid == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			user, err := userRepo.GetByUID(r.Context(), uid)
			if err != nil || user == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			for _, role := range allowedRoles {
				if user.Role == role {
					r = middleware.WithRole(r, user.Role)
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		})
	}
}
