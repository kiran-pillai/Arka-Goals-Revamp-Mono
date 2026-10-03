import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

describe('InvitesService', () => {
  let service: InvitesService;
  let prisma: { invite: { findFirst: jest.Mock; create: jest.Mock } };
  let usersService: { findByEmail: jest.Mock };
  let authService: { sendInviteEmail: jest.Mock };

  beforeEach(async () => {
    prisma = {
      invite: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };

    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };

    authService = {
      sendInviteEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create() with firstName and lastName', () => {
    const invitedById = 'user-123';

    it('should save firstName and lastName on the invite record', async () => {
      const dto = {
        email: 'kiran@example.com',
        role: 'MEMBER' as const,
        firstName: 'Kiran',
        lastName: 'Pillai',
      };

      const createdInvite = {
        id: 'invite-1',
        email: 'kiran@example.com',
        role: 'MEMBER',
        firstName: 'Kiran',
        lastName: 'Pillai',
        status: 'PENDING',
        invitedById,
        createdAt: new Date(),
      };

      prisma.invite.create.mockResolvedValue(createdInvite);

      const result = await service.create(dto, invitedById);

      // Verify prisma.invite.create was called with firstName and lastName in the data
      expect(prisma.invite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'kiran@example.com',
          role: 'MEMBER',
          firstName: 'Kiran',
          lastName: 'Pillai',
          invitedById,
        }),
      });

      expect(result.firstName).toBe('Kiran');
      expect(result.lastName).toBe('Pillai');
    });

    it('should pass firstName and lastName through to sendInviteEmail', async () => {
      const dto = {
        email: 'kiran@example.com',
        role: 'MEMBER' as const,
        firstName: 'Kiran',
        lastName: 'Pillai',
      };

      prisma.invite.create.mockResolvedValue({
        id: 'invite-1',
        email: 'kiran@example.com',
        role: 'MEMBER',
        firstName: 'Kiran',
        lastName: 'Pillai',
        status: 'PENDING',
        invitedById,
        createdAt: new Date(),
      });

      await service.create(dto, invitedById);

      // After the feature is implemented, sendInviteEmail should receive the name fields
      // so the email can address the invitee by name
      expect(authService.sendInviteEmail).toHaveBeenCalledWith(
        'kiran@example.com',
        'Kiran',
        'Pillai',
      );
    });

    it('should handle missing name fields gracefully (backward compat)', async () => {
      const dto = {
        email: 'noname@example.com',
        role: 'MEMBER' as const,
      };

      prisma.invite.create.mockResolvedValue({
        id: 'invite-2',
        email: 'noname@example.com',
        role: 'MEMBER',
        status: 'PENDING',
        invitedById,
        createdAt: new Date(),
      });

      const result = await service.create(dto, invitedById);

      // Should still work without name fields
      expect(prisma.invite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'noname@example.com',
          role: 'MEMBER',
          invitedById,
        }),
      });

      expect(result).toBeDefined();
    });
  });
});
