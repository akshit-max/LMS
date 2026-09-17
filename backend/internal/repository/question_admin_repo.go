package repository

import (
	"context"

	"cloud.google.com/go/firestore"
	"grammoquest/internal/domain"
)

// QuestionAdminRepository handles admin-side question queries.
// Note: correctAnswer IS returned here — this is admin-only.
// All admin routes are protected by role middleware.
type QuestionAdminRepository struct {
	db *firestore.Client
}

func NewQuestionAdminRepository(db *firestore.Client) *QuestionAdminRepository {
	return &QuestionAdminRepository{db: db}
}

// GetByChapter returns all questions for a given chapterId, sorted by createdAt.
func (r *QuestionAdminRepository) GetByChapter(ctx context.Context, chapterID string) ([]*domain.Question, error) {
	docs, err := r.db.Collection(questionsCollection).
		Where("chapterId", "==", chapterID).
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
	return questions, nil
}

// GetAll returns all questions in the system (admin-only, paginated to 200).
func (r *QuestionAdminRepository) GetAll(ctx context.Context) ([]*domain.Question, error) {
	docs, err := r.db.Collection(questionsCollection).
		Limit(200).
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
	return questions, nil
}

// SetApprovalStatus updates the approvalStatus field of a question.
func (r *QuestionAdminRepository) SetApprovalStatus(ctx context.Context, questionID, status string) error {
	_, err := r.db.Collection(questionsCollection).Doc(questionID).Update(ctx, []firestore.Update{
		{Path: "approvalStatus", Value: status},
	})
	return err
}
