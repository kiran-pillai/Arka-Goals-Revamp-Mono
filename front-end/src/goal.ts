export type GoalType = 'QUARTERLY'
export type MeasureType = 'HABIT_PROCESS' | 'OUTCOME'
export type FrequencyPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER'
export type GoalPeriodChoice = 'QUARTERLY'
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type GoalInput = {
  type: GoalType
  measureType: MeasureType
  title: string
  description: string
  // No `targetValue` here on purpose: creation doesn't collect one. It stays on
  // `Goal` for legacy rows and on `GoalUpdate` for editing an existing goal.
  /** HABIT_PROCESS goals only, and both are required there. */
  frequencyCount?: number
  frequencyPeriod?: FrequencyPeriod
  periodChoice?: GoalPeriodChoice
  dueDate?: string
}

export type Goal = {
  id: string
  userId: string
  type: GoalType
  measureType: MeasureType
  title: string
  description: string
  targetValue: number | null
  frequencyCount: number | null
  frequencyPeriod: FrequencyPeriod | null
  currentValue: number
  status: GoalStatus
  periodChoice: GoalPeriodChoice | null
  dueDate: string | null
  lockedAt: string | null
  /**
   * Set when the goal moves to `COMPLETED`, cleared when it's reopened. Also
   * null on goals completed before this was recorded, so never assume a
   * `COMPLETED` goal has one.
   */
  completedAt: string | null
  createdAt: string
  updatedAt: string
  /**
   * The goal's owner. `firstName`/`lastName` are optional because older rows
   * (and invite-only accounts that never filled them in) may not have them —
   * fall back to `email` when either is missing.
   */
  user: { email: string; firstName?: string; lastName?: string }
}

export type GoalUpdate = {
  title?: string
  description?: string
  targetValue?: number
  currentValue?: number
  status?: GoalStatus
}
