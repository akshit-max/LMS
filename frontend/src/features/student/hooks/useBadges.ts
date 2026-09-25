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

export interface RankBadgeInfo {
  rank: number
  title: string
  shortLabel: string
  icon: string
  haloClass: string
  badgeBg: string
  textClass: string
  borderClass: string
  bannerMessage: string
}

export function getTop3RankBadge(rank: number | null | undefined): RankBadgeInfo | null {
  if (!rank || rank > 3) return null
  if (rank === 1) {
    return {
      rank: 1,
      title: '#1 Champion',
      shortLabel: '🥇 #1 Leader',
      icon: '👑',
      haloClass: 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/30',
      textClass: 'text-amber-500',
      borderClass: 'border-amber-400/80',
      bannerMessage: '👑 You are #1 on the Leaderboard! Reign supreme, Grammar Champion!',
    }
  }
  if (rank === 2) {
    return {
      rank: 2,
      title: '#2 Silver Master',
      shortLabel: '🥈 #2 Master',
      icon: '🥈',
      haloClass: 'ring-4 ring-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.7)]',
      badgeBg: 'bg-gradient-to-r from-slate-200 via-slate-300 to-sky-300 text-slate-900 font-black shadow-md',
      textClass: 'text-slate-600',
      borderClass: 'border-slate-300',
      bannerMessage: '🥈 #2 on the Leaderboard! You are one streak away from taking the #1 Crown!',
    }
  }
  return {
    rank: 3,
    title: '#3 Bronze Elite',
    shortLabel: '🥉 #3 Elite',
    icon: '🥉',
    haloClass: 'ring-4 ring-amber-600/80 shadow-[0_0_15px_rgba(217,119,6,0.6)]',
    badgeBg: 'bg-gradient-to-r from-amber-700 via-orange-500 to-amber-800 text-white font-black shadow-md',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-600',
    bannerMessage: '🥉 #3 on the Leaderboard! Top 3 Elite status — keep pushing for gold!',
  }
}

export function useUserLeaderboardRank() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['leaderboard', 'user-rank', uid],
    queryFn: async () => {
      const res = await api.get<{ leaderboard: Array<{ rank: number; userId: string; isCurrentUser: boolean }>; callerEntry: { rank: number } | null }>(`/leaderboard?period=alltime`)
      const rank = res.data.callerEntry?.rank ?? res.data.leaderboard.find(e => e.isCurrentUser)?.rank ?? null
      return rank
    },
    enabled: !!uid,
    staleTime: 60_000,
  })
}

