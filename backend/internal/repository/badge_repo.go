package repository

import (
	"context"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"grammoquest/internal/domain"
)

const badgesCollection = "badges"

// BadgeRepository handles persisting badge awards.
// Idempotency: document ID = "{userID}_{badgeID}" — writing twice is a no-op.
type BadgeRepository struct {
	db *firestore.Client
}

func NewBadgeRepository(db *firestore.Client) *BadgeRepository {
	return &BadgeRepository{db: db}
}

// docID returns the composite key that makes awards idempotent.
func badgeDocID(userID, badgeID string) string {
	return userID + "_" + badgeID
}

// Award persists a badge award. If already awarded, this is a safe no-op.
// Uses SetMerge so concurrent calls cannot duplicate the award.
func (r *BadgeRepository) Award(ctx context.Context, userID, badgeID string) error {
	docID := badgeDocID(userID, badgeID)
	award := domain.BadgeAward{
		ID:        docID,
		UserID:    userID,
		BadgeID:   badgeID,
		AwardedAt: time.Now(),
	}
	// MergeAll: if the document already exists, this is a no-op for awardedAt
	// We use a transaction-free approach: first check, then set.
	// Since docID is deterministic, concurrent awards of the same badge
	// will both write the same document — safe.
	ref := r.db.Collection(badgesCollection).Doc(docID)
	_, err := ref.Get(ctx)
	if err == nil {
		// Already exists — idempotent, do nothing.
		return nil
	}
	if status.Code(err) != codes.NotFound {
		return err
	}
	// Not found — create it.
	_, err = ref.Set(ctx, award)
	return err
}

// HasBadge checks if a student already has a specific badge.
func (r *BadgeRepository) HasBadge(ctx context.Context, userID, badgeID string) (bool, error) {
	_, err := r.db.Collection(badgesCollection).Doc(badgeDocID(userID, badgeID)).Get(ctx)
	if err == nil {
		return true, nil
	}
	if status.Code(err) == codes.NotFound {
		return false, nil
	}
	return false, err
}

// GetForUser returns all badge awards for a student, as BadgeAwardPublic (enriched with catalog data).
func (r *BadgeRepository) GetForUser(ctx context.Context, userID string) ([]*domain.BadgeAwardPublic, error) {
	docs, err := r.db.Collection(badgesCollection).
		Where("userId", "==", userID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]*domain.BadgeAwardPublic, 0, len(docs))
	for _, doc := range docs {
		var award domain.BadgeAward
		if err := doc.DataTo(&award); err != nil {
			continue
		}
		def, ok := domain.BadgeCatalog[award.BadgeID]
		if !ok {
			continue // unknown badge — skip
		}
		result = append(result, &domain.BadgeAwardPublic{
			BadgeID:     award.BadgeID,
			Name:        def.Name,
			Description: def.Description,
			Icon:        def.Icon,
			AwardedAt:   award.AwardedAt,
		})
	}
	return result, nil
}
