import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from '../auth/AuthContext'
import type { Goal, GoalInput, GoalUpdate } from '../goal'

const goalsKey = (mine: boolean) => ['goals', { mine }] as const

export function useGoals(mine: boolean) {
  const { user } = useAuth()

  return useQuery({
    queryKey: goalsKey(mine),
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select('*, users(email)')
        .order('created_at', { ascending: false })

      if (mine && user) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        smartSpecific: row.smart_specific,
        smartMeasurable: row.smart_measurable,
        smartAchievable: row.smart_achievable,
        smartRelevant: row.smart_relevant,
        smartTimeBound: row.smart_time_bound,
        targetValue: row.target_value,
        currentValue: row.current_value ?? 0,
        status: row.status,
        dueDate: row.due_date,
        lockedAt: row.locked_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: { email: row.users?.email ?? 'Unknown' }
      })) as Goal[]
    },
    enabled: !mine || !!user,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: GoalInput) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          type: input.type,
          title: input.title,
          smart_specific: input.smartSpecific,
          smart_measurable: input.smartMeasurable,
          smart_achievable: input.smartAchievable,
          smart_relevant: input.smartRelevant,
          smart_time_bound: input.smartTimeBound,
          target_value: input.targetValue,
          due_date: input.dueDate,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: GoalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update({
          title: input.title,
          smart_specific: input.smartSpecific,
          smart_measurable: input.smartMeasurable,
          smart_achievable: input.smartAchievable,
          smart_relevant: input.smartRelevant,
          smart_time_bound: input.smartTimeBound,
          target_value: input.targetValue,
          current_value: input.currentValue,
          status: input.status,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}