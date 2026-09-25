import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QuestionPublic, AnswerSubmission } from '@/types'

// Practice session state — COMPLETELY SEPARATE from the mastery quiz session store.
// Practice submissions go to /practice/... endpoints which have NO progression side effects.
// This store must never be used for mastery quiz flow.
// Persisted to sessionStorage so page refresh does not lose the active session.

export interface PracticeQuestionResult {
  questionId: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  timeTakenMs: number
}

export interface PracticeResult {
  attemptId: string
  score: number
  correctCount: number
  totalQuestions: number
  questionResults: PracticeQuestionResult[]
  maxCombo: number
}

type PracticeStatus = 'idle' | 'in_progress' | 'submitting' | 'completed'

interface PracticeSessionState {
  attemptId:    string | null
  quizId:       string | null
  questions:    QuestionPublic[]
  currentIndex: number
  answers:      AnswerSubmission[]
  result:       PracticeResult | null
  status:       PracticeStatus

  startSession: (attemptId: string, quizId: string, questions: QuestionPublic[]) => void
  recordAnswer: (answer: AnswerSubmission) => void
  nextQuestion: () => void
  setResult:    (result: PracticeResult) => void
  setStatus:    (status: PracticeStatus) => void
  reset:        () => void
}

const initialState = {
  attemptId:    null,
  quizId:       null,
  questions:    [] as QuestionPublic[],
  currentIndex: 0,
  answers:      [] as AnswerSubmission[],
  result:       null,
  status:       'idle' as PracticeStatus,
}

export const usePracticeSessionStore = create<PracticeSessionState>()(
  persist(
    (set) => ({
      ...initialState,

      startSession: (attemptId, quizId, questions) =>
        set({ ...initialState, attemptId, quizId, questions, status: 'in_progress' }),

      recordAnswer: (answer) =>
        set(s => ({
          answers: [
            ...s.answers.filter(a => a.questionId !== answer.questionId),
            answer,
          ],
        })),

      nextQuestion: () =>
        set(s => ({ currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1) })),

      setResult: (result) => set({ result, status: 'completed' }),
      setStatus: (status) => set({ status }),
      reset: () => set(initialState),
    }),
    {
      name: 'grammoquest-practice-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        attemptId:    state.attemptId,
        quizId:       state.quizId,
        questions:    state.questions,
        currentIndex: state.currentIndex,
        answers:      state.answers,
        result:       state.result,
        status:       state.status,
      }),
    }
  )
)

export function usePracticeCurrentQuestion(): QuestionPublic | null {
  const { questions, currentIndex } = usePracticeSessionStore()
  return questions[currentIndex] ?? null
}

export function usePracticeProgress() {
  const { questions, currentIndex, answers } = usePracticeSessionStore()
  return { current: answers.length, total: questions.length, index: currentIndex }
}
