import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Runs the 'jwt' strategy; 401s if the session cookie is missing/invalid. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
