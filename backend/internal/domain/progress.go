package domain

import "time"

// RankTitle progression (grammar-branded rank names from spec Section 20)
const (
	RankGrammarRookie    = "Grammar Rookie"
	RankGrammarCadet     = "Grammar Cadet"
	RankGrammarScout     = "Grammar Scout"
	RankGrammarKnight    = "Grammar Knight"
	RankGrammarChampion  = "Grammar Champion"
	RankGrammarMaster    = "Grammar Master"
	RankGrammarLegend    = "Grammar Legend"
	RankGrammarGod       = "Grammar God"
)

// StudentProgress is the aggregated progress record for a student.
// Document ID in Firestore: {userId}
type StudentProgress struct {
	UserID            string    `firestore:"userId" json:"userId"`
	TotalXP           int       `firestore:"totalXP" json:"totalXP"`
	TotalStars        int       `firestore:"totalStars" json:"totalStars"`
	RankTitle         string    `firestore:"rankTitle" json:"rankTitle"`
	StructureCount    int       `firestore:"structureCount" json:"structureCount"` // "You can build X sentences"
	StreakDays        int       `firestore:"streakDays" json:"streakDays"`
	CurrentStreak     int       `firestore:"currentStreak" json:"currentStreak"`
	BestStreak        int       `firestore:"bestStreak" json:"bestStreak"`
	LastActiveDate    string    `firestore:"lastActiveDate" json:"lastActiveDate"` // YYYY-MM-DD
	CompletedChapters []string  `firestore:"completedChapters" json:"completedChapters"`
	CompletedUnits    []string  `firestore:"completedUnits" json:"completedUnits"`
	Coins             int       `firestore:"coins" json:"coins"`
	Badges                []string  `firestore:"badges" json:"badges"`
	BotTrophies           []string  `firestore:"botTrophies" json:"botTrophies"`
	QuizzesCompletedToday int       `firestore:"quizzesCompletedToday" json:"quizzesCompletedToday"`
	LastQuizDate          string    `firestore:"lastQuizDate" json:"lastQuizDate"` // UTC Date string: YYYY-MM-DD
	UpdatedAt             time.Time `firestore:"updatedAt" json:"updatedAt"`
}
