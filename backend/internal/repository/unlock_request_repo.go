package repository

import (
	"context"
	"errors"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"grammoquest/internal/domain"
)

const unlockRequestsCollection = "unlockRequests"

// ErrUnlockRequestAlreadyExists is returned when an identical pending/approved
// request already exists (idempotency key collision).
var ErrUnlockRequestAlreadyExists = errors.New("unlock request already exists")

// UnlockRequestRepository handles Firestore operations for UnlockRequest documents.
type UnlockRequestRepository struct {
	db *firestore.Client
}

func NewUnlockRequestRepository(db *firestore.Client) *UnlockRequestRepository {
	return &UnlockRequestRepository{db: db}
}

// CreateIdempotent creates an unlock request only if one with the same
// idempotencyKey doesn't already exist (pending or approved).
// Returns ErrUnlockRequestAlreadyExists if it already exists — safe to ignore.
func (r *UnlockRequestRepository) CreateIdempotent(ctx context.Context, req *domain.UnlockRequest) error {
	// Check for existing request with the same idempotency key
	existing, err := r.GetByIdempotencyKey(ctx, req.IdempotencyKey)
	if err != nil {
		return err
	}
	if existing != nil && existing.Status != domain.UnlockStatusRejected {
		return ErrUnlockRequestAlreadyExists
	}

	req.ID = uuid.New().String()
	req.RequestedAt = time.Now()
	_, err = r.db.Collection(unlockRequestsCollection).Doc(req.ID).Set(ctx, req)
	return err
}

// GetByIdempotencyKey fetches the most recent request for a userId+unitId key.
func (r *UnlockRequestRepository) GetByIdempotencyKey(ctx context.Context, key string) (*domain.UnlockRequest, error) {
	docs, err := r.db.Collection(unlockRequestsCollection).
		Where("idempotencyKey", "==", key).
		OrderBy("requestedAt", firestore.Desc).
		Limit(1).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	if len(docs) == 0 {
		return nil, nil
	}
	var ur domain.UnlockRequest
	if err := docs[0].DataTo(&ur); err != nil {
		return nil, err
	}
	return &ur, nil
}

// GetByID retrieves an unlock request by document ID.
func (r *UnlockRequestRepository) GetByID(ctx context.Context, id string) (*domain.UnlockRequest, error) {
	doc, err := r.db.Collection(unlockRequestsCollection).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var ur domain.UnlockRequest
	if err := doc.DataTo(&ur); err != nil {
		return nil, err
	}
	return &ur, nil
}

// GetPending returns all unlock requests with status=pending, newest first.
func (r *UnlockRequestRepository) GetPending(ctx context.Context) ([]*domain.UnlockRequest, error) {
	docs, err := r.db.Collection(unlockRequestsCollection).
		Where("status", "==", domain.UnlockStatusPending).
		OrderBy("requestedAt", firestore.Asc).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]*domain.UnlockRequest, 0, len(docs))
	for _, doc := range docs {
		var ur domain.UnlockRequest
		if err := doc.DataTo(&ur); err != nil {
			continue
		}
		result = append(result, &ur)
	}
	return result, nil
}

// GetForUser returns all unlock requests for a specific student.
func (r *UnlockRequestRepository) GetForUser(ctx context.Context, userID string) ([]*domain.UnlockRequest, error) {
	docs, err := r.db.Collection(unlockRequestsCollection).
		Where("userId", "==", userID).
		OrderBy("requestedAt", firestore.Desc).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]*domain.UnlockRequest, 0, len(docs))
	for _, doc := range docs {
		var ur domain.UnlockRequest
		if err := doc.DataTo(&ur); err != nil {
			continue
		}
		result = append(result, &ur)
	}
	return result, nil
}

// Update overwrites an unlock request document (used for approve/reject).
func (r *UnlockRequestRepository) Update(ctx context.Context, req *domain.UnlockRequest) error {
	_, err := r.db.Collection(unlockRequestsCollection).Doc(req.ID).Set(ctx, req)
	return err
}
