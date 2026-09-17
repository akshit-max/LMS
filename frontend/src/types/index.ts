// Domain types mirroring the Go backend domain models.
// These are the shapes of data returned from the API.

export type UserRole = 'student' | 'admin' | 'teacher' | 'school_admin'
export type StudentType = 'independent' | 'school'
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'expired'

export interface User {
  uid: string
  email: string
  displayName: string
  role: UserRole
  studentType: StudentType
  accountStatus: AccountStatus
  institutionId: string
  classId: string
  avatarId: string
  createdAt: string
  approvedAt: string | null
  accessExpiresAt: string | null
  isIndependent: boolean
}

// Quiz / Question types
export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_blank'
  | 'reorder'
  | 'drag_drop'
  | 'match'
  | 'odd_one_out'

// QuestionPublic — what the frontend receives during a quiz session (NO correctAnswer)
export interface QuestionPublic {
  id: string
  type: QuestionType
  text: string
  options: string[]
}

export interface QuizPublic {
  id: string
  chapterId: string
  unitId: string
  title: string
  totalQuestions: number
  passingScore: number
}

// Attempt types
export interface AttemptStartResponse {
  attemptId: string
  questions: QuestionPublic[]
  startedAt: string
}

export interface AnswerSubmission {
  questionId: string
  selectedAnswer: string
  timeTakenMs?: number
}

export interface QuestionResult {
  questionId: string
  selectedAnswer: string
  correctAnswer: string  // Only revealed AFTER submission
  isCorrect: boolean
  explanation: string    // Only revealed AFTER submission
  timeTakenMs: number
}

export interface AttemptResult {
  attemptId: string
  score: number
  starsEarned: number
  xpEarned: number
  passed: boolean
  attemptNumber: number
  questionResults: QuestionResult[]
  unitComplete: boolean
  unlockRequestCreated: boolean
  personalBest: boolean
  // Gamification — set by backend
  rankUpTitle: string    // non-empty string if student just ranked up
  badgesEarned: string[] // badge IDs newly awarded this submission
  maxCombo: number       // highest consecutive correct streak this attempt
}

// Progress
export interface StudentProgress {
  userId: string
  totalXP: number
  totalStars: number
  rankTitle: string
  structureCount: number
  currentStreak: number
  bestStreak: number
  completedChapters: string[]
  completedUnits: string[]
  coins: number
  badges: string[]
  botTrophies: string[]
  quizzesCompletedToday: number
  lastQuizDate: string
}

// Curriculum
export type ChapterStatusType = 'locked' | 'available' | 'completed'

export interface Unit {
  id: string
  title: string
  description: string
  order: number
  chapterCount: number
}

export interface Chapter {
  id: string
  unitId: string
  title: string
  order: number
  lessonVideoUrl: string
  pdfUrl: string
  quizId: string
  status: ChapterStatusType
  bestScore: number
  bestStars: number
}

// Notifications
export interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}
