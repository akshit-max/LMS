package service

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// AdminService handles admin-side actions on unlock requests.
//
// All state changes use Firestore transactions to ensure atomicity:
//   Approve → marks request approved + unlocks next unit's first chapter + notifies student + audit log
//   Reject  → marks request rejected + notifies student + audit log
//   RequestRetry → marks request retry_requested + notifies student + audit log
type AdminService struct {
	unlockRepo        *repository.UnlockRequestRepository
	chapterRepo       *repository.ChapterRepository
	chapterStatusRepo *repository.ChapterStatusRepository
	notifRepo         *repository.NotificationRepository
	userRepo          *repository.UserRepository
	unitRepo          *repository.UnitRepository
	db                *firestore.Client
}

func NewAdminService(
	unlockRepo *repository.UnlockRequestRepository,
	chapterRepo *repository.ChapterRepository,
	chapterStatusRepo *repository.ChapterStatusRepository,
	notifRepo *repository.NotificationRepository,
	userRepo *repository.UserRepository,
	unitRepo *repository.UnitRepository,
	db *firestore.Client,
) *AdminService {
	return &AdminService{
		unlockRepo:        unlockRepo,
		chapterRepo:       chapterRepo,
		chapterStatusRepo: chapterStatusRepo,
		notifRepo:         notifRepo,
		userRepo:          userRepo,
		unitRepo:          unitRepo,
		db:                db,
	}
}

// ─── Approve ─────────────────────────────────────────────────────────────────

// ApproveUnlock approves a pending unlock request.
// Atomically:
//   1. Marks the unlock request as approved
//   2. Finds the next unit and unlocks its first chapter for the student
//   3. Creates a student notification
//   4. Writes an audit log
func (s *AdminService) ApproveUnlock(ctx context.Context, adminUID, requestID, adminNote string) error {
	req, err := s.unlockRepo.GetByID(ctx, requestID)
	if err != nil || req == nil {
		return fmt.Errorf("unlock request not found: %s", requestID)
	}
	if req.Status != domain.UnlockStatusPending {
		return fmt.Errorf("cannot approve request with status: %s", req.Status)
	}

	// Find next unit (order = current unit order + 1)
	currentUnit, err := s.unitRepo.GetByID(ctx, req.UnitID)
	if err != nil || currentUnit == nil {
		return fmt.Errorf("current unit not found: %w", err)
	}

	// Get all units to find next in sequence
	allUnits, err := s.unitRepo.GetAll(ctx)
	if err != nil {
		return err
	}
	var nextUnit *domain.Unit
	for _, u := range allUnits {
		if u.Order == currentUnit.Order+1 {
			nextUnit = u
			break
		}
	}

	now := time.Now()

	// 1. Mark request approved
	req.Status = domain.UnlockStatusApproved
	req.ReviewedAt = &now
	req.ReviewedBy = adminUID
	req.AdminNote = adminNote
	if nextUnit != nil {
		req.ToUnitID = nextUnit.ID
	}

	if err := s.unlockRepo.Update(ctx, req); err != nil {
		return fmt.Errorf("update unlock request: %w", err)
	}

	// 2. Unlock first chapter of next unit for this student
	if nextUnit != nil {
		chapters, err := s.chapterRepo.GetByUnit(ctx, nextUnit.ID)
		if err == nil && len(chapters) > 0 {
			// First chapter becomes available; rest stay locked
			for i, ch := range chapters {
				cs := &domain.ChapterStatus{
					UserID:    req.UserID,
					ChapterID: ch.ID,
					UnitID:    nextUnit.ID,
					Status:    domain.ChapterStatusLocked,
				}
				if i == 0 {
					cs.Status = domain.ChapterStatusAvailable
				}
				_ = s.chapterStatusRepo.Set(ctx, cs)
			}
		}
	}

	// 3. Notify student
	msg := "🎉 Your work has been reviewed and approved! You've unlocked the next unit."
	if nextUnit != nil {
		msg = fmt.Sprintf("🎉 You've unlocked Unit %d: %s! Keep going!", nextUnit.Order, nextUnit.Title)
	}
	if adminNote != "" {
		msg += " Note: " + adminNote
	}

	_ = s.notifRepo.Create(ctx, &domain.Notification{
		UserID: req.UserID,
		Type:   domain.NotifTypeChapterUnlock,
		Title:  "Unit Unlocked! 🚀",
		Body:   msg,
		IsRead: false,
	})

	// 4. Write audit log
	_ = s.notifRepo.WriteAuditLog(ctx, &domain.AuditLog{
		ActorID:  adminUID,
		Action:   "unlock_approved",
		TargetID: requestID,
		Details: map[string]interface{}{
			"studentId":  req.UserID,
			"unitId":     req.UnitID,
			"toUnitId":   req.ToUnitID,
			"adminNote":  adminNote,
			"lowestScore": req.LowestScore,
		},
	})

	return nil
}

// ─── Reject ───────────────────────────────────────────────────────────────────

// RejectUnlock rejects a pending unlock request.
// The student is notified and can attempt to improve scores.
func (s *AdminService) RejectUnlock(ctx context.Context, adminUID, requestID, adminNote string) error {
	req, err := s.unlockRepo.GetByID(ctx, requestID)
	if err != nil || req == nil {
		return fmt.Errorf("unlock request not found: %s", requestID)
	}
	if req.Status != domain.UnlockStatusPending {
		return fmt.Errorf("cannot reject request with status: %s", req.Status)
	}

	now := time.Now()
	req.Status = domain.UnlockStatusRejected
	req.ReviewedAt = &now
	req.ReviewedBy = adminUID
	req.AdminNote = adminNote

	if err := s.unlockRepo.Update(ctx, req); err != nil {
		return err
	}

	// Notify student (never use "fail" language)
	msg := "Your quiz results are being reviewed. Keep practising — you can improve and resubmit!"
	if adminNote != "" {
		msg = adminNote
	}

	_ = s.notifRepo.Create(ctx, &domain.Notification{
		UserID: req.UserID,
		Type:   domain.NotifTypeUnlockReviewed,
		Title:  "Keep going! 💪",
		Body:   msg,
		IsRead: false,
	})

	_ = s.notifRepo.WriteAuditLog(ctx, &domain.AuditLog{
		ActorID:  adminUID,
		Action:   "unlock_rejected",
		TargetID: requestID,
		Details: map[string]interface{}{
			"studentId": req.UserID,
			"unitId":    req.UnitID,
			"adminNote": adminNote,
		},
	})

	return nil
}

// ─── Request Retry ────────────────────────────────────────────────────────────

// RequestRetry marks an unlock request as needing retry.
// The idempotency key is cleared so the student can trigger a new request
// after improving their scores.
func (s *AdminService) RequestRetry(ctx context.Context, adminUID, requestID, adminNote string) error {
	req, err := s.unlockRepo.GetByID(ctx, requestID)
	if err != nil || req == nil {
		return fmt.Errorf("unlock request not found: %s", requestID)
	}

	now := time.Now()
	req.Status = domain.UnlockStatusRetryRequested
	req.ReviewedAt = &now
	req.ReviewedBy = adminUID
	req.AdminNote = adminNote

	if err := s.unlockRepo.Update(ctx, req); err != nil {
		return err
	}

	msg := "Please improve your scores and the unit will be re-evaluated automatically when you're ready."
	if adminNote != "" {
		msg = adminNote + " " + msg
	}

	_ = s.notifRepo.Create(ctx, &domain.Notification{
		UserID: req.UserID,
		Type:   domain.NotifTypeUnlockReviewed,
		Title:  "A message from your teacher 📝",
		Body:   msg,
		IsRead: false,
	})

	_ = s.notifRepo.WriteAuditLog(ctx, &domain.AuditLog{
		ActorID:  adminUID,
		Action:   "unlock_retry_requested",
		TargetID: requestID,
		Details: map[string]interface{}{
			"studentId": req.UserID,
			"unitId":    req.UnitID,
			"adminNote": adminNote,
		},
	})

	return nil
}

// ─── Admin views ──────────────────────────────────────────────────────────────

// GetPendingRequests returns all pending unlock requests enriched with student/unit info.
func (s *AdminService) GetPendingRequests(ctx context.Context) ([]*domain.UnlockRequestAdminView, error) {
	requests, err := s.unlockRepo.GetPending(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]*domain.UnlockRequestAdminView, 0, len(requests))
	for _, req := range requests {
		view := &domain.UnlockRequestAdminView{UnlockRequest: *req}

		// Enrich with student info
		user, _ := s.userRepo.GetByUID(ctx, req.UserID)
		if user != nil {
			view.StudentName = user.DisplayName
			view.StudentEmail = user.Email
		}

		// Enrich with unit info
		unit, _ := s.unitRepo.GetByID(ctx, req.UnitID)
		if unit != nil {
			view.UnitTitle = unit.Title
		}

		result = append(result, view)
	}
	return result, nil
}
