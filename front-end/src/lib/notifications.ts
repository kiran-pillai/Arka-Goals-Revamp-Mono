import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { api } from './api'

export interface InboxItem {
  id: string
  createdAt: string
  readAt: string | null
  actor: { firstName: string | null; lastName: string | null; email: string }
  checkInId: string
  checkInDate: string
}
interface InboxPage { items: InboxItem[]; unreadCount: number; nextCursor: string | null; snapshot: string }

export function useInbox() {
  const { user } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications', user?.id], enabled: !!user,
    initialPageParam: '',
    queryFn: ({ pageParam }) => api<InboxPage>(`/notifications${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`),
    getNextPageParam: page => page.nextCursor ?? undefined,
    refetchInterval: 30_000, refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  })
}

export function useReadNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
export function useReadAllNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (snapshot: string) => api('/notifications/read-all', { method: 'PATCH', body: { snapshot } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
