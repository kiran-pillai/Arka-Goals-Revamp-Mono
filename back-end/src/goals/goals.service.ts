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
    if (dto.measureType === 'ACTION_BASED' && !dto.targetValue) {
      throw new BadRequestException(
        'Action-based goals require a target value.',
      );
    }

    return this.prisma.goal.create({
      data: {
        userId,
        type: dto.type,
        measureType: dto.measureType,
        title: dto.title,
        description: dto.description,
        targetValue: dto.measureType === 'ACTION_BASED' ? dto.targetValue : null,
        periodChoice: dto.type === 'QUARTERLY' ? 'QUARTERLY' : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  list(userId: string, mine: boolean) {
    return this.prisma.goal.findMany({
      where: mine ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
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

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        currentValue: dto.currentValue,
        status: dto.status,
      },
    });
  }
}
