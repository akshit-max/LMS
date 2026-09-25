package service

import (
	"context"
	"fmt"

	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// CurriculumService handles units, chapters, and chapter status for students.
type CurriculumService struct {
	unitRepo          *repository.UnitRepository
	chapterRepo       *repository.ChapterRepository
	chapterStatusRepo *repository.ChapterStatusRepository
	progressRepo      *repository.ProgressRepository
}

func NewCurriculumService(
	unitRepo *repository.UnitRepository,
	chapterRepo *repository.ChapterRepository,
	chapterStatusRepo *repository.ChapterStatusRepository,
	progressRepo *repository.ProgressRepository,
) *CurriculumService {
	return &CurriculumService{
		unitRepo:          unitRepo,
		chapterRepo:       chapterRepo,
		chapterStatusRepo: chapterStatusRepo,
		progressRepo:      progressRepo,
	}
}

// UnitWithStatus enriches a Unit with a student's access status.
type UnitWithStatus struct {
	*domain.Unit
	Status           string    `json:"status"` // locked | available | completed
	ChaptersCompleted int      `json:"chaptersCompleted"`
	TotalChapters    int       `json:"totalChapters"`
}

// ChapterWithStatus enriches a Chapter with a student's status and best score.
type ChapterWithStatus struct {
	*domain.Chapter
	Status    string `json:"status"` // locked | available | completed
	BestScore int    `json:"bestScore"`
	BestStars int    `json:"bestStars"`
}

// GetUnitsForStudent returns all published units with this student's status for each.
// Units with status="draft" or status="archived" are hidden from students.
// Existing seeded units without a status field are treated as published (backward compat).
func (s *CurriculumService) GetUnitsForStudent(ctx context.Context, userID string) ([]*UnitWithStatus, error) {
	units, err := s.unitRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	// Get all chapter statuses for this student (one query)
	statuses, err := s.chapterStatusRepo.GetAllForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Build a map: chapterID → status
	statusMap := make(map[string]*domain.ChapterStatus, len(statuses))
	for _, st := range statuses {
		statusMap[st.ChapterID] = st
	}

	result := make([]*UnitWithStatus, 0, len(units))
	for _, u := range units {
		// Hide draft/archived units from students
		// Backward compat: if status is empty (seeded units), treat as published
		if u.Status != "" && u.Status != domain.UnitStatusPublished {
			continue
		}

		chapters, err := s.chapterRepo.GetByUnit(ctx, u.ID)
		if err != nil {
			continue
		}

		completed := 0
		unitStatus := domain.ChapterStatusLocked
		for _, ch := range chapters {
			st, ok := statusMap[ch.ID]
			if !ok {
				continue
			}
			if st.Status == domain.ChapterStatusCompleted {
				completed++
			}
			if st.Status == domain.ChapterStatusAvailable || st.Status == domain.ChapterStatusCompleted {
				unitStatus = domain.ChapterStatusAvailable
			}
		}
		if completed == len(chapters) && len(chapters) > 0 {
			unitStatus = domain.ChapterStatusCompleted
		}

		result = append(result, &UnitWithStatus{
			Unit:              u,
			Status:            unitStatus,
			ChaptersCompleted: completed,
			TotalChapters:     len(chapters),
		})
	}
	return result, nil
}

// GetChaptersForStudent returns chapters in a unit with per-student status.
func (s *CurriculumService) GetChaptersForStudent(ctx context.Context, userID, unitID string) ([]*ChapterWithStatus, error) {
	chapters, err := s.chapterRepo.GetByUnit(ctx, unitID)
	if err != nil {
		return nil, err
	}

	result := make([]*ChapterWithStatus, 0, len(chapters))
	for _, ch := range chapters {
		st, err := s.chapterStatusRepo.Get(ctx, userID, ch.ID)
		if err != nil {
			return nil, err
		}

		cws := &ChapterWithStatus{Chapter: ch, Status: domain.ChapterStatusLocked}
		if st != nil {
			cws.Status = st.Status
			cws.BestScore = st.BestScore
			cws.BestStars = st.BestStars
		}
		result = append(result, cws)
	}
	return result, nil
}

// GetChapterDetail returns a single chapter with student status.
func (s *CurriculumService) GetChapterDetail(ctx context.Context, userID, chapterID string) (*ChapterWithStatus, error) {
	ch, err := s.chapterRepo.GetByID(ctx, chapterID)
	if err != nil {
		return nil, err
	}
	if ch == nil {
		return nil, fmt.Errorf("chapter not found: %s", chapterID)
	}

	st, err := s.chapterStatusRepo.Get(ctx, userID, chapterID)
	if err != nil {
		return nil, err
	}

	cws := &ChapterWithStatus{Chapter: ch, Status: domain.ChapterStatusLocked}
	if st != nil {
		cws.Status = st.Status
		cws.BestScore = st.BestScore
		cws.BestStars = st.BestStars
	}
	return cws, nil
}

// GetStudentProgress returns or creates the student's progress record.
func (s *CurriculumService) GetStudentProgress(ctx context.Context, userID string) (*domain.StudentProgress, error) {
	return s.progressRepo.GetOrCreate(ctx, userID)
}

// InitializeChaptersForStudent sets up chapterStatus records for a newly approved student.
// It initializes Unit 1 chapter 1 as "available" and the rest as "locked".
// This is called once when an admin approves a student account.
func (s *CurriculumService) InitializeChaptersForStudent(ctx context.Context, userID string) error {
	// Get all units, start with unit order=1
	units, err := s.unitRepo.GetAll(ctx)
	if err != nil {
		return fmt.Errorf("get units: %w", err)
	}

	// Find unit with order = 1
	var firstUnit *domain.Unit
	for _, u := range units {
		if u.Order == 1 {
			firstUnit = u
			break
		}
	}
	if firstUnit == nil && len(units) > 0 {
		firstUnit = units[0] // fallback to first available unit
	}
	if firstUnit == nil {
		return nil // no units seeded yet, skip silently
	}

	chapters, err := s.chapterRepo.GetByUnit(ctx, firstUnit.ID)
	if err != nil {
		return fmt.Errorf("get chapters: %w", err)
	}
	if len(chapters) == 0 {
		return nil
	}

	return s.chapterStatusRepo.InitializeForUser(ctx, userID, chapters)
}

// GetChaptersRaw returns chapters for a unit without any student-status enrichment.
// Used by admin endpoints to display the curriculum structure without personalisation.
func (s *CurriculumService) GetChaptersRaw(ctx context.Context, unitID string) ([]*domain.Chapter, error) {
	return s.chapterRepo.GetByUnit(ctx, unitID)
}

// GetUnitsRaw returns all active units without student-status enrichment.
// Used by admin endpoints to display the curriculum structure without personalisation.
func (s *CurriculumService) GetUnitsRaw(ctx context.Context) ([]*domain.Unit, error) {
	return s.unitRepo.GetAll(ctx)
}
