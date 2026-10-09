import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    const isHabit = dto.measureType === 'HABIT_PROCESS';

    if (isHabit) {
      if (dto.frequencyCount == null || dto.frequencyPeriod == null) {
        throw new BadRequestException(
          'Habit/process goals require a frequency — how many times, and how often.',
        );
      }
    } else if (dto.frequencyCount != null || dto.frequencyPeriod != null) {
      throw new BadRequestException(
        'Outcome goals cannot carry a frequency. Create a habit/process goal instead.',
      );
    }

    return this.prisma.goal.create({
      data: {
        userId,
        type: dto.type,
        measureType: dto.measureType,
        title: dto.title,
        description: dto.description,
        // A newly created goal never has a target value — the creation flow
        // doesn't collect one. Existing rows keep theirs, and the update path
        // can still set one on an OUTCOME goal.
        targetValue: null,
        frequencyCount: isHabit ? dto.frequencyCount : null,
        frequencyPeriod: isHabit ? dto.frequencyPeriod : null,
        periodChoice: dto.type === 'QUARTERLY' ? 'QUARTERLY' : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  list(userId: string, mine: boolean) {
    return this.prisma.goal.findMany({
      where: mine ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found.');
    if (goal.userId !== userId) throw new NotFoundException('Goal not found.');

    if (goal.lockedAt) {
      throw new BadRequestException(
        'This goal is locked and can no longer be modified.',
      );
    }

    // Keeps the update path inside the same shape the create path enforces, so
    // this surfaces as a 400 rather than tripping the database CHECK with a 500.
    if (goal.measureType === 'HABIT_PROCESS' && dto.targetValue != null) {
      throw new BadRequestException(
        'Habit/process goals are measured by their frequency, not a target value.',
      );
    }

    // `completedAt` is derived from the status transition, never taken from the
    // request — `UpdateGoalDto` deliberately has no such field, so a client
    // can't backdate or forge a completion time.
    //
    // It is left `undefined` unless the status actually crosses the COMPLETED
    // boundary, and `undefined` tells Prisma to leave the column alone. So a
    // PATCH that omits `status`, or re-sends the status the goal already has,
    // can't disturb an existing completion time: editing a title must not
    // change when the goal was completed, and re-confirming COMPLETED must not
    // move the date forward.
    let completedAt: Date | null | undefined;
    if (dto.status !== undefined && dto.status !== goal.status) {
      if (dto.status === 'COMPLETED') {
        completedAt = new Date();
      } else if (goal.status === 'COMPLETED') {
        // Reopened, or moved to FAILED/CANCELLED. The old completion time is
        // no longer true of this goal, so it is cleared rather than kept as a
        // stale date a later completion would have to overwrite.
        completedAt = null;
      }
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        currentValue: dto.currentValue,
        status: dto.status,
        completedAt,
      },
    });
  }
}
