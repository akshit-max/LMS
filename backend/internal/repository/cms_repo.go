package repository

import (
	"context"
	"fmt"
	"sort"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"grammoquest/internal/domain"
)

// ─── CMSRepository ─────────────────────────────────────────────────────────────
// Handles all admin Create/Update/Archive operations for curriculum content.
// Completely separate from student-facing repos to ensure no accidental mutation.
// All methods here are admin-only and protected at the handler/router level.

type CMSRepository struct {
	db *firestore.Client
}

func NewCMSRepository(db *firestore.Client) *CMSRepository {
	return &CMSRepository{db: db}
}

// ── Units ──────────────────────────────────────────────────────────────────────

// GetAllUnitsAdmin returns ALL units (including draft/archived) for admin view.
func (r *CMSRepository) GetAllUnitsAdmin(ctx context.Context) ([]*domain.Unit, error) {
	docs, err := r.db.Collection(unitsCollection).Documents(ctx).GetAll()
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

// CreateUnit creates a new unit. Assigns a UUID as the document ID.
func (r *CMSRepository) CreateUnit(ctx context.Context, u *domain.Unit) error {
	u.ID = uuid.New().String()
	u.CreatedAt = time.Now()
	if u.Status == "" {
		u.Status = domain.UnitStatusDraft
	}
	// isActive = true only when published
	u.IsActive = u.Status == domain.UnitStatusPublished
	_, err := r.db.Collection(unitsCollection).Doc(u.ID).Set(ctx, u)
	return err
}

// UpdateUnit updates mutable fields on a Unit.
func (r *CMSRepository) UpdateUnit(ctx context.Context, id string, updates map[string]interface{}) error {
	fsUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fsUpdates = append(fsUpdates, firestore.Update{Path: k, Value: v})
	}
	// Keep isActive in sync with status
	if s, ok := updates["status"]; ok {
		fsUpdates = append(fsUpdates, firestore.Update{Path: "isActive", Value: s == domain.UnitStatusPublished})
	}
	_, err := r.db.Collection(unitsCollection).Doc(id).Update(ctx, fsUpdates)
	return err
}

// GetUnitByID returns a unit (admin — no isActive filter).
func (r *CMSRepository) GetUnitByID(ctx context.Context, id string) (*domain.Unit, error) {
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

// ── Chapters ───────────────────────────────────────────────────────────────────

// GetChaptersByUnitAdmin returns ALL chapters for a unit (including draft/archived).
func (r *CMSRepository) GetChaptersByUnitAdmin(ctx context.Context, unitID string) ([]*domain.Chapter, error) {
	docs, err := r.db.Collection(chaptersCollection).
		Where("unitId", "==", unitID).
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

// GetChapterByIDAdmin returns a single chapter (no isActive filter).
func (r *CMSRepository) GetChapterByIDAdmin(ctx context.Context, id string) (*domain.Chapter, error) {
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

// CreateChapter creates a new chapter within a unit.
func (r *CMSRepository) CreateChapter(ctx context.Context, c *domain.Chapter) error {
	c.ID = uuid.New().String()
	c.CreatedAt = time.Now()
	if c.Status == "" {
		c.Status = domain.UnitStatusDraft
	}
	c.IsActive = c.Status == domain.UnitStatusPublished
	_, err := r.db.Collection(chaptersCollection).Doc(c.ID).Set(ctx, c)
	return err
}

// UpdateChapter updates mutable fields on a Chapter.
func (r *CMSRepository) UpdateChapter(ctx context.Context, id string, updates map[string]interface{}) error {
	fsUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fsUpdates = append(fsUpdates, firestore.Update{Path: k, Value: v})
	}
	if s, ok := updates["status"]; ok {
		fsUpdates = append(fsUpdates, firestore.Update{Path: "isActive", Value: s == domain.UnitStatusPublished})
	}
	_, err := r.db.Collection(chaptersCollection).Doc(id).Update(ctx, fsUpdates)
	return err
}

// SetChapterQuiz links a quiz ID to a chapter.
func (r *CMSRepository) SetChapterQuiz(ctx context.Context, chapterID, quizID string) error {
	_, err := r.db.Collection(chaptersCollection).Doc(chapterID).Update(ctx, []firestore.Update{
		{Path: "quizId", Value: quizID},
	})
	return err
}

// ── Quizzes ────────────────────────────────────────────────────────────────────

// GetQuizByIDAdmin returns a quiz (no isActive filter).
func (r *CMSRepository) GetQuizByIDAdmin(ctx context.Context, id string) (*domain.Quiz, error) {
	doc, err := r.db.Collection(quizzesCollection).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var q domain.Quiz
	if err := doc.DataTo(&q); err != nil {
		return nil, err
	}
	return &q, nil
}

// GetQuizByChapter returns the quiz linked to a chapter (admin, all statuses).
func (r *CMSRepository) GetQuizByChapter(ctx context.Context, chapterID string) (*domain.Quiz, error) {
	docs, err := r.db.Collection(quizzesCollection).
		Where("chapterId", "==", chapterID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	if len(docs) == 0 {
		return nil, nil
	}
	var q domain.Quiz
	if err := docs[0].DataTo(&q); err != nil {
		return nil, err
	}
	return &q, nil
}

// CreateQuiz creates a new quiz and links it to the chapter.
func (r *CMSRepository) CreateQuiz(ctx context.Context, q *domain.Quiz) error {
	q.ID = uuid.New().String()
	q.CreatedAt = time.Now()
	if q.Status == "" {
		q.Status = domain.UnitStatusDraft
	}
	q.IsActive = q.Status == domain.UnitStatusPublished
	if q.PassingScore == 0 {
		q.PassingScore = 90 // preserve existing default
	}
	if q.QuestionIDs == nil {
		q.QuestionIDs = []string{}
	}
	_, err := r.db.Collection(quizzesCollection).Doc(q.ID).Set(ctx, q)
	return err
}

// UpdateQuiz updates mutable fields on a Quiz.
func (r *CMSRepository) UpdateQuiz(ctx context.Context, id string, updates map[string]interface{}) error {
	fsUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fsUpdates = append(fsUpdates, firestore.Update{Path: k, Value: v})
	}
	if s, ok := updates["status"]; ok {
		fsUpdates = append(fsUpdates, firestore.Update{Path: "isActive", Value: s == domain.UnitStatusPublished})
	}
	_, err := r.db.Collection(quizzesCollection).Doc(id).Update(ctx, fsUpdates)
	return err
}

// UpdateQuizQuestionIDs replaces the ordered list of question IDs in a quiz.
func (r *CMSRepository) UpdateQuizQuestionIDs(ctx context.Context, quizID string, questionIDs []string) error {
	_, err := r.db.Collection(quizzesCollection).Doc(quizID).Update(ctx, []firestore.Update{
		{Path: "questionIds", Value: questionIDs},
	})
	return err
}

// ── Questions ──────────────────────────────────────────────────────────────────

// GetQuestionsByQuizAdmin returns all questions for a quiz (admin, all statuses).
func (r *CMSRepository) GetQuestionsByQuizAdmin(ctx context.Context, quizID string) ([]*domain.Question, error) {
	docs, err := r.db.Collection(questionsCollection).
		Where("quizId", "==", quizID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	questions := make([]*domain.Question, 0, len(docs))
	for _, doc := range docs {
		var q domain.Question
		if err := doc.DataTo(&q); err != nil {
			continue
		}
		questions = append(questions, &q)
	}
	sort.Slice(questions, func(i, j int) bool { return questions[i].Order < questions[j].Order })
	return questions, nil
}

// CreateQuestion creates a new question and adds its ID to the quiz's questionIds.
func (r *CMSRepository) CreateQuestion(ctx context.Context, q *domain.Question) error {
	q.ID = uuid.New().String()
	q.CreatedAt = time.Now()
	if q.Status == "" {
		q.Status = domain.QuestionStatusActive
	}
	if q.ApprovalStatus == "" {
		q.ApprovalStatus = domain.ApprovalStatusApproved // admin-created = auto-approved
	}
	if q.Tier == "" {
		q.Tier = domain.TierAdmin
	}
	_, err := r.db.Collection(questionsCollection).Doc(q.ID).Set(ctx, q)
	return err
}

// UpdateQuestion updates mutable fields on a Question.
// Never updates correctAnswer silently — caller must explicitly set it.
func (r *CMSRepository) UpdateQuestion(ctx context.Context, id string, updates map[string]interface{}) error {
	fsUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fsUpdates = append(fsUpdates, firestore.Update{Path: k, Value: v})
	}
	_, err := r.db.Collection(questionsCollection).Doc(id).Update(ctx, fsUpdates)
	return err
}

// GetQuestionByIDAdmin returns a single question with all fields (admin-only).
func (r *CMSRepository) GetQuestionByIDAdmin(ctx context.Context, id string) (*domain.Question, error) {
	doc, err := r.db.Collection(questionsCollection).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}
	var q domain.Question
	if err := doc.DataTo(&q); err != nil {
		return nil, err
	}
	return &q, nil
}

// ArchiveQuestion soft-deletes a question by setting status = "archived".
// The question is NOT physically deleted so historical attempts remain valid.
func (r *CMSRepository) ArchiveQuestion(ctx context.Context, questionID string) error {
	_, err := r.db.Collection(questionsCollection).Doc(questionID).Update(ctx, []firestore.Update{
		{Path: "status", Value: domain.QuestionStatusArchived},
	})
	return err
}

// UpdateChapterCount updates the chapterCount field on a unit (called after chapter create/archive).
func (r *CMSRepository) UpdateChapterCount(ctx context.Context, unitID string) error {
	docs, err := r.db.Collection(chaptersCollection).
		Where("unitId", "==", unitID).
		Where("isActive", "==", true).
		Documents(ctx).GetAll()
	if err != nil {
		return fmt.Errorf("count chapters: %w", err)
	}
	_, err = r.db.Collection(unitsCollection).Doc(unitID).Update(ctx, []firestore.Update{
		{Path: "chapterCount", Value: len(docs)},
	})
	return err
}
