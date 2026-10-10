import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;
  const comment = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  };

  const checkIn = { findUnique: jest.fn() };
  const notification = { create: jest.fn() };
  beforeEach(async () => {
    jest.resetAllMocks();
    checkIn.findUnique.mockResolvedValue({ userId: 'owner' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: {
            comment,
            $transaction: (fn: (tx: unknown) => unknown) =>
              fn({ comment, checkIn, notification }),
          },
        },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  describe('addComment', () => {
    it('ties the comment to the caller and check-in', async () => {
      comment.create.mockResolvedValue({ id: 'cmt-1' });

      await service.addComment('user-1', 'checkin-1', 'Great work!');

      expect(comment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          checkInId: 'checkin-1',
          text: 'Great work!',
        },
      });
    });
  });

  it('creates a notification for the owner in the comment transaction', async () => {
    comment.create.mockResolvedValue({ id: 'comment' });
    await service.addComment('author', 'checkin', 'Hello');
    expect(notification.create).toHaveBeenCalledWith({
      data: { recipientId: 'owner', commentId: 'comment' },
    });
  });
  it('propagates notification failures so the transaction rolls back', async () => {
    comment.create.mockResolvedValue({ id: 'comment' });
    notification.create.mockRejectedValue(new Error('write failed'));
    await expect(
      service.addComment('author', 'checkin', 'Hello'),
    ).rejects.toThrow('write failed');
  });
  it('does not notify for self-comments', async () => {
    comment.create.mockResolvedValue({ id: 'comment' });
    await service.addComment('owner', 'checkin', 'Hello');
    expect(notification.create).not.toHaveBeenCalled();
  });
  it('rejects a missing check-in before creating a comment', async () => {
    checkIn.findUnique.mockResolvedValue(null);
    await expect(
      service.addComment('author', 'missing', 'Hello'),
    ).rejects.toThrow(NotFoundException);
    expect(comment.create).not.toHaveBeenCalled();
  });
  describe('listComments', () => {
    it('returns comments for a check-in, newest first, with author info', async () => {
      comment.findMany.mockResolvedValue([]);

      await service.listComments('checkin-1');

      expect(comment.findMany).toHaveBeenCalledWith({
        where: { checkInId: 'checkin-1' },
        orderBy: { createdAt: 'desc' },
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
      });
    });
  });

  describe('deleteComment', () => {
    it("removes the caller's own comment", async () => {
      comment.findUnique.mockResolvedValue({
        id: 'cmt-1',
        userId: 'user-1',
      });
      comment.delete.mockResolvedValue({ id: 'cmt-1' });

      await service.deleteComment('user-1', 'cmt-1');

      expect(comment.delete).toHaveBeenCalledWith({
        where: { id: 'cmt-1' },
      });
    });

    it("throws ForbiddenException when deleting another user's comment", async () => {
      comment.findUnique.mockResolvedValue({
        id: 'cmt-1',
        userId: 'user-2',
      });

      await expect(service.deleteComment('user-1', 'cmt-1')).rejects.toThrow(
        ForbiddenException,
      );

      expect(comment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a non-existent comment', async () => {
      comment.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteComment('user-1', 'cmt-missing'),
      ).rejects.toThrow(NotFoundException);

      expect(comment.delete).not.toHaveBeenCalled();
    });
  });
});
