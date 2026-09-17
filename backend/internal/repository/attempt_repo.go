package repository

import (
	"context"
	"errors"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"grammoquest/internal/domain"
)

const attemptsCollection = "attempts"

// ErrAttemptAlreadyCompleted is returned when trying to submit an already-completed attempt.
// This is the idempotency guard — duplicate submissions are rejected.
var ErrAttemptAlreadyCompleted = errors.New("attempt already completed")

// ErrAttemptNotFound is returned when an attempt document doesn't exist.
var ErrAttemptNotFound = errors.New("attempt not found")

// AttemptRepository handles Firestore operations for quiz attempts.
type AttemptRepository struct {
	db *firestore.Client
}

func NewAttemptRepository(db *firestore.Client) *AttemptRepository {
	return &AttemptRepository{db: db}
}

// Create creates a new attempt document.
func (r *AttemptRepository) Create(ctx context.Context, attempt *domain.Attempt) error {
	_, err := r.db.Collection(attemptsCollection).Doc(attempt.ID).Create(ctx, attempt)
	return err
}

// GetByID retrieves an attempt by its ID.
func (r *AttemptRepository) GetByID(ctx context.Context, id string) (*domain.Attempt, error) {
	doc, err := r.db.Collection(attemptsCollection).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}
	var a domain.Attempt
	if err := doc.DataTo(&a); err != nil {
		return nil, err
	}
	return &a, nil
}

// Complete updates an in-progress attempt with results using a Firestore transaction.
// Idempotency: if the attempt is already completed, returns ErrAttemptAlreadyCompleted.
// This prevents double-grading if the submit endpoint is called twice.
func (r *AttemptRepository) Complete(ctx context.Context, attempt *domain.Attempt) error {
	ref := r.db.Collection(attemptsCollection).Doc(attempt.ID)

	return r.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(ref)
		if err != nil {
			return err
		}

		var existing domain.Attempt
		if err := doc.DataTo(&existing); err != nil {
			return err
		}

		// Idempotency guard
		if existing.Status == domain.AttemptStatusCompleted {
			return ErrAttemptAlreadyCompleted
		}

		// Write completion
		now := time.Now()
		attempt.CompletedAt = &now
		attempt.Status = domain.AttemptStatusCompleted
		return tx.Set(ref, attempt)
	})
}

// GetBestAttempt returns the highest-scoring completed attempt for a user/quiz pair.
// Returns nil, nil if no completed attempt exists.
func (r *AttemptRepository) GetBestAttempt(ctx context.Context, userID, quizID string) (*domain.Attempt, error) {
	docs, err := r.db.Collection(attemptsCollection).
		Where("userId", "==", userID).
		Where("quizId", "==", quizID).
		Where("status", "==", domain.AttemptStatusCompleted).
		OrderBy("score", firestore.Desc).
		Limit(1).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	if len(docs) == 0 {
		return nil, nil
	}
	var a domain.Attempt
	if err := docs[0].DataTo(&a); err != nil {
		return nil, err
	}
	return &a, nil
}

// CountAttempts returns the number of attempts a user has made on a quiz.
func (r *AttemptRepository) CountAttempts(ctx context.Context, userID, quizID string) (int, error) {
	docs, err := r.db.Collection(attemptsCollection).
		Where("userId", "==", userID).
		Where("quizId", "==", quizID).
		Documents(ctx).GetAll()
	if err != nil {
		return 0, err
	}
	return len(docs), nil
}
