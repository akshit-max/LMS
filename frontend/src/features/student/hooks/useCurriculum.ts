import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { StudentProgress } from '@/types'

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
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await api.get<{ units: UnitWithStatus[] }>('/units')
      return res.data.units
    },
  })
}

export function useChapters(unitId: string) {
  return useQuery({
    queryKey: ['chapters', unitId],
    queryFn: async () => {
      const res = await api.get<{ chapters: ChapterWithStatus[] }>(`/units/${unitId}/chapters`)
      return res.data.chapters
    },
    enabled: !!unitId,
  })
}

export function useChapter(chapterId: string) {
  return useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      const res = await api.get<ChapterWithStatus>(`/chapters/${chapterId}`)
      return res.data
    },
    enabled: !!chapterId,
  })
}

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const res = await api.get<StudentProgress>('/progress')
      return res.data
    },
  })
}
