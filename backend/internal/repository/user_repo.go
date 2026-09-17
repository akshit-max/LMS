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

const usersCollection = "users"

// UserRepository handles all Firestore operations for User documents.
type UserRepository struct {
	db *firestore.Client
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(db *firestore.Client) *UserRepository {
	return &UserRepository{db: db}
}

// GetByUID retrieves a user by their Firebase UID. Returns nil, nil if not found.
func (r *UserRepository) GetByUID(ctx context.Context, uid string) (*domain.User, error) {
	doc, err := r.db.Collection(usersCollection).Doc(uid).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}

	var user domain.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

// Create creates a new user document. Returns an error if the document already exists.
func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
	user.CreatedAt = time.Now()
	_, err := r.db.Collection(usersCollection).Doc(user.UID).Create(ctx, user)
	return err
}

// Update updates an existing user document (full overwrite of provided fields via Set with Merge).
func (r *UserRepository) Update(ctx context.Context, uid string, updates map[string]interface{}) error {
	_, err := r.db.Collection(usersCollection).Doc(uid).Set(ctx, updates, firestore.MergeAll)
	return err
}

// GetAll returns all users (admin only).
func (r *UserRepository) GetAll(ctx context.Context) ([]*domain.User, error) {
	docs, err := r.db.Collection(usersCollection).Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	users := make([]*domain.User, 0, len(docs))
	for _, doc := range docs {
		var u domain.User
		if err := doc.DataTo(&u); err != nil {
			continue
		}
		users = append(users, &u)
	}
	return users, nil
}

// ErrUserNotFound is returned when a user document does not exist in Firestore.
var ErrUserNotFound = errors.New("user not found")
