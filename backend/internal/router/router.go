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
	badgeRepo         := repository.NewBadgeRepository(fb.Firestore)
	questionAdminRepo := repository.NewQuestionAdminRepository(fb.Firestore)

	// ─── Services ────────────────────────────────────────────────────────────
	authService       := service.NewAuthService(userRepo)
	curriculumService := service.NewCurriculumService(unitRepo, chapterRepo, chapterStatusRepo, progressRepo)

	// ProgressionService must be created before QuizService (passed as dep)
	progressionService := service.NewProgressionService(
		chapterRepo, chapterStatusRepo, attemptRepo, unlockRepo, notifRepo, unitRepo,
	)

	badgeService := service.NewBadgeService(badgeRepo, notifRepo, progressRepo)

	quizService := service.NewQuizService(
		quizRepo, attemptRepo, chapterStatusRepo, progressRepo, progressionService, badgeService, notifRepo,
	)

	adminService := service.NewAdminService(
		unlockRepo, chapterRepo, chapterStatusRepo, notifRepo, userRepo, unitRepo, fb.Firestore,
	)

	practiceService := service.NewPracticeService(quizRepo, attemptRepo)

	// ─── Handlers ─────────────────────────────────────────────────────────────
	authHandler         := handler.NewAuthHandler(authService)
	curriculumHandler   := handler.NewCurriculumHandler(curriculumService)
	adminHandler        := handler.NewAdminHandler(userRepo, adminService, curriculumService, progressRepo, questionAdminRepo)
	quizHandler         := handler.NewQuizHandler(quizService)
	notifHandler        := handler.NewNotificationHandler(notifRepo, unlockRepo)
	badgeHandler        := handler.NewBadgeHandler(badgeRepo)
	practiceHandler     := handler.NewPracticeHandler(practiceService)
	leaderboardHandler  := handler.NewLeaderboardHandler(progressRepo, userRepo)

	// ─── Middleware ───────────────────────────────────────────────────────────
	authMiddleware := middleware.AuthMiddleware(fb.Auth)
	corsMiddleware := middleware.CORSMiddleware(cfg.FrontendURL)

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)
	r.Use(func(next http.Handler) http.Handler { return corsMiddleware(next) })

	healthCheck := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"grammoquest-api","milestone":"M4"}`))
	}
	r.Get("/health", healthCheck)
	r.Head("/health", healthCheck)

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

		// ── Student: Badges + Progress ────────────────────────────────────────
		r.Get("/me/badges", badgeHandler.ListMyBadges)

		// ── Leaderboard ────────────────────────────────────────────────
		r.Get("/leaderboard", leaderboardHandler.GetLeaderboard)

		// ── Practice Arena ─────────────────────────────────────────────
		// Separate from normal quiz — no progression/XP side effects
		r.Post("/practice/quizzes/{quizID}/start", practiceHandler.StartPractice)
		r.Post("/practice/attempts/{attemptID}/submit", practiceHandler.SubmitPractice)

		// ── Admin ─────────────────────────────────────────────────────────────
		// Role is always verified from Firestore — never trusted from the JWT.
		r.Route("/admin", func(r chi.Router) {
			r.Use(requireRoleMiddleware(userRepo, domain.RoleAdmin))

			// User management
			r.Get("/users", adminHandler.ListUsers)
			r.Get("/users/{uid}/progress", adminHandler.GetUserProgress)
			r.Post("/users/{uid}/approve", adminHandler.ApproveUser)
			r.Post("/users/{uid}/suspend", adminHandler.SuspendUser)
			r.Post("/users/{uid}/reactivate", adminHandler.ReactivateUser)

			// Unlock request queue — the core M4 admin workflow
			r.Get("/unlock-requests", adminHandler.ListUnlockRequests)
			r.Post("/unlock-requests/{requestID}/approve", adminHandler.ApproveUnlock)
			r.Post("/unlock-requests/{requestID}/reject", adminHandler.RejectUnlock)
			r.Post("/unlock-requests/{requestID}/retry", adminHandler.RequestRetry)

			// Admin curriculum — raw, non-student-personalized views
			r.Get("/units", curriculumHandler.ListUnitsRaw)
			r.Get("/units/{unitID}/chapters", curriculumHandler.ListChaptersRaw)

			// Admin question management
			r.Get("/questions", adminHandler.ListQuestions)
			r.Post("/questions/{questionID}/approval", adminHandler.SetQuestionApproval)
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
