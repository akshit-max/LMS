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
	quizzesCollection   = "quizzes"
	questionsCollection = "questions"
)

// QuizRepository handles Firestore operations for Quiz and Question documents.
type QuizRepository struct {
	db *firestore.Client
}

func NewQuizRepository(db *firestore.Client) *QuizRepository {
	return &QuizRepository{db: db}
}

func (r *QuizRepository) GetByID(ctx context.Context, id string) (*domain.Quiz, error) {
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

// GetQuestionsForQuiz fetches all Question documents for a quiz.
// Questions are fetched by the IDs stored on the Quiz (not by a secondary query)
// to ensure we always use the authoritative set the admin configured.
func (r *QuizRepository) GetQuestionsForQuiz(ctx context.Context, quiz *domain.Quiz) ([]*domain.Question, error) {
	if len(quiz.QuestionIDs) == 0 {
		return nil, nil
	}

	questions := make([]*domain.Question, 0, len(quiz.QuestionIDs))
	for _, qid := range quiz.QuestionIDs {
		doc, err := r.db.Collection(questionsCollection).Doc(qid).Get(ctx)
		if err != nil {
			if status.Code(err) == codes.NotFound {
				continue
			}
			return nil, err
		}
		var q domain.Question
		if err := doc.DataTo(&q); err != nil {
			continue
		}
		questions = append(questions, &q)
	}

	// Sort by the order they appear in quiz.QuestionIDs
	orderMap := make(map[string]int, len(quiz.QuestionIDs))
	for i, id := range quiz.QuestionIDs {
		orderMap[id] = i
	}
	sort.Slice(questions, func(i, j int) bool {
		return orderMap[questions[i].ID] < orderMap[questions[j].ID]
	})

	return questions, nil
}

// GetQuestionByID fetches a single question (used during submission grading).
func (r *QuizRepository) GetQuestionByID(ctx context.Context, id string) (*domain.Question, error) {
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
