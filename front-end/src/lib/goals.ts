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
 * Returns true when the current user already has both a regular goal
 * (MONTHLY or QUARTERLY) AND a GIVE_UP goal created in the current period,
 * meaning the Set Goals form should be locked.
 */
export function useIsGoalSetupLocked(): boolean {
  const { data: goals } = useGoals(true)

  return useMemo(() => {
    if (!goals || goals.length === 0) return false

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentQuarter = getQuarter(now)

    const activeGoals = goals.filter((g) => g.status === 'ACTIVE')

    const inCurrentPeriod = (goal: Goal): boolean => {
      const created = new Date(goal.createdAt)
      if (created.getFullYear() !== currentYear) return false

      if (goal.type === 'MONTHLY' || goal.type === 'GIVE_UP') {
        // For monthly goals and give-ups paired with monthly, check same month
        return created.getMonth() === currentMonth
      }
      if (goal.type === 'QUARTERLY') {
        // For quarterly goals, check same quarter
        return getQuarter(created) === currentQuarter
      }
      return false
    }

    const hasRegularGoal = activeGoals.some(
      (g) =>
        (g.type === 'MONTHLY' || g.type === 'QUARTERLY') && inCurrentPeriod(g),
    )
    const hasGiveUp = activeGoals.some(
      (g) => g.type === 'GIVE_UP' && inCurrentPeriod(g),
    )

    return hasRegularGoal && hasGiveUp
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
