package handler

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"grammoquest/internal/middleware"
	"grammoquest/internal/repository"
)

// LeaderboardHandler serves leaderboard endpoints.
// All data is read from existing StudentProgress records — no separate leaderboard store.
type LeaderboardHandler struct {
	progressRepo *repository.ProgressRepository
	userRepo     *repository.UserRepository
}

func NewLeaderboardHandler(progressRepo *repository.ProgressRepository, userRepo *repository.UserRepository) *LeaderboardHandler {
	return &LeaderboardHandler{progressRepo: progressRepo, userRepo: userRepo}
}

// LeaderboardEntry is a single row in the leaderboard response.
type LeaderboardEntry struct {
	Rank        int    `json:"rank"`
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
	XP          int    `json:"xp"`
	Stars       int    `json:"stars"`
	RankTitle   string `json:"rankTitle"`
	IsCurrentUser bool `json:"isCurrentUser"`
}

// GetLeaderboard handles GET /api/v1/leaderboard?scope=global&period=alltime
// scope: global | class (same unit progress bucket — MVP: global only)
// period: alltime | weekly | monthly
// Returns top 10 + caller's own position if outside top 10.
func (h *LeaderboardHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	callerUID := middleware.GetUID(r)
	period := strings.ToLower(r.URL.Query().Get("period"))
	if period == "" {
		period = "alltime"
	}

	// Fetch all student progress records
	allProgress, err := h.progressRepo.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch leaderboard data")
		return
	}

	// Fetch all users to get display names
	users, err := h.userRepo.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch user data")
		return
	}
	nameMap := make(map[string]string, len(users))
	for _, u := range users {
		nameMap[u.UID] = u.DisplayName
	}

	// For weekly/monthly: filter progress by period using LastActiveDate
	now := time.Now().UTC()
	periodStart := ""
	switch period {
	case "weekly":
		periodStart = now.AddDate(0, 0, -7).Format("2006-01-02")
	case "monthly":
		periodStart = now.AddDate(0, -1, 0).Format("2006-01-02")
	}

	// Build entries — only include students (role-based filtering is done here via name existence)
	entries := make([]LeaderboardEntry, 0, len(allProgress))
	for _, p := range allProgress {
		if p.UserID == "" {
			continue
		}
		// Period filter: if weekly/monthly, only include active users in that window
		if periodStart != "" && (p.LastActiveDate == "" || p.LastActiveDate < periodStart) {
			continue
		}
		name := nameMap[p.UserID]
		if name == "" {
			name = "Learner"
		}
		entries = append(entries, LeaderboardEntry{
			UserID:        p.UserID,
			DisplayName:   name,
			XP:            p.TotalXP,
			Stars:         p.TotalStars,
			RankTitle:     p.RankTitle,
			IsCurrentUser: p.UserID == callerUID,
		})
	}

	// Sort by XP descending, then Stars as tiebreaker
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].XP != entries[j].XP {
			return entries[i].XP > entries[j].XP
		}
		return entries[i].Stars > entries[j].Stars
	})

	// Assign ranks (1-indexed)
	for i := range entries {
		entries[i].Rank = i + 1
	}

	// Return top 10
	top := entries
	if len(top) > 10 {
		top = top[:10]
	}

	// Find caller's position if not in top 10
	var callerEntry *LeaderboardEntry
	callerInTop := false
	for _, e := range top {
		if e.IsCurrentUser {
			callerInTop = true
			break
		}
	}
	if !callerInTop {
		for i := range entries {
			if entries[i].IsCurrentUser {
				callerEntry = &entries[i]
				break
			}
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"leaderboard":   top,
		"callerEntry":   callerEntry, // nil if in top 10
		"period":        period,
		"totalStudents": len(entries),
	})
}
