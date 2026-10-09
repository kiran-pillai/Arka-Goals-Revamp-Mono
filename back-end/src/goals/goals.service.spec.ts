import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';

const base: CreateGoalDto = {
  type: 'QUARTERLY',
  measureType: 'OUTCOME',
  title: 'Land a new role',
  description: 'Interview, negotiate, sign.',
};

const habit: CreateGoalDto = {
  ...base,
  measureType: 'HABIT_PROCESS',
  title: 'Lift weights',
  frequencyCount: 3,
  frequencyPeriod: 'WEEK',
};

describe('GoalsService', () => {
  let service: GoalsService;
  const goal = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoalsService, { provide: PrismaService, useValue: { goal } }],
    }).compile();

    service = module.get(GoalsService);
  });

  describe('create', () => {
    it('stores a habit/process goal with its frequency and no target value', async () => {
      goal.create.mockResolvedValue({ id: 'g1' });

      await service.create('user-1', habit);

      expect(goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          measureType: 'HABIT_PROCESS',
          frequencyCount: 3,
          frequencyPeriod: 'WEEK',
          targetValue: null,
        }),
      });
    });

    it('rejects a habit/process goal with no frequency count', async () => {
      await expect(
        service.create('user-1', { ...habit, frequencyCount: undefined }),
      ).rejects.toThrow(BadRequestException);
      expect(goal.create).not.toHaveBeenCalled();
    });

    it('rejects a habit/process goal with no frequency period', async () => {
      await expect(
        service.create('user-1', { ...habit, frequencyPeriod: undefined }),
      ).rejects.toThrow(BadRequestException);
      expect(goal.create).not.toHaveBeenCalled();
    });

    it('stores an outcome goal with no frequency and no target value', async () => {
      goal.create.mockResolvedValue({ id: 'g2' });

      await service.create('user-1', base);

      expect(goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          measureType: 'OUTCOME',
          targetValue: null,
          frequencyCount: null,
          frequencyPeriod: null,
        }),
      });
    });

    it('rejects an outcome goal that carries a frequency', async () => {
      await expect(
        service.create('user-1', {
          ...base,
          frequencyCount: 3,
          frequencyPeriod: 'WEEK',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(goal.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('refuses to put a target value on a habit/process goal', async () => {
      goal.findUnique.mockResolvedValue({
        id: 'g1',
        userId: 'user-1',
        lockedAt: null,
        measureType: 'HABIT_PROCESS',
      });

      await expect(
        service.update('user-1', 'g1', { targetValue: 10 }),
      ).rejects.toThrow(BadRequestException);
      expect(goal.update).not.toHaveBeenCalled();
    });

    it('still allows a target value on an outcome goal', async () => {
      goal.findUnique.mockResolvedValue({
        id: 'g2',
        userId: 'user-1',
        lockedAt: null,
        measureType: 'OUTCOME',
      });
      goal.update.mockResolvedValue({ id: 'g2' });

      await service.update('user-1', 'g2', { targetValue: 10 });

      expect(goal.update).toHaveBeenCalledWith({
        where: { id: 'g2' },
        data: expect.objectContaining({ targetValue: 10 }),
      });
    });

    describe('completedAt', () => {
      const existing = (status: string, completedAt: Date | null = null) => ({
        id: 'g1',
        userId: 'user-1',
        lockedAt: null,
        measureType: 'OUTCOME',
        status,
        completedAt,
      });

      const dataPassedToUpdate = () => goal.update.mock.calls[0][0].data;

      it('stamps completedAt when the goal is marked complete', async () => {
        goal.findUnique.mockResolvedValue(existing('ACTIVE'));
        goal.update.mockResolvedValue({ id: 'g1' });

        const before = Date.now();
        await service.update('user-1', 'g1', { status: 'COMPLETED' });
        const after = Date.now();

        const { completedAt } = dataPassedToUpdate();
        expect(completedAt).toBeInstanceOf(Date);
        expect(completedAt.getTime()).toBeGreaterThanOrEqual(before);
        expect(completedAt.getTime()).toBeLessThanOrEqual(after);
      });

      it('clears completedAt when a completed goal is reopened', async () => {
        goal.findUnique.mockResolvedValue(
          existing('COMPLETED', new Date('2026-01-01T00:00:00.000Z')),
        );
        goal.update.mockResolvedValue({ id: 'g1' });

        await service.update('user-1', 'g1', { status: 'ACTIVE' });

        expect(dataPassedToUpdate().completedAt).toBeNull();
      });

      it('clears completedAt when a completed goal moves to FAILED', async () => {
        goal.findUnique.mockResolvedValue(
          existing('COMPLETED', new Date('2026-01-01T00:00:00.000Z')),
        );
        goal.update.mockResolvedValue({ id: 'g1' });

        await service.update('user-1', 'g1', { status: 'FAILED' });

        expect(dataPassedToUpdate().completedAt).toBeNull();
      });

      // `undefined` is what tells Prisma to leave the column untouched, so
      // these assert that exact value rather than merely "not a Date".
      it('leaves completedAt untouched on an edit that omits status', async () => {
        goal.findUnique.mockResolvedValue(
          existing('COMPLETED', new Date('2026-01-01T00:00:00.000Z')),
        );
        goal.update.mockResolvedValue({ id: 'g1' });

        await service.update('user-1', 'g1', { title: 'Renamed' });

        expect(dataPassedToUpdate().completedAt).toBeUndefined();
      });

      it('leaves completedAt untouched when the status is resent unchanged', async () => {
        const stamped = new Date('2026-01-01T00:00:00.000Z');
        goal.findUnique.mockResolvedValue(existing('COMPLETED', stamped));
        goal.update.mockResolvedValue({ id: 'g1' });

        await service.update('user-1', 'g1', { status: 'COMPLETED' });

        expect(dataPassedToUpdate().completedAt).toBeUndefined();
      });

      it('leaves completedAt untouched on a status change that never involves COMPLETED', async () => {
        goal.findUnique.mockResolvedValue(existing('ACTIVE'));
        goal.update.mockResolvedValue({ id: 'g1' });

        await service.update('user-1', 'g1', { status: 'CANCELLED' });

        expect(dataPassedToUpdate().completedAt).toBeUndefined();
      });
    });
  });
});
