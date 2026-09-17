package repository

import (
	"context"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"grammoquest/internal/domain"
)

const progressCollection = "progress"

// ProgressRepository handles student progress Firestore operations.
type ProgressRepository struct {
	db *firestore.Client
}

func NewProgressRepository(db *firestore.Client) *ProgressRepository {
	return &ProgressRepository{db: db}
}

func (r *ProgressRepository) Get(ctx context.Context, userID string) (*domain.StudentProgress, error) {
	doc, err := r.db.Collection(progressCollection).Doc(userID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var p domain.StudentProgress
	if err := doc.DataTo(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

// GetOrCreate returns existing progress or creates a fresh record.
func (r *ProgressRepository) GetOrCreate(ctx context.Context, userID string) (*domain.StudentProgress, error) {
	p, err := r.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	if p != nil {
		return p, nil
	}

	// Create initial progress
	p = &domain.StudentProgress{
		UserID:            userID,
		TotalXP:           0,
		TotalStars:        0,
		RankTitle:         domain.RankGrammarRookie,
		StructureCount:    0,
		CurrentStreak:     0,
		BestStreak:        0,
		LastActiveDate:    "",
		CompletedChapters: []string{},
		CompletedUnits:    []string{},
		Coins:             0,
		Badges:            []string{},
		BotTrophies:       []string{},
		UpdatedAt:         time.Now(),
	}
	if err := r.Set(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (r *ProgressRepository) Set(ctx context.Context, p *domain.StudentProgress) error {
	p.UpdatedAt = time.Now()
	_, err := r.db.Collection(progressCollection).Doc(p.UserID).Set(ctx, p)
	return err
}

func (r *ProgressRepository) Update(ctx context.Context, userID string, updates map[string]interface{}) error {
	updates["updatedAt"] = time.Now()
	_, err := r.db.Collection(progressCollection).Doc(userID).Set(ctx, updates, firestore.MergeAll)
	return err
}

// AppendCompletedChapter idempotently adds chapterID to the completedChapters array.
// Uses Firestore ArrayUnion — safe to call multiple times; no duplicates introduced.
func (r *ProgressRepository) AppendCompletedChapter(ctx context.Context, userID, chapterID string) error {
	_, err := r.db.Collection(progressCollection).Doc(userID).Set(ctx, map[string]interface{}{
		"completedChapters": firestore.ArrayUnion(chapterID),
		"updatedAt":         time.Now(),
	}, firestore.MergeAll)
	return err
}

// AppendCompletedUnit idempotently adds unitID to the completedUnits array.
// Uses Firestore ArrayUnion — safe to call multiple times; no duplicates introduced.
func (r *ProgressRepository) AppendCompletedUnit(ctx context.Context, userID, unitID string) error {
	_, err := r.db.Collection(progressCollection).Doc(userID).Set(ctx, map[string]interface{}{
		"completedUnits": firestore.ArrayUnion(unitID),
		"updatedAt":      time.Now(),
	}, firestore.MergeAll)
	return err
}

// AppendBadge idempotently adds badgeID to the badges convenience cache.
// The authoritative badge record lives in the badges collection.
// This array is a convenience cache — NEVER used for authorization decisions.
func (r *ProgressRepository) AppendBadge(ctx context.Context, userID, badgeID string) error {
	_, err := r.db.Collection(progressCollection).Doc(userID).Set(ctx, map[string]interface{}{
		"badges":    firestore.ArrayUnion(badgeID),
		"updatedAt": time.Now(),
	}, firestore.MergeAll)
	return err
}

// SetDailyMission updates only the daily mission tracking fields using MergeAll.
// This is a safe partial update — does not touch XP, stars, streak, or any other field.
func (r *ProgressRepository) SetDailyMission(ctx context.Context, userID, dateUTC string, count int) error {
	_, err := r.db.Collection(progressCollection).Doc(userID).Set(ctx, map[string]interface{}{
		"lastQuizDate":          dateUTC,
		"quizzesCompletedToday": count,
		"updatedAt":             time.Now(),
	}, firestore.MergeAll)
	return err
}

// GetAll returns all student progress records (for leaderboard). Capped at 500.
func (r *ProgressRepository) GetAll(ctx context.Context) ([]*domain.StudentProgress, error) {
	docs, err := r.db.Collection(progressCollection).Limit(500).Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]*domain.StudentProgress, 0, len(docs))
	for _, doc := range docs {
		var p domain.StudentProgress
		if err := doc.DataTo(&p); err != nil {
			continue
		}
		result = append(result, &p)
	}
	return result, nil
}

