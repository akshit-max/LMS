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
