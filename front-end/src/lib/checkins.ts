import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from '../auth/AuthContext'
import type { CheckIn, CheckInInput } from '../checkin'

const checkInsKey = (mine: boolean) => ['checkins', { mine }] as const

export function useCheckIns(mine: boolean) {
  const { user } = useAuth()

  return useQuery({
    queryKey: checkInsKey(mine),
    queryFn: async () => {
      let query = supabase
        .from('checkins')
        .select('*, users(email)')
        .order('created_at', { ascending: false })

      if (mine && user) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: any) => ({
        id: row.id,
        completedGoal: row.completed_goal,
        results: row.results,
        commitments: row.commitments,
        wins: row.wins,
        frictions: row.frictions,
        createdAt: row.created_at,
        user: { email: row.users?.email ?? 'Unknown' }
      })) as CheckIn[]
    },
    enabled: !mine || !!user,
  })
}

export function useCreateCheckIn() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CheckInInput) => {
      if (!user) throw new Error('Not authenticated')

      // Filter out empty rows
      const validCommitments = input.commitments
        .map(c => c.trim())
        .filter(c => c.length > 0)

      // 1. Insert the main check-in record
      const { data: checkIn, error: checkInError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          completed_goal: input.completedGoal,
          results: input.results,
          commitments: validCommitments.join('\n'), // Preserve legacy text view
          wins: input.wins,
          frictions: input.frictions,
        })
        .select()
        .single()

      if (checkInError) throw checkInError

      // 2. Insert discrete commitments into the new table for the dashboard
      if (validCommitments.length > 0) {
        const commitmentsData = validCommitments.map(text => ({
          user_id: user.id,
          check_in_id: checkIn.id,
          text: text,
          completed: false,
        }))

        const { error: commitError } = await supabase
          .from('commitments')
          .insert(commitmentsData)

        if (commitError) throw commitError
      }

      return checkIn
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  })
}