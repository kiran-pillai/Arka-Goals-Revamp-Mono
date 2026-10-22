import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { timingStatus } from './reporting-week';

const person = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  colorSlot: true,
} as const;

@Injectable()
export class CelebrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async give(userId: string, checkInId: string) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.checkIn.findUnique({
        where: { id: checkInId },
        select: { userId: true },
      });
      if (!target) throw new NotFoundException('Check-in not found.');
      if (target.userId === userId)
        throw new ForbiddenException(
          'You cannot give kudos to your own check-in.',
        );
      return tx.kudos.upsert({
        where: { giverId_checkInId: { giverId: userId, checkInId } },
        create: { giverId: userId, checkInId },
        update: {},
      });
    });
  }

  async recipients(checkInId: string) {
    const target = await this.prisma.checkIn.findUnique({
      where: { id: checkInId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Check-in not found.');
    return this.prisma.kudos.findMany({
      where: { checkInId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, createdAt: true, giver: { select: person } },
    });
  }

  async leaderboard() {
    // Aggregate check-ins separately from kudos so multiple awards never inflate counts.
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        colorSlot: number | null;
        totalSubmissions: number;
        onTimeSubmissions: number;
        rank: number;
        tied: boolean;
      }>
    >`
      WITH counts AS (
        SELECT u."id", u."email", u."firstName", u."lastName", u."colorSlot",
          COUNT(c."id")::int AS "totalSubmissions",
          COUNT(c."id") FILTER (WHERE (c."createdAt" AT TIME ZONE 'UTC') <= c."dueAt")::int AS "onTimeSubmissions"
        FROM "User" u JOIN "CheckIn" c ON c."userId" = u."id"
        GROUP BY u."id"
      ) SELECT *, DENSE_RANK() OVER (ORDER BY "onTimeSubmissions" DESC, "totalSubmissions" DESC)::int AS "rank",
        (COUNT(*) OVER (PARTITION BY "onTimeSubmissions", "totalSubmissions") > 1) AS "tied"
      FROM counts ORDER BY "onTimeSubmissions" DESC, "totalSubmissions" DESC, "id" ASC
    `;
    return rows;
  }

  async dashboard(userId: string) {
    const [checkIns, kudosReceived, recent, leaderboard] = await Promise.all([
      this.prisma.checkIn.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, dueAt: true },
      }),
      this.prisma.kudos.count({ where: { checkIn: { userId } } }),
      this.prisma.kudos.findMany({
        where: { checkIn: { userId } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 5,
        select: {
          id: true,
          checkInId: true,
          createdAt: true,
          giver: { select: person },
          checkIn: { select: { createdAt: true } },
        },
      }),
      this.leaderboard(),
    ]);
    const position = leaderboard.find((row) => row.id === userId);
    return {
      kudosReceived,
      totalSubmissions: checkIns.length,
      onTimeSubmissions: checkIns.filter(
        (c) => timingStatus(c.createdAt, c.dueAt) === 'ON_TIME',
      ).length,
      unknownTimingSubmissions: checkIns.filter((c) => c.dueAt === null).length,
      rank: position?.rank ?? null,
      tied: position?.tied ?? false,
      recentRecognition: recent,
      recentCheckIns: checkIns.slice(0, 6).map((c) => ({
        ...c,
        timingStatus: timingStatus(c.createdAt, c.dueAt),
      })),
    };
  }
}
