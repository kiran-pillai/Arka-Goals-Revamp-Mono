export type GoalType = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type GoalInput = {
  type: GoalType
  title: string
  smartSpecific: string
  smartMeasurable: string
  smartAchievable: string
  smartRelevant: string
  smartTimeBound: string
  targetValue?: number
  dueDate?: string
}

export type Goal = {
  id: string
  userId: string
  type: GoalType
  title: string
  smartSpecific: string
  smartMeasurable: string
  smartAchievable: string
  smartRelevant: string
  smartTimeBound: string
  targetValue: number | null
  currentValue: number
  status: GoalStatus
  dueDate: string | null
  lockedAt: string | null
  createdAt: string
  updatedAt: string
  user: { email: string }
}

export type GoalUpdate = {
  title?: string
  smartSpecific?: string
  smartMeasurable?: string
  smartAchievable?: string
  smartRelevant?: string
  smartTimeBound?: string
  targetValue?: number
  currentValue?: number
  status?: GoalStatus
}