package repository

import (
	"context"
	"sort"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"grammoquest/internal/domain"
)

const (
	unitsCollection         = "units"
	chaptersCollection      = "chapters"
	chapterStatusCollection = "chapterStatus"
)

// UnitRepository handles Firestore operations for Units.
type UnitRepository struct {
	db *firestore.Client
}

func NewUnitRepository(db *firestore.Client) *UnitRepository {
	return &UnitRepository{db: db}
}

func (r *UnitRepository) GetAll(ctx context.Context) ([]*domain.Unit, error) {
	docs, err := r.db.Collection(unitsCollection).Where("isActive", "==", true).Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	units := make([]*domain.Unit, 0, len(docs))
	for _, doc := range docs {
		var u domain.Unit
		if err := doc.DataTo(&u); err != nil {
			continue
		}
		units = append(units, &u)
	}
	sort.Slice(units, func(i, j int) bool { return units[i].Order < units[j].Order })
	return units, nil
}

func (r *UnitRepository) GetByID(ctx context.Context, id string) (*domain.Unit, error) {
	doc, err := r.db.Collection(unitsCollection).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var u domain.Unit
	if err := doc.DataTo(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

// ChapterRepository handles Firestore operations for Chapters.
type ChapterRepository struct {
	db *firestore.Client
}

func NewChapterRepository(db *firestore.Client) *ChapterRepository {
	return &ChapterRepository{db: db}
}

func (r *ChapterRepository) GetByUnit(ctx context.Context, unitID string) ([]*domain.Chapter, error) {
	docs, err := r.db.Collection(chaptersCollection).
		Where("unitId", "==", unitID).
		Where("isActive", "==", true).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	chapters := make([]*domain.Chapter, 0, len(docs))
	for _, doc := range docs {
		var c domain.Chapter
		if err := doc.DataTo(&c); err != nil {
			continue
		}
		chapters = append(chapters, &c)
	}
	sort.Slice(chapters, func(i, j int) bool { return chapters[i].Order < chapters[j].Order })
	return chapters, nil
}

func (r *ChapterRepository) GetByID(ctx context.Context, id string) (*domain.Chapter, error) {
	doc, err := r.db.Collection(chaptersCollection).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var c domain.Chapter
	if err := doc.DataTo(&c); err != nil {
		return nil, err
	}
	return &c, nil
}

// ChapterStatusRepository reads/writes student chapter progress.
// Document IDs are {userID}_{chapterID}.
// Only the backend writes these — never the frontend.
type ChapterStatusRepository struct {
	db *firestore.Client
}

func NewChapterStatusRepository(db *firestore.Client) *ChapterStatusRepository {
	return &ChapterStatusRepository{db: db}
}

func docID(userID, chapterID string) string {
	return userID + "_" + chapterID
}

func (r *ChapterStatusRepository) Get(ctx context.Context, userID, chapterID string) (*domain.ChapterStatus, error) {
	doc, err := r.db.Collection(chapterStatusCollection).Doc(docID(userID, chapterID)).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var cs domain.ChapterStatus
	if err := doc.DataTo(&cs); err != nil {
		return nil, err
	}
	return &cs, nil
}

func (r *ChapterStatusRepository) GetAllForUser(ctx context.Context, userID string) ([]*domain.ChapterStatus, error) {
	docs, err := r.db.Collection(chapterStatusCollection).
		Where("userId", "==", userID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	statuses := make([]*domain.ChapterStatus, 0, len(docs))
	for _, doc := range docs {
		var cs domain.ChapterStatus
		if err := doc.DataTo(&cs); err != nil {
			continue
		}
		statuses = append(statuses, &cs)
	}
	return statuses, nil
}

func (r *ChapterStatusRepository) Set(ctx context.Context, cs *domain.ChapterStatus) error {
	_, err := r.db.Collection(chapterStatusCollection).Doc(docID(cs.UserID, cs.ChapterID)).Set(ctx, cs)
	return err
}

// InitializeForUser creates "available" status for the first chapter, "locked" for the rest.
// Called when a student's account is first approved.
func (r *ChapterStatusRepository) InitializeForUser(ctx context.Context, userID string, chapters []*domain.Chapter) error {
	batch := r.db.Batch()
	for i, ch := range chapters {
		s := domain.ChapterStatus{
			UserID:    userID,
			ChapterID: ch.ID,
			UnitID:    ch.UnitID,
			Status:    domain.ChapterStatusLocked,
		}
		if i == 0 {
			s.Status = domain.ChapterStatusAvailable
		}
		ref := r.db.Collection(chapterStatusCollection).Doc(docID(userID, ch.ID))
		batch.Set(ref, s)
	}
	_, err := batch.Commit(ctx)
	return err
}
