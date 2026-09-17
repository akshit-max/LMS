import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export interface BadgeAward {
  badgeId: string
  name: string
  description: string
  icon: string
  awardedAt: string
}

export function useMyBadges() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['me', 'badges', uid],
    queryFn: async () => {
      const res = await api.get<{ badges: BadgeAward[] }>('/me/badges')
      return res.data.badges ?? []
    },
    enabled: !!uid,
    staleTime: 60_000, // badges don't change often — 1-minute stale
  })
}
