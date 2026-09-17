package service

// GamificationService handles XP, stars, rank titles, streaks, badges, and coins.
// All gamification state changes flow through this service — never directly from handlers.
// Full implementation in Milestone 5.
type GamificationService struct{}

func NewGamificationService() *GamificationService {
	return &GamificationService{}
}

