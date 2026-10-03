import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { AppConfig } from '../config/configuration';
import type { TokenPurpose } from '../../generated/prisma/client';
import { AuthUser, JwtPayload } from './auth.types';
import { assignColorSlot } from '../users/avatar-color';

const LOGIN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Issue a magic link if the email maps to an existing user (LOGIN) or a
   * pending invite (INVITE). Silent no-op otherwise — the controller always
   * returns 202 so callers can't probe who's registered.
   */
  async requestLink(rawEmail: string): Promise<void> {
    const email = rawEmail.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const url = await this.issueToken(email, 'LOGIN');
      await this.mail.sendLoginLink(email, url);
      return;
    }

    const invite = await this.prisma.invite.findFirst({
      where: { email, status: 'PENDING' },
    });
    if (invite) {
      const url = await this.issueToken(email, 'INVITE');
      await this.mail.sendInviteLink(email, url, invite.firstName ?? undefined, invite.lastName ?? undefined);
      return;
    }

    this.logger.log(`request-link for ${email}: no user or pending invite`);
  }

  /**
   * Consume a magic-link token (single-use, unexpired). Creates the user on
   * first INVITE redemption. Returns the signed JWT and the user for the cookie.
   */
  async verify(rawToken: string): Promise<{ jwt: string; user: AuthUser }> {
    const tokenHash = this.hash(rawToken);

    return this.prisma.$transaction(async (tx) => {
      const token = await tx.magicLinkToken.findUnique({ where: { tokenHash } });
      if (!token || token.consumedAt || token.expiresAt <= new Date()) {
        throw new BadRequestException('This link is invalid or has expired.');
      }

      // Single-use: mark consumed inside the transaction.
      await tx.magicLinkToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      });

      let user = await tx.user.findUnique({ where: { email: token.email } });

      if (token.purpose === 'INVITE') {
        // The invite must still be pending — a revoked/removed invite makes
        // an already-sent link unusable.
        const invite = await tx.invite.findFirst({
          where: { email: token.email, status: 'PENDING' },
        });
        if (!invite && !user) {
          throw new BadRequestException('This link is invalid or has expired.');
        }
        if (!user) {
          const existingUsers = await tx.user.findMany({ select: { colorSlot: true } });
          const usedSlots = existingUsers.map((u) => u.colorSlot).filter((s): s is number => s != null);
          const colorSlot = assignColorSlot(usedSlots);

          user = await tx.user.create({
            data: {
              email: token.email,
              role: invite!.role,
              firstName: invite!.firstName,
              lastName: invite!.lastName,
              colorSlot,
            },
          });
        }
        if (invite) {
          await tx.invite.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED', acceptedAt: new Date() },
          });
        }
      }

      if (!user) {
        // LOGIN token whose user was deleted, or a race — treat as invalid.
        throw new BadRequestException('This link is invalid or has expired.');
      }

      user = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      };
      const jwt = await this.jwt.signAsync(payload);
      return { jwt, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName ?? undefined, lastName: user.lastName ?? undefined } };
    });
  }

  /**
   * Mint an INVITE magic link for an email and send the invite email.
   * Called by the invites flow after an invite row is created.
   */
  async sendInviteEmail(email: string, firstName?: string, lastName?: string): Promise<void> {
    const url = await this.issueToken(email.trim().toLowerCase(), 'INVITE');
    await this.mail.sendInviteLink(email, url, firstName, lastName);
  }

  /** Mint a raw token, store only its hash, return the full magic-link URL. */
  private async issueToken(
    email: string,
    purpose: TokenPurpose,
  ): Promise<string> {
    const rawToken = randomBytes(32).toString('base64url');
    const ttl = purpose === 'INVITE' ? INVITE_TTL_MS : LOGIN_TTL_MS;

    await this.prisma.magicLinkToken.create({
      data: {
        tokenHash: this.hash(rawToken),
        email,
        purpose,
        expiresAt: new Date(Date.now() + ttl),
      },
    });

    const base = this.config.getOrThrow<AppConfig>('app').appBaseUrl;
    return `${base}/auth/callback?token=${rawToken}`;
  }

  private hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
