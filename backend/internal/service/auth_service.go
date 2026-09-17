package service

import (
	"context"
	"errors"
	"time"

	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// AuthService handles user identity and profile management.
// Authentication (who are you) is handled by Firebase Auth.
// Authorization (what can you do) is handled by this service using Firestore role data.
type AuthService struct {
	userRepo *repository.UserRepository
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// ProfileRequest is the payload for creating/fetching a user profile after login.
type ProfileRequest struct {
	UID         string `json:"uid"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	// StudentType tells us whether this is an independent or school student signup.
	// Independent students arrive via Google Sign-In; school students via provisioned credentials.
	StudentType string `json:"studentType"` // "independent" | "school"
}

// GetOrCreateProfile retrieves an existing user profile or creates a new one on first login.
// New independent students are set to "pending" status requiring admin approval.
// New admin accounts should be pre-created directly in Firestore by the platform owner.
func (s *AuthService) GetOrCreateProfile(ctx context.Context, req ProfileRequest) (*domain.User, error) {
	if req.UID == "" {
		return nil, errors.New("auth: uid is required")
	}

	existing, err := s.userRepo.GetByUID(ctx, req.UID)
	if err != nil {
		return nil, err
	}

	// Return existing profile if found
	if existing != nil {
		return existing, nil
	}

	// First login — create new profile
	now := time.Now()
	user := &domain.User{
		UID:           req.UID,
		Email:         req.Email,
		DisplayName:   req.DisplayName,
		Role:          domain.RoleStudent,
		StudentType:   req.StudentType,
		AccountStatus: domain.AccountStatusPending,
		IsIndependent: req.StudentType == domain.StudentTypeIndependent,
		AvatarID:      "lion_cub", // default avatar
		CreatedAt:     now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

// GetProfile fetches a user profile by UID. Returns ErrUserNotFound if missing.
func (s *AuthService) GetProfile(ctx context.Context, uid string) (*domain.User, error) {
	user, err := s.userRepo.GetByUID(ctx, uid)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, repository.ErrUserNotFound
	}
	return user, nil
}
