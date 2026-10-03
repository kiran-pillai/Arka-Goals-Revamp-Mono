import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { CheckIn, CheckInInput } from '../checkin'

const checkInsKey = (mine: boolean) => ['checkins', { mine }] as const

/** List check-ins — only the current user's when `mine`, else the whole squad. */
export function useCheckIns(mine: boolean) {
  return useQuery({
    queryKey: checkInsKey(mine),
    queryFn: () => api<CheckIn[]>(`/checkins?mine=${mine}`),
  })
}

/** Submit a check-in, then refresh both the mine and squad lists. */
export function useCreateCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CheckInInput) =>
      api<CheckIn>('/checkins', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  })
}

/** Add a comment to a check-in, then refresh the lists. */
export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ checkInId, text }: { checkInId: string; text: string }) =>
      api(`/checkins/${checkInId}/comments`, { method: 'POST', body: { text } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  })
}

/** Delete a comment, then refresh the lists. */
export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ checkInId, commentId }: { checkInId: string; commentId: string }) =>
      api(`/checkins/${checkInId}/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  })
}
