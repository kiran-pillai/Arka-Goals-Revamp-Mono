import { reportingWeek, timingStatus } from './reporting-week';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCheckInDto) {
    const now = new Date();
    const week = reportingWeek(now);
    try {
      return await this.prisma.checkIn.create({
        data: {
          completedGoal: dto.completedGoal,
          results: dto.results,
          commitments: dto.commitments,
          wins: dto.wins,
          frictions: dto.frictions,
          rating: dto.rating,
          userId,
          createdAt: now,
          reportingWeekStart: week.start,
          dueAt: week.dueAt,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException(
          'You have already submitted a check-in for this reporting week.',
        );
      throw error;
    }
  }

  /**
   * List check-ins, newest first. When `mine` is set, only the caller's;
   * otherwise the whole squad. Includes the submitter's email.
   */
  async list(userId: string, mine: boolean) {
    const rows = await this.prisma.checkIn.findMany({
      where: mine ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { kudos: true } },
        kudos: { where: { giverId: userId }, select: { id: true } },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            colorSlot: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                colorSlot: true,
              },
            },
          },
        },
      },
    });
    return rows.map(({ kudos, _count, ...row }) => ({
      ...row,
      timingStatus: timingStatus(row.createdAt, row.dueAt),
      kudosCount: _count.kudos,
      viewerHasGivenKudos: kudos.length > 0,
      canGiveKudos: row.userId !== userId && kudos.length === 0,
    }));
  }
}
