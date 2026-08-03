import type { Role } from '../../generated/prisma/client';

/** Shape attached to `request.user` after the JWT is validated. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Signed JWT payload. `sub` is the user id (JWT convention). */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export const SESSION_COOKIE = 'session';
