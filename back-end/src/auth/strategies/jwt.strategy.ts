import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { AppConfig } from '../../config/configuration';
import { AuthUser, JwtPayload, SESSION_COOKIE } from '../auth.types';

/** Pull the JWT out of the `session` cookie rather than a header. */
function cookieExtractor(req: Request): string | null {
  return req?.cookies?.[SESSION_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<AppConfig>('app').jwtSecret,
    });
  }

  /** Return value becomes `request.user`. */
  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
