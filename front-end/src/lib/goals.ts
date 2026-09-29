import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Goal, GoalInput, GoalUpdate } from '../goal'

const goalsKey = (mine: boolean) => ['goals', { mine }] as const

export function useGoals(mine: boolean) {
  return useQuery({
    queryKey: goalsKey(mine),
    queryFn: () => api<Goal[]>(`/goals?mine=${mine}`),
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: GoalInput) =>
      api<Goal>('/goals', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: GoalUpdate & { id: string }) =>
      api<Goal>(`/goals/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}
