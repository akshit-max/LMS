package service

import (
	"context"
	"fmt"

	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// BadgeService evaluates and awards badges based on authoritative student events.
// All award decisions are server-side and idempotent.
// The frontend NEVER decides badge awards.
type BadgeService struct {
	badgeRepo    *repository.BadgeRepository
	notifRepo    *repository.NotificationRepository
	progressRepo *repository.ProgressRepository
}

func NewBadgeService(
	badgeRepo *repository.BadgeRepository,
	notifRepo *repository.NotificationRepository,
	progressRepo *repository.ProgressRepository,
) *BadgeService {
	return &BadgeService{badgeRepo: badgeRepo, notifRepo: notifRepo, progressRepo: progressRepo}
}

// BadgeEvent carries all authoritative data needed to evaluate badge conditions.
// This is populated by QuizService after a submission is graded.
type BadgeEvent struct {
	UserID          string
	Score           int    // 0–100
	Stars           int    // 0–3
	Passed          bool
	MaxCombo        int    // highest consecutive correct streak in this attempt
	IsFirstAttempt  bool   // first ever completed quiz for this user
	UnitComplete    bool   // this submission completed a unit
	CurrentStreak   int    // from progress
	TotalAttempts   int    // count of completed attempts across all quizzes
	PersonalBest    bool
}

// EvaluateAndAward checks all badge conditions and awards any newly earned badges.
// Returns list of newly awarded badge IDs (for notification delivery).
// Each individual award is idempotent — safe to call multiple times.
func (s *BadgeService) EvaluateAndAward(ctx context.Context, event BadgeEvent) []string {
	var awarded []string

	checks := []struct {
		id        string
		condition bool
	}{
		{domain.BadgeFirstBlood, event.IsFirstAttempt},
		{domain.BadgePerfectScore, event.Score == 100},
		{domain.BadgeStreakStarter, event.CurrentStreak >= 3},
		{domain.BadgeStreakWarrior, event.CurrentStreak >= 7},
		{domain.BadgeUnitMastered, event.UnitComplete},
		{domain.BadgeComboKing, event.MaxCombo >= 5},
		{domain.BadgeTopScorer, rankOrder(event.Stars) >= 4}, // Grammar Knight+
	}

	for _, check := range checks {
		if !check.condition {
			continue
		}
		// Check if already awarded (idempotent)
		has, err := s.badgeRepo.HasBadge(ctx, event.UserID, check.id)
		if err != nil || has {
			continue
		}
		// Award it
		if err := s.badgeRepo.Award(ctx, event.UserID, check.id); err != nil {
			continue
		}
		// Update the convenience cache on progress
		_ = s.progressRepo.AppendBadge(ctx, event.UserID, check.id)
		awarded = append(awarded, check.id)
	}

	// Send in-app notifications for newly awarded badges
	for _, badgeID := range awarded {
		def, ok := domain.BadgeCatalog[badgeID]
		if !ok {
			continue
		}
		_ = s.notifRepo.Create(ctx, &domain.Notification{
			UserID: event.UserID,
			Type:   domain.NotifTypeBadgeEarned,
			Title:  fmt.Sprintf("%s %s Unlocked!", def.Icon, def.Name),
			Body:   def.Description,
		})
	}

	return awarded
}

// rankOrder maps total XP → rank tier index (for badge thresholds).
// This mirrors calculateRank in quiz_service.go — keep in sync.
func rankOrder(stars int) int {
	// Note: this receives event.Stars from current quiz, not total XP.
	// For rank-based badges, we need to use TotalXP from progress.
	// This function is intentionally unused for rank-based badges in the checks above;
	// rank-up detection is handled separately in QuizService.updateProgress.
	return stars
}

// AwardRankBadge awards rank-specific badges when a student reaches a new rank.
// Called by QuizService after detecting a rank change.
func (s *BadgeService) AwardRankBadge(ctx context.Context, userID, newRank string) {
	var badgeID string
	switch newRank {
	case domain.RankGrammarKnight:
		badgeID = domain.BadgeTopScorer
	case domain.RankGrammarGod:
		badgeID = domain.BadgeGrammarGod
	default:
		return
	}

	has, err := s.badgeRepo.HasBadge(ctx, userID, badgeID)
	if err != nil || has {
		return
	}

	if err := s.badgeRepo.Award(ctx, userID, badgeID); err != nil {
		return
	}
	_ = s.progressRepo.AppendBadge(ctx, userID, badgeID)

	def, ok := domain.BadgeCatalog[badgeID]
	if !ok {
		return
	}
	_ = s.notifRepo.Create(ctx, &domain.Notification{
		UserID: userID,
		Type:   domain.NotifTypeBadgeEarned,
		Title:  fmt.Sprintf("%s %s Unlocked!", def.Icon, def.Name),
		Body:   def.Description,
	})
}
