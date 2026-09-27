// A weekly check-in, tied to the authenticated user (persisted server-side).

/** Payload sent when submitting a check-in. */
export type CheckInInput = {
  completedGoal: boolean
  results: string
  commitments: string
  wins: string
  frictions: string
}

/** A check-in as returned by the API, including who submitted it. */
export type CheckIn = CheckInInput & {
  id: string
  createdAt: string
  user: { email: string }
}
