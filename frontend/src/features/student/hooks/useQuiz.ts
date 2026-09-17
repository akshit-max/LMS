import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { AttemptStartResponse, AttemptResult, AnswerSubmission } from '@/types'

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
export function useSubmitAttempt() {
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
  })
}

// GET /api/v1/attempts/:attemptId
export function useAttemptResult(attemptId: string | null) {
  return useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      const res = await api.get<AttemptResult>(`/attempts/${attemptId}`)
      return res.data
    },
    enabled: !!attemptId,
  })
}
