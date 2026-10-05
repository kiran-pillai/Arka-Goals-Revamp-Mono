/** Payload sent when submitting a check-in. */
export type CheckInInput = {
  completedGoal: boolean
  results: string
  commitments: string
  wins: string
  frictions: string
  rating: number
}

export type CheckInUser = {
  email: string
  firstName?: string
  lastName?: string
  colorSlot?: number | null
}

export type Comment = {
  id: string
  text: string
  createdAt: string
  user: CheckInUser
}

/** A check-in as returned by the API, including who submitted it. */
export type CheckIn = CheckInInput & {
  id: string
  createdAt: string
  user: CheckInUser
  comments?: Comment[]
}
