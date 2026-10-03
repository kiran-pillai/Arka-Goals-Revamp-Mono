import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateCheckInDto) {
    return this.prisma.checkIn.create({
      data: { ...dto, userId },
    });
  }

  /**
   * List check-ins, newest first. When `mine` is set, only the caller's;
   * otherwise the whole squad. Includes the submitter's email.
   */
  list(userId: string, mine: boolean) {
    return this.prisma.checkIn.findMany({
      where: mine ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, colorSlot: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { email: true, firstName: true, lastName: true, colorSlot: true } } },
        },
      },
    });
  }
}
