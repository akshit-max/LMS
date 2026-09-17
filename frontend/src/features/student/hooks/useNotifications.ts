import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnlockRequest {
  id: string
  userId: string
  unitId: string
  status: 'pending' | 'approved' | 'rejected' | 'retry_requested'
  lowestScore: number
  totalRetries: number
  quizScores: Record<string, number>
  completedQuizIds: string[]
  requestedAt: string
  reviewedAt: string | null
  adminNote: string
  studentName?: string
  studentEmail?: string
  unitTitle?: string
}

export interface AppNotification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

// ─── Student hooks ────────────────────────────────────────────────────────────

export function useNotifications() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['notifications', uid],
    queryFn: async () => {
      const res = await api.get<{ notifications: AppNotification[] }>('/notifications')
      return res.data.notifications
    },
    refetchInterval: 30_000, // poll every 30s for new notifications
    enabled: !!uid,
  })
}

export function useUnreadCount() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['notifications', 'unread', uid],
    queryFn: async () => {
      const res = await api.get<{ unreadCount: number }>('/notifications/unread-count')
      return res.data.unreadCount
    },
    refetchInterval: 30_000,
    enabled: !!uid,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notifId: string) => api.post(`/notifications/${notifId}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMyUnlockRequests() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['me', 'unlock-requests', uid],
    queryFn: async () => {
      const res = await api.get<{ requests: UnlockRequest[] }>('/me/unlock-requests')
      return res.data.requests
    },
    enabled: !!uid,
  })
}

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useAdminUnlockRequests() {
  return useQuery({
    queryKey: ['admin', 'unlock-requests'],
    queryFn: async () => {
      const res = await api.get<{ requests: UnlockRequest[] }>('/admin/unlock-requests')
      return res.data.requests
    },
    refetchInterval: 15_000, // auto-refresh every 15s
  })
}

export function useApproveUnlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, adminNote }: { requestId: string; adminNote?: string }) =>
      api.post(`/admin/unlock-requests/${requestId}/approve`, { adminNote: adminNote ?? '' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'unlock-requests'] }),
  })
}

export function useRejectUnlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, adminNote }: { requestId: string; adminNote?: string }) =>
      api.post(`/admin/unlock-requests/${requestId}/reject`, { adminNote: adminNote ?? '' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'unlock-requests'] }),
  })
}

export function useRequestRetry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, adminNote }: { requestId: string; adminNote?: string }) =>
      api.post(`/admin/unlock-requests/${requestId}/retry`, { adminNote: adminNote ?? '' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'unlock-requests'] }),
  })
}
