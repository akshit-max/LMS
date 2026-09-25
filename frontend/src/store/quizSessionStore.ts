import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QuestionPublic, AnswerSubmission, AttemptResult } from '@/types'

// Quiz session state — only for the duration of an active quiz attempt.
// All authoritative data lives in Firestore; this is purely UI/session state.
// Persisted to sessionStorage so page refresh does not lose the active session.
//
// SECURITY: correctAnswer is never stored here. Questions come from
// the backend start response which strips correctAnswer before sending.

type QuizStatus = 'idle' | 'in_progress' | 'submitting' | 'completed'

interface QuizSessionState {
  attemptId:        string | null
  quizId:           string | null
  questions:        QuestionPublic[]
  currentIndex:     number
  answers:          AnswerSubmission[]
  result:           AttemptResult | null
  status:           QuizStatus

  // Actions
  startSession:  (attemptId: string, quizId: string, questions: QuestionPublic[]) => void
  recordAnswer:  (answer: AnswerSubmission) => void
  nextQuestion:  () => void
  setResult:     (result: AttemptResult) => void
  setStatus:     (status: QuizStatus) => void
  reset:         () => void
}

const initialState = {
  attemptId:    null,
  quizId:       null,
  questions:    [] as QuestionPublic[],
  currentIndex: 0,
  answers:      [] as AnswerSubmission[],
  result:       null,
  status:       'idle' as QuizStatus,
}

export const useQuizSessionStore = create<QuizSessionState>()(
  persist(
    (set, get) => ({
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

      setResult: (result) =>
        set({ result, status: 'completed' }),

      setStatus: (status) =>
        set({ status }),

      reset: () => set(initialState),
    }),
    {
      name: 'grammoquest-quiz-session',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the data fields, not the action functions
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

// ─── Selector hooks ───────────────────────────────────────────────────────────

/** Returns the current question being displayed. */
export function useCurrentQuestion(): QuestionPublic | null {
  const { questions, currentIndex } = useQuizSessionStore()
  return questions[currentIndex] ?? null
}

/** Returns { current, total } for the progress bar. */
export function useQuizProgress() {
  const { questions, currentIndex, answers } = useQuizSessionStore()
  return {
    current: answers.length,       // answered so far
    total:   questions.length,
    index:   currentIndex,
  }
}
