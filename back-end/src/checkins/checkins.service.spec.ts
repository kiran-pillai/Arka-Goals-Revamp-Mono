import { Test, TestingModule } from '@nestjs/testing';
import { CheckInsService } from './checkins.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';

const dto: CreateCheckInDto = {
  completedGoal: true,
  results: 'Shipped the migration',
  commitments: 'Wire up the table',
  wins: 'Auth landed',
  frictions: 'Local db was down',
};

describe('CheckInsService', () => {
  let service: CheckInsService;
  const checkIn = { create: jest.fn(), findMany: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInsService,
        { provide: PrismaService, useValue: { checkIn } },
      ],
    }).compile();

    service = module.get(CheckInsService);
  });

  describe('create', () => {
    it('ties the check-in to the caller rather than trusting the body', async () => {
      checkIn.create.mockResolvedValue({ id: 'c1' });

      await service.create('user-1', dto);

      expect(checkIn.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });

    it('ignores a userId smuggled in through the payload', async () => {
      checkIn.create.mockResolvedValue({ id: 'c1' });

      await service.create('user-1', {
        ...dto,
        userId: 'someone-else',
      } as CreateCheckInDto);

      expect(checkIn.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'user-1' }),
      });
    });
  });

  describe('list', () => {
    it('scopes to the caller when mine is set', async () => {
      checkIn.findMany.mockResolvedValue([]);

      await service.list('user-1', true);

      expect(checkIn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('returns the whole squad when mine is not set', async () => {
      checkIn.findMany.mockResolvedValue([]);

      await service.list('user-1', false);

      expect(checkIn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('returns newest first and includes the submitter email', async () => {
      checkIn.findMany.mockResolvedValue([]);

      await service.list('user-1', true);

      expect(checkIn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { email: true, firstName: true, lastName: true, colorSlot: true } } },
        }),
      );
    });

    it('includes colorSlot in the user select for avatar rendering', async () => {
      checkIn.findMany.mockResolvedValue([]);

      await service.list('user-1', false);

      expect(checkIn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: {
              select: expect.objectContaining({ colorSlot: true }),
            },
          },
        }),
      );
    });
  });
});
