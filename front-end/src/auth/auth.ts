export type Role = 'MEMBER' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  role: Role
  firstName?: string
  lastName?: string
}
