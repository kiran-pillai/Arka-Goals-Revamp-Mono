import type { Role } from '../../generated/prisma/client';

/** Shape attached to `request.user` after the JWT is validated. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

/** Signed JWT payload. `sub` is the user id (JWT convention). */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

export const SESSION_COOKIE = 'session';
