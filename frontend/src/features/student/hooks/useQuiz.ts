import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { AttemptStartResponse, AttemptResult, AnswerSubmission } from '@/types'
import { useAuthStore } from '@/store/authStore'

// POST /api/v1/quizzes/:quizId/start
export function useStartAttempt() {
  return useMutation({
    mutationFn: async (quizId: string) => {
      const res = await api.post<AttemptStartResponse>(`/quizzes/${quizId}/start`)
      return res.data
    },
  })
}

// POST /api/v1/attempts/:attemptId/submit
// After a successful submission, invalidate all curriculum and progress queries so
// the dashboard and journey pages reflect the new chapter statuses without a manual refresh.
export function useSubmitAttempt() {
  const queryClient = useQueryClient()
  const uid = useAuthStore(s => s.firebaseUser?.uid)

  return useMutation({
    mutationFn: async ({
      attemptId,
      answers,
    }: {
      attemptId: string
      answers: AnswerSubmission[]
    }) => {
      const res = await api.post<AttemptResult>(`/attempts/${attemptId}/submit`, { answers })
      return res.data
    },
    onSuccess: () => {
      // Invalidate all curriculum-related caches so the UI reflects the new
      // chapter/unit statuses immediately — no manual browser refresh needed.
      queryClient.invalidateQueries({ queryKey: ['units', uid] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })   // invalidates all chapters since we scope by unitId and uid further down
      queryClient.invalidateQueries({ queryKey: ['chapter'] })    // same for chapter
      queryClient.invalidateQueries({ queryKey: ['progress', uid] })
    },
  })
}

// GET /api/v1/attempts/:attemptId
export function useAttemptResult(attemptId: string | null) {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['attempt', attemptId, uid],
    queryFn: async () => {
      const res = await api.get<AttemptResult>(`/attempts/${attemptId}`)
      return res.data
    },
    enabled: !!attemptId && !!uid,
  })
}

// POST /api/v1/attempts/:attemptId/check-answer
// Per-question instant feedback. Returns {correct, explanation, combo}.
// correctAnswer is NEVER returned — backend only reveals correct/wrong.
export interface CheckAnswerResponse {
  correct: boolean
  explanation?: string
  combo: number
}

export function useCheckAnswer() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      questionId,
      selectedAnswer,
      timeTakenMs,
    }: {
      attemptId: string
      questionId: string
      selectedAnswer: string
      timeTakenMs: number
    }) => {
      const res = await api.post<CheckAnswerResponse>(
        `/attempts/${attemptId}/check-answer`,
        { questionId, selectedAnswer, timeTakenMs }
      )
      return res.data
    },
  })
}
