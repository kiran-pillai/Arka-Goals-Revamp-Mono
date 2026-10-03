import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const VALID_TOKEN_HASH =
  'a]fake-hash-for-testing'; // value does not matter — findUnique is mocked

const makeTx = (overrides: Record<string, Record<string, jest.Mock>> = {}) => ({
  magicLinkToken: {
    findUnique: jest.fn(),
    update: jest.fn(),
    ...overrides['magicLinkToken'],
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    ...overrides['user'],
  },
  invite: {
    findFirst: jest.fn(),
    update: jest.fn(),
    ...overrides['invite'],
  },
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = { $transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue({ appBaseUrl: 'http://localhost:3000' }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendLoginLink: jest.fn(),
            sendInviteLink: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('verify — colorSlot assignment on invite redemption', () => {
    const validToken = {
      id: 'tok-1',
      tokenHash: VALID_TOKEN_HASH,
      email: 'new@example.com',
      purpose: 'INVITE',
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
    };

    const pendingInvite = {
      id: 'inv-1',
      email: 'new@example.com',
      role: 'MEMBER',
      firstName: 'New',
      lastName: 'User',
      status: 'PENDING',
    };

    function setupTx(existingSlots: number[]) {
      const tx = makeTx();

      tx.magicLinkToken.findUnique.mockResolvedValue(validToken);
      tx.magicLinkToken.update.mockResolvedValue({});
      tx.user.findUnique.mockResolvedValue(null); // no existing user
      tx.invite.findFirst.mockResolvedValue(pendingInvite);
      tx.invite.update.mockResolvedValue({});

      // Return existing users with their colorSlots for the slot-assignment query
      tx.user.findMany.mockResolvedValue(
        existingSlots.map((slot, i) => ({ id: `u${i}`, colorSlot: slot })),
      );

      const createdUser = {
        id: 'new-user-id',
        email: 'new@example.com',
        role: 'MEMBER',
        firstName: 'New',
        lastName: 'User',
        colorSlot: null, // will be set in the assertion
      };
      tx.user.create.mockResolvedValue(createdUser);
      tx.user.update.mockResolvedValue(createdUser);

      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      return tx;
    }

    it('assigns colorSlot 0 when no other users exist', async () => {
      const tx = setupTx([]);

      await service.verify('raw-token-value');

      expect(tx.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ colorSlot: 0 }),
      });
    });

    it('assigns the lowest gap when slots [0, 1, 3] are taken', async () => {
      const tx = setupTx([0, 1, 3]);

      await service.verify('raw-token-value');

      expect(tx.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ colorSlot: 2 }),
      });
    });

    it('assigns the next sequential slot when no gaps exist', async () => {
      const tx = setupTx([0, 1, 2]);

      await service.verify('raw-token-value');

      expect(tx.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ colorSlot: 3 }),
      });
    });

    it('still includes email, role, and name from the invite', async () => {
      const tx = setupTx([]);

      await service.verify('raw-token-value');

      expect(tx.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@example.com',
          role: 'MEMBER',
          firstName: 'New',
          lastName: 'User',
        }),
      });
    });
  });
});
