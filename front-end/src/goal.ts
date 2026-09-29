export type GoalType = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'GIVE_UP'
export type MeasureType = 'ACTION_BASED' | 'PASS_FAIL'
export type GoalPeriodChoice = 'MONTHLY' | 'QUARTERLY'
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type GoalInput = {
  type: GoalType
  measureType: MeasureType
  title: string
  description?: string
  targetValue?: number
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
  currentValue: number
  status: GoalStatus
  periodChoice: GoalPeriodChoice | null
  dueDate: string | null
  lockedAt: string | null
  createdAt: string
  updatedAt: string
  user: { email: string }
}

export type GoalUpdate = {
  title?: string
  description?: string
  targetValue?: number
  currentValue?: number
  status?: GoalStatus
}
