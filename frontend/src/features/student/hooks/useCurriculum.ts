import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { StudentProgress } from '@/types'
import { useAuthStore } from '@/store/authStore'

// ─── Types matching backend service responses ───────────────────────────────

export interface UnitWithStatus {
  id: string
  title: string
  description: string
  order: number
  chapterCount: number
  status: 'locked' | 'available' | 'completed'
  chaptersCompleted: number
  totalChapters: number
}

export interface ChapterWithStatus {
  id: string
  unitId: string
  title: string
  order: number
  lessonVideoUrl: string
  pdfUrl: string
  quizId: string
  status: 'locked' | 'available' | 'completed'
  bestScore: number
  bestStars: number
}

// ─── Query hooks ────────────────────────────────────────────────────────────

export function useUnits() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['units', uid],
    queryFn: async () => {
      const res = await api.get<{ units: UnitWithStatus[] }>('/units')
      return res.data.units
    },
    enabled: !!uid,
  })
}

export function useChapters(unitId: string) {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['chapters', unitId, uid],
    queryFn: async () => {
      const res = await api.get<{ chapters: ChapterWithStatus[] }>(`/units/${unitId}/chapters`)
      return res.data.chapters
    },
    enabled: !!unitId && !!uid,
  })
}

export function useChapter(chapterId: string) {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['chapter', chapterId, uid],
    queryFn: async () => {
      const res = await api.get<ChapterWithStatus>(`/chapters/${chapterId}`)
      return res.data
    },
    enabled: !!chapterId && !!uid,
  })
}

export function useProgress() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['progress', uid],
    queryFn: async () => {
      const res = await api.get<StudentProgress>('/progress')
      return res.data
    },
    enabled: !!uid,
  })
}
