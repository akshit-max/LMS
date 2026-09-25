package service

import (
	"context"
	"fmt"
	"time"

	"grammoquest/internal/domain"
	"grammoquest/internal/repository"
)

// CMSService handles admin Create/Update/Archive operations for curriculum content.
// It orchestrates cross-entity operations (e.g. creating a quiz + linking to chapter).
// IMPORTANT: This service NEVER modifies student progress, chapter statuses, or attempt data.
type CMSService struct {
	cmsRepo     *repository.CMSRepository
	notifRepo   *repository.NotificationRepository
}

func NewCMSService(
	cmsRepo *repository.CMSRepository,
	notifRepo *repository.NotificationRepository,
) *CMSService {
	return &CMSService{
		cmsRepo:   cmsRepo,
		notifRepo: notifRepo,
	}
}

// ── Units ──────────────────────────────────────────────────────────────────────

func (s *CMSService) ListUnitsAdmin(ctx context.Context) ([]*domain.Unit, error) {
	return s.cmsRepo.GetAllUnitsAdmin(ctx)
}

func (s *CMSService) GetUnitAdmin(ctx context.Context, id string) (*domain.Unit, error) {
	u, err := s.cmsRepo.GetUnitByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, fmt.Errorf("unit not found: %s", id)
	}
	return u, nil
}

type CreateUnitRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Order       int    `json:"order"`
	Status      string `json:"status"` // draft | published
	CreatedBy   string `json:"-"`       // set from JWT by handler
}

func (s *CMSService) CreateUnit(ctx context.Context, req *CreateUnitRequest) (*domain.Unit, error) {
	if req.Title == "" {
		return nil, fmt.Errorf("unit title is required")
	}
	u := &domain.Unit{
		Title:       req.Title,
		Description: req.Description,
		Order:       req.Order,
		Status:      req.Status,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   time.Now(),
	}
	if err := s.cmsRepo.CreateUnit(ctx, u); err != nil {
		return nil, fmt.Errorf("create unit: %w", err)
	}
	_ = s.auditLog(ctx, req.CreatedBy, "UNIT_CREATED", u.ID, map[string]interface{}{
		"title": u.Title, "status": u.Status,
	})
	return u, nil
}

type UpdateUnitRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Order       *int    `json:"order"`
	Status      *string `json:"status"`
	UpdatedBy   string  `json:"-"`
}

func (s *CMSService) UpdateUnit(ctx context.Context, unitID string, req *UpdateUnitRequest) error {
	updates := map[string]interface{}{}
	if req.Title != nil {
		if *req.Title == "" {
			return fmt.Errorf("unit title cannot be empty")
		}
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Order != nil {
		updates["order"] = *req.Order
	}
	if req.Status != nil {
		if *req.Status != domain.UnitStatusDraft && *req.Status != domain.UnitStatusPublished && *req.Status != domain.UnitStatusArchived {
			return fmt.Errorf("invalid status: %s", *req.Status)
		}
		updates["status"] = *req.Status
	}
	if len(updates) == 0 {
		return nil
	}
	if err := s.cmsRepo.UpdateUnit(ctx, unitID, updates); err != nil {
		return fmt.Errorf("update unit: %w", err)
	}
	action := "UNIT_UPDATED"
	if req.Status != nil && *req.Status == domain.UnitStatusPublished {
		action = "UNIT_PUBLISHED"
	} else if req.Status != nil && *req.Status == domain.UnitStatusArchived {
		action = "UNIT_ARCHIVED"
	}
	_ = s.auditLog(ctx, req.UpdatedBy, action, unitID, updates)
	return nil
}

// ── Chapters ───────────────────────────────────────────────────────────────────

func (s *CMSService) ListChaptersAdmin(ctx context.Context, unitID string) ([]*domain.Chapter, error) {
	return s.cmsRepo.GetChaptersByUnitAdmin(ctx, unitID)
}

func (s *CMSService) GetChapterAdmin(ctx context.Context, id string) (*domain.Chapter, error) {
	c, err := s.cmsRepo.GetChapterByIDAdmin(ctx, id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, fmt.Errorf("chapter not found: %s", id)
	}
	return c, nil
}

type CreateChapterRequest struct {
	UnitID      string `json:"unitId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Order       int    `json:"order"`
	Status      string `json:"status"`
	CreatedBy   string `json:"-"`
}

func (s *CMSService) CreateChapter(ctx context.Context, req *CreateChapterRequest) (*domain.Chapter, error) {
	if req.Title == "" {
		return nil, fmt.Errorf("chapter title is required")
	}
	if req.UnitID == "" {
		return nil, fmt.Errorf("unitId is required")
	}
	c := &domain.Chapter{
		UnitID:      req.UnitID,
		Title:       req.Title,
		Description: req.Description,
		Order:       req.Order,
		Status:      req.Status,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   time.Now(),
	}
	if err := s.cmsRepo.CreateChapter(ctx, c); err != nil {
		return nil, fmt.Errorf("create chapter: %w", err)
	}
	// Update unit's chapter count
	_ = s.cmsRepo.UpdateChapterCount(ctx, req.UnitID)
	_ = s.auditLog(ctx, req.CreatedBy, "CHAPTER_CREATED", c.ID, map[string]interface{}{
		"unitId": c.UnitID, "title": c.Title, "status": c.Status,
	})
	return c, nil
}

type UpdateChapterRequest struct {
	Title          *string `json:"title"`
	Description    *string `json:"description"`
	Order          *int    `json:"order"`
	Status         *string `json:"status"`
	LessonVideoURL *string `json:"lessonVideoUrl"`
	PDFURL         *string `json:"pdfUrl"`
	UpdatedBy      string  `json:"-"`
}

func (s *CMSService) UpdateChapter(ctx context.Context, chapterID string, req *UpdateChapterRequest) error {
	updates := map[string]interface{}{}
	if req.Title != nil {
		if *req.Title == "" {
			return fmt.Errorf("chapter title cannot be empty")
		}
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Order != nil {
		updates["order"] = *req.Order
	}
	if req.Status != nil {
		if *req.Status != domain.UnitStatusDraft && *req.Status != domain.UnitStatusPublished && *req.Status != domain.UnitStatusArchived {
			return fmt.Errorf("invalid status: %s", *req.Status)
		}
		updates["status"] = *req.Status
	}
	if req.LessonVideoURL != nil {
		updates["lessonVideoUrl"] = *req.LessonVideoURL
	}
	if req.PDFURL != nil {
		updates["pdfUrl"] = *req.PDFURL
	}
	if len(updates) == 0 {
		return nil
	}
	
	// Get unitID before updating, in case status changes
	var unitID string
	if req.Status != nil {
		if c, _ := s.cmsRepo.GetChapterByIDAdmin(ctx, chapterID); c != nil {
			unitID = c.UnitID
		}
	}

	if err := s.cmsRepo.UpdateChapter(ctx, chapterID, updates); err != nil {
		return fmt.Errorf("update chapter: %w", err)
	}
	
	if unitID != "" {
		_ = s.cmsRepo.UpdateChapterCount(context.Background(), unitID)
	}

	action := "CHAPTER_UPDATED"
	if req.Status != nil && *req.Status == domain.UnitStatusPublished {
		action = "CHAPTER_PUBLISHED"
	} else if req.Status != nil && *req.Status == domain.UnitStatusArchived {
		action = "CHAPTER_ARCHIVED"
	}
	_ = s.auditLog(ctx, req.UpdatedBy, action, chapterID, updates)
	return nil
}

// ── Quizzes ────────────────────────────────────────────────────────────────────

func (s *CMSService) GetQuizAdmin(ctx context.Context, id string) (*domain.Quiz, error) {
	return s.cmsRepo.GetQuizByIDAdmin(ctx, id)
}

func (s *CMSService) GetQuizByChapter(ctx context.Context, chapterID string) (*domain.Quiz, error) {
	return s.cmsRepo.GetQuizByChapter(ctx, chapterID)
}

type CreateQuizRequest struct {
	ChapterID    string `json:"chapterId"`
	UnitID       string `json:"unitId"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	PassingScore int    `json:"passingScore"`
	Status       string `json:"status"`
	CreatedBy    string `json:"-"`
}

func (s *CMSService) CreateQuiz(ctx context.Context, req *CreateQuizRequest) (*domain.Quiz, error) {
	if req.Title == "" {
		return nil, fmt.Errorf("quiz title is required")
	}
	if req.ChapterID == "" {
		return nil, fmt.Errorf("chapterId is required")
	}
	if req.UnitID == "" {
		return nil, fmt.Errorf("unitId is required")
	}
	if req.PassingScore == 0 {
		req.PassingScore = 90
	}
	q := &domain.Quiz{
		ChapterID:    req.ChapterID,
		UnitID:       req.UnitID,
		Title:        req.Title,
		Description:  req.Description,
		PassingScore: req.PassingScore,
		Status:       req.Status,
		Tier:         domain.TierAdmin,
		CreatedBy:    req.CreatedBy,
		QuestionIDs:  []string{},
	}
	if err := s.cmsRepo.CreateQuiz(ctx, q); err != nil {
		return nil, fmt.Errorf("create quiz: %w", err)
	}
	// Link quiz to chapter
	if err := s.cmsRepo.SetChapterQuiz(ctx, req.ChapterID, q.ID); err != nil {
		return nil, fmt.Errorf("link quiz to chapter: %w", err)
	}
	_ = s.auditLog(ctx, req.CreatedBy, "QUIZ_CREATED", q.ID, map[string]interface{}{
		"chapterId": q.ChapterID, "title": q.Title,
	})
	return q, nil
}

type UpdateQuizRequest struct {
	Title        *string  `json:"title"`
	Description  *string  `json:"description"`
	PassingScore *int     `json:"passingScore"`
	Status       *string  `json:"status"`
	QuestionIDs  []string `json:"questionIds"` // for reordering
	UpdatedBy    string   `json:"-"`
}

func (s *CMSService) UpdateQuiz(ctx context.Context, quizID string, req *UpdateQuizRequest) error {
	updates := map[string]interface{}{}
	if req.Title != nil {
		if *req.Title == "" {
			return fmt.Errorf("quiz title cannot be empty")
		}
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.PassingScore != nil {
		if *req.PassingScore < 1 || *req.PassingScore > 100 {
			return fmt.Errorf("passingScore must be 1-100")
		}
		updates["passingScore"] = *req.PassingScore
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.QuestionIDs != nil {
		if err := s.cmsRepo.UpdateQuizQuestionIDs(ctx, quizID, req.QuestionIDs); err != nil {
			return fmt.Errorf("update question order: %w", err)
		}
	}
	if len(updates) > 0 {
		if err := s.cmsRepo.UpdateQuiz(ctx, quizID, updates); err != nil {
			return fmt.Errorf("update quiz: %w", err)
		}
	}
	_ = s.auditLog(ctx, req.UpdatedBy, "QUIZ_UPDATED", quizID, updates)
	return nil
}

// ── Questions ──────────────────────────────────────────────────────────────────

func (s *CMSService) ListQuestionsAdmin(ctx context.Context, quizID string) ([]*domain.Question, error) {
	return s.cmsRepo.GetQuestionsByQuizAdmin(ctx, quizID)
}

type CreateQuestionRequest struct {
	QuizID        string   `json:"quizId"`
	ChapterID     string   `json:"chapterId"`
	UnitID        string   `json:"unitId"`
	Type          string   `json:"type"`
	Text          string   `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correctAnswer"`
	Explanation   string   `json:"explanation"`
	Difficulty    string   `json:"difficulty"`
	GrammarTopic  string   `json:"grammarTopic"`
	Order         int      `json:"order"`
	CreatedBy     string   `json:"-"`
}

func (s *CMSService) CreateQuestion(ctx context.Context, req *CreateQuestionRequest) (*domain.Question, error) {
	if req.Text == "" {
		return nil, fmt.Errorf("question text is required")
	}
	if req.Type == "" {
		return nil, fmt.Errorf("question type is required")
	}
	if req.CorrectAnswer == "" {
		return nil, fmt.Errorf("correctAnswer is required")
	}
	if req.QuizID == "" {
		return nil, fmt.Errorf("quizId is required")
	}

	q := &domain.Question{
		QuizID:        req.QuizID,
		ChapterID:     req.ChapterID,
		UnitID:        req.UnitID,
		Type:          req.Type,
		Text:          req.Text,
		Options:       req.Options,
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   req.Explanation,
		Difficulty:    req.Difficulty,
		GrammarTopic:  req.GrammarTopic,
		Order:         req.Order,
		CreatedBy:     req.CreatedBy,
	}
	if err := s.cmsRepo.CreateQuestion(ctx, q); err != nil {
		return nil, fmt.Errorf("create question: %w", err)
	}

	// Add question ID to quiz's questionIds list
	quiz, err := s.cmsRepo.GetQuizByIDAdmin(ctx, req.QuizID)
	if err == nil && quiz != nil {
		newIDs := append(quiz.QuestionIDs, q.ID)
		_ = s.cmsRepo.UpdateQuizQuestionIDs(ctx, req.QuizID, newIDs)
	}

	_ = s.auditLog(ctx, req.CreatedBy, "QUESTION_CREATED", q.ID, map[string]interface{}{
		"quizId": q.QuizID, "type": q.Type,
	})
	return q, nil
}

type UpdateQuestionRequest struct {
	Type          *string  `json:"type"`
	Text          *string  `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer *string  `json:"correctAnswer"`
	Explanation   *string  `json:"explanation"`
	Difficulty    *string  `json:"difficulty"`
	GrammarTopic  *string  `json:"grammarTopic"`
	Order         *int     `json:"order"`
	UpdatedBy     string   `json:"-"`
}

func (s *CMSService) UpdateQuestion(ctx context.Context, questionID string, req *UpdateQuestionRequest) error {
	updates := map[string]interface{}{}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Text != nil {
		if *req.Text == "" {
			return fmt.Errorf("question text cannot be empty")
		}
		updates["text"] = *req.Text
	}
	if req.Options != nil {
		updates["options"] = req.Options
	}
	if req.CorrectAnswer != nil {
		updates["correctAnswer"] = *req.CorrectAnswer
	}
	if req.Explanation != nil {
		updates["explanation"] = *req.Explanation
	}
	if req.Difficulty != nil {
		updates["difficulty"] = *req.Difficulty
	}
	if req.GrammarTopic != nil {
		updates["grammarTopic"] = *req.GrammarTopic
	}
	if req.Order != nil {
		updates["order"] = *req.Order
	}
	if len(updates) == 0 {
		return nil
	}
	if err := s.cmsRepo.UpdateQuestion(ctx, questionID, updates); err != nil {
		return fmt.Errorf("update question: %w", err)
	}
	_ = s.auditLog(ctx, req.UpdatedBy, "QUESTION_UPDATED", questionID, updates)
	return nil
}

func (s *CMSService) ArchiveQuestion(ctx context.Context, adminUID, questionID string) error {
	// Soft-delete: set status = archived so historical attempts still reference the question
	if err := s.cmsRepo.ArchiveQuestion(ctx, questionID); err != nil {
		return fmt.Errorf("archive question: %w", err)
	}
	// Remove from quiz's questionIds
	q, err := s.cmsRepo.GetQuestionByIDAdmin(ctx, questionID)
	if err == nil && q != nil && q.QuizID != "" {
		quiz, err := s.cmsRepo.GetQuizByIDAdmin(ctx, q.QuizID)
		if err == nil && quiz != nil {
			newIDs := make([]string, 0, len(quiz.QuestionIDs))
			for _, id := range quiz.QuestionIDs {
				if id != questionID {
					newIDs = append(newIDs, id)
				}
			}
			_ = s.cmsRepo.UpdateQuizQuestionIDs(ctx, q.QuizID, newIDs)
		}
	}
	_ = s.auditLog(ctx, adminUID, "QUESTION_ARCHIVED", questionID, nil)
	return nil
}

func (s *CMSService) GetQuestionAdmin(ctx context.Context, id string) (*domain.Question, error) {
	return s.cmsRepo.GetQuestionByIDAdmin(ctx, id)
}

// ── Helpers ────────────────────────────────────────────────────────────────────

func (s *CMSService) auditLog(ctx context.Context, actorID, action, targetID string, details map[string]interface{}) error {
	return s.notifRepo.WriteAuditLog(ctx, &domain.AuditLog{
		ActorID:  actorID,
		Action:   action,
		TargetID: targetID,
		Details:  details,
	})
}
