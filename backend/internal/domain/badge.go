package domain

import "time"

// Badge IDs — all badge awards use these constants.
// Adding new badges: add a constant here + award logic in badge_service.go.
const (
	BadgeFirstBlood     = "first_blood"     // Complete first quiz
	BadgePerfectScore   = "perfect_score"   // Score 100% on a quiz
	BadgeHatTrick       = "hat_trick"       // 3-star on 3 consecutive quizzes
	BadgeStreakStarter  = "streak_starter"  // 3-day streak
	BadgeStreakWarrior  = "streak_warrior"  // 7-day streak
	BadgeUnitMastered   = "unit_mastered"   // Complete first unit
	BadgeSpeedDemon     = "speed_demon"     // Complete a quiz with >50% time remaining avg
	BadgeComboKing      = "combo_king"      // Achieve a 5x combo in a single quiz
	BadgeTopScorer      = "top_scorer"      // Reach Grammar Knight rank
	BadgeGrammarGod     = "grammar_god_badge" // Reach Grammar God rank
)

// BadgeDef describes a badge (static catalog).
type BadgeDef struct {
	ID          string
	Name        string
	Description string
	Icon        string // emoji icon
}

// BadgeCatalog is the authoritative list of all badge definitions.
var BadgeCatalog = map[string]BadgeDef{
	BadgeFirstBlood:    {ID: BadgeFirstBlood, Name: "First Blood", Description: "Complete your very first quiz.", Icon: "🩸"},
	BadgePerfectScore:  {ID: BadgePerfectScore, Name: "Perfect Score", Description: "Score 100% on any quiz.", Icon: "💯"},
	BadgeHatTrick:      {ID: BadgeHatTrick, Name: "Hat Trick", Description: "Earn 3 stars on 3 consecutive quizzes.", Icon: "🎩"},
	BadgeStreakStarter: {ID: BadgeStreakStarter, Name: "Streak Starter", Description: "Study 3 days in a row.", Icon: "🔥"},
	BadgeStreakWarrior: {ID: BadgeStreakWarrior, Name: "Streak Warrior", Description: "Study 7 days in a row.", Icon: "⚔️"},
	BadgeUnitMastered:  {ID: BadgeUnitMastered, Name: "Unit Mastered", Description: "Complete your first full unit.", Icon: "🏆"},
	BadgeSpeedDemon:    {ID: BadgeSpeedDemon, Name: "Speed Demon", Description: "Complete a quiz with blazing speed.", Icon: "⚡"},
	BadgeComboKing:     {ID: BadgeComboKing, Name: "Combo King", Description: "Achieve a 5x answer combo in a single quiz.", Icon: "👑"},
	BadgeTopScorer:     {ID: BadgeTopScorer, Name: "Top Scorer", Description: "Reach Grammar Knight rank.", Icon: "🌟"},
	BadgeGrammarGod:    {ID: BadgeGrammarGod, Name: "Grammar God", Description: "Reach the pinnacle — Grammar God rank.", Icon: "⚡"},
}

// BadgeAward is a persisted record of a badge awarded to a student.
// Document path: badges/{userId}_{badgeId} (composite key ensures idempotency).
type BadgeAward struct {
	ID        string    `firestore:"id" json:"id"`
	UserID    string    `firestore:"userId" json:"userId"`
	BadgeID   string    `firestore:"badgeId" json:"badgeId"`
	AwardedAt time.Time `firestore:"awardedAt" json:"awardedAt"`
}

// BadgeAwardPublic is what the frontend receives — includes the catalog details.
type BadgeAwardPublic struct {
	BadgeID     string    `json:"badgeId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	AwardedAt   time.Time `json:"awardedAt"`
}
