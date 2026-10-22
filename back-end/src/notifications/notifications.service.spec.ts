import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  const notification = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  };
  const prisma = {
    notification,
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
  };
  let service: NotificationsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(
      prisma as unknown as PrismaService,
      { getOrThrow: () => 'test-secret' } as unknown as ConfigService,
    );
    notification.findMany.mockResolvedValue([]);
    notification.count.mockResolvedValue(2);
  });
  it('scopes both list and global unread count to the recipient', async () => {
    const result = await service.list('owner');
    expect(result.unreadCount).toBe(2);
    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientId: 'owner' } }),
    );
    expect(notification.count).toHaveBeenCalledWith({
      where: { recipientId: 'owner', readAt: null },
    });
  });

  it('lists kudos with the giver and check-in target without a comment', async () => {
    const createdAt = new Date('2026-10-22T12:00:00Z');
    const actor = {
      firstName: 'Alex',
      lastName: null,
      email: 'alex@example.com',
    };
    notification.findMany.mockResolvedValue([
      {
        id: 'notification',
        createdAt,
        readAt: null,
        kind: 'KUDOS',
        commentId: null,
        comment: null,
        kudosId: 'kudos',
        kudos: { giver: actor, checkIn: { id: 'checkin', createdAt } },
      },
    ]);
    const result = await service.list('owner');
    expect(result.items).toEqual([
      {
        id: 'notification',
        createdAt,
        readAt: null,
        kind: 'KUDOS',
        commentId: null,
        actor,
        checkInId: 'checkin',
        checkInDate: createdAt,
      },
    ]);
    expect(result.unreadCount).toBe(2);
  });
  it('paginates ties by ID and exposes the next cursor without skipping rows', async () => {
    const createdAt = new Date('2026-10-10T12:00:00Z');
    notification.findFirst.mockResolvedValue({ id: 'cursor', createdAt });
    const makeRow = (id: string) => ({
      id,
      createdAt,
      readAt: null,
      kind: 'MENTION',
      commentId: 'comment',
      comment: {
        user: {
          firstName: 'Author',
          lastName: null,
          email: 'author@example.com',
        },
        checkIn: { id: 'checkin', createdAt },
      },
    });
    notification.findMany.mockResolvedValue([makeRow('b'), makeRow('a')]);
    const result = await service.list('owner', 'cursor', 1);
    expect(result.items.map((item) => item.id)).toEqual(['b']);
    expect(result.nextCursor).toBe('b');
    expect(result.items[0]).toMatchObject({
      kind: 'MENTION',
      commentId: 'comment',
      checkInId: 'checkin',
    });
    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          recipientId: 'owner',
          OR: [
            { createdAt: { lt: createdAt } },
            { createdAt, id: { lt: 'cursor' } },
          ],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 2,
      }),
    );
  });
  it.each([0, -1, 101, 1.5, NaN])(
    'rejects an invalid limit %s',
    async (limit) => {
      await expect(service.list('owner', undefined, limit)).rejects.toThrow(
        BadRequestException,
      );
    },
  );
  it('rejects a cursor from another recipient', async () => {
    notification.findFirst.mockResolvedValue(null);
    await expect(service.list('owner', 'foreign')).rejects.toThrow(
      BadRequestException,
    );
    expect(notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign', recipientId: 'owner' },
    });
  });
  it('rejects another recipient’s notification without updating it', async () => {
    notification.findFirst.mockResolvedValue(null);
    await expect(service.read('owner', 'foreign')).rejects.toThrow(
      NotFoundException,
    );
    expect(notification.updateMany).not.toHaveBeenCalled();
  });
  it('preserves the original read timestamp on repeated acknowledgements', async () => {
    notification.findFirst.mockResolvedValue({ id: 'notification' });
    await service.read('owner', 'notification');
    expect(notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notification', recipientId: 'owner', readAt: null },
      }),
    );
  });
  it('bounds mark-all by the issued snapshot and rejects tampering or another recipient', async () => {
    const { snapshot } = await service.list('owner');
    await service.readAll('owner', snapshot);
    expect(notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          recipientId: 'owner',
          readAt: null,
          createdAt: {
            lte: new Date(snapshot.slice(0, snapshot.lastIndexOf('.'))),
          },
        },
      }),
    );
    await expect(service.readAll('other', snapshot)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.readAll('owner', '2099-01-01T00:00:00.000Z.fake'),
    ).rejects.toThrow(BadRequestException);
  });
});
