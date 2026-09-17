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

// GetUnitsForStudent returns all active units with this student's status for each.
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
