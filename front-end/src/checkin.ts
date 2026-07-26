// Shape of a single weekly check-in. FE-only for now — no persistence until
// auth exists to tie check-ins to users.
export type CheckIn = {
  name: string
  completedGoal: 'yes' | 'no'
  results: string
  commitments: string
  wins: string
  frictions: string
}
