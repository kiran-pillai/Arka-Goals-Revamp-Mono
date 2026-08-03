import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RequestLinkDto } from './dto/request-link.dto';
import { VerifyDto } from './dto/verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SESSION_COOKIE } from './auth.types';
import type { AuthUser } from './auth.types';
import type { AppConfig } from '../config/configuration';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Always 202, regardless of whether an email was actually sent. */
  @Post('request-link')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestLink(@Body() dto: RequestLinkDto): Promise<void> {
    await this.auth.requestLink(dto.email);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body() dto: VerifyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser }> {
    const { jwt, user } = await this.auth.verify(dto.token);
    res.cookie(SESSION_COOKIE, jwt, this.cookieOptions());
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private cookieOptions(): CookieOptions {
    const isProd = this.config.getOrThrow<AppConfig>('app').isProd;
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: SESSION_MAX_AGE_MS,
    };
  }
}
