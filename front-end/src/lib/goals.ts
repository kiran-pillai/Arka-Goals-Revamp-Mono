import { useMemo } from 'react'
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

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3)
}

/**
 * Returns true when the current user already has a QUARTERLY goal
 * created in the current period, meaning the Set Goals form should be locked.
 */
export function useIsGoalSetupLocked(): boolean {
  const { data: goals } = useGoals(true)

  return useMemo(() => {
    if (!goals || goals.length === 0) return false

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentQuarter = getQuarter(now)

    const activeGoals = goals.filter((g) => g.status === 'ACTIVE')

    const inCurrentQuarter = (goal: Goal): boolean => {
      const created = new Date(goal.createdAt)
      return (
        created.getFullYear() === currentYear &&
        getQuarter(created) === currentQuarter
      )
    }

    return activeGoals.some(
      (g) => g.type === 'QUARTERLY' && inCurrentQuarter(g),
    )
  }, [goals])
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: GoalUpdate & { id: string }) =>
      api<Goal>(`/goals/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}
