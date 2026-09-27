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
