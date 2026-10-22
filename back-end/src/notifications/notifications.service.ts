import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private sign(userId: string, value: string) {
    return createHmac('sha256', this.config.getOrThrow<string>('app.jwtSecret'))
      .update(`notification-snapshot:${userId}:${value}`)
      .digest('hex');
  }

  async list(userId: string, cursor?: string, limit = 20) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new BadRequestException('Invalid limit');
    let after: { id: string; createdAt: Date } | undefined;
    if (cursor) {
      const row = await this.prisma.notification.findFirst({
        where: { id: cursor, recipientId: userId },
      });
      if (!row) throw new BadRequestException('Invalid cursor');
      after = row;
    }
    const snapshot = new Date().toISOString();
    const [rows, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: {
          recipientId: userId,
          ...(after
            ? {
                OR: [
                  { createdAt: { lt: after.createdAt } },
                  { createdAt: after.createdAt, id: { lt: after.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        include: {
          kudos: {
            select: {
              giver: {
                select: { firstName: true, lastName: true, email: true },
              },
              checkIn: { select: { id: true, createdAt: true } },
            },
          },
          comment: {
            select: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
              checkIn: { select: { id: true, createdAt: true } },
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, readAt: null },
      }),
    ]);
    const items = rows.slice(0, limit).map(({ comment, kudos, ...row }) => ({
      id: row.id,
      createdAt: row.createdAt,
      readAt: row.readAt,
      kind: row.kind,
      commentId: row.commentId,
      actor: kudos ? kudos.giver : comment!.user,
      checkInId: (kudos ?? comment)!.checkIn.id,
      checkInDate: (kudos ?? comment)!.checkIn.createdAt,
    }));
    return {
      items,
      unreadCount,
      nextCursor: rows.length > limit ? items.at(-1)?.id : null,
      snapshot: `${snapshot}.${this.sign(userId, snapshot)}`,
    };
  }

  async read(userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });
    if (!row) throw new NotFoundException('Notification not found');
    await this.prisma.notification.updateMany({
      where: { id, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async readAll(userId: string, token: unknown) {
    if (typeof token !== 'string')
      throw new BadRequestException('Invalid snapshot');
    const split = token.lastIndexOf('.');
    const value = token.slice(0, split);
    if (
      token.slice(split + 1) !== this.sign(userId, value) ||
      !Number.isFinite(Date.parse(value))
    ) {
      throw new BadRequestException('Invalid snapshot. Refresh the inbox.');
    }
    await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
        createdAt: { lte: new Date(value) },
      },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
