import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  /** Create an invite (if none active) and email the join link. */
  async create(dto: CreateInviteDto, invitedById: string) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('That email already has an account.');
    }

    const pending = await this.prisma.invite.findFirst({
      where: { email, status: 'PENDING' },
    });
    if (pending) {
      throw new ConflictException('That email already has a pending invite.');
    }

    const invite = await this.prisma.invite.create({
      data: {
        email,
        role: dto.role ?? 'MEMBER',
        firstName: dto.firstName,
        lastName: dto.lastName,
        invitedById,
      },
    });

    await this.auth.sendInviteEmail(email, dto.firstName, dto.lastName);
    return invite;
  }

  /** All invites, newest first. */
  list() {
    return this.prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /** Revoke a pending invite. */
  async revoke(id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found.');
    }
    if (invite.status !== 'PENDING') {
      throw new ConflictException('Only pending invites can be revoked.');
    }
    return this.prisma.invite.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
