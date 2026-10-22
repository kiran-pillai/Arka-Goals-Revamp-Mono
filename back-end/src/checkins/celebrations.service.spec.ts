import { CelebrationsService } from './celebrations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Unlimited kudos', () => {
  const tx = {
    checkIn: { findUnique: jest.fn() },
    kudos: { upsert: jest.fn() },
    notification: { upsert: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
  const service = new CelebrationsService(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.clearAllMocks();
    tx.checkIn.findUnique.mockResolvedValue({ userId: 'other' });
    tx.kudos.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ id: create.checkInId, ...create }),
    );
  });
  it('allows more than two awards to distinct historical check-ins', async () => {
    const awards = await Promise.all(
      ['old1', 'old2', 'old3', 'old4'].map((id) => service.give('giver', id)),
    );
    expect(awards).toHaveLength(4);
    expect(tx.kudos.upsert).toHaveBeenCalledTimes(4);
    expect(tx.kudos.upsert).toHaveBeenCalledWith({
      where: { giverId_checkInId: { giverId: 'giver', checkInId: 'old4' } },
      create: { giverId: 'giver', checkInId: 'old4' },
      update: {},
    });
  });
  it('notifies the owner once per award without resetting read status on retries', async () => {
    await service.give('giver', 'checkin');
    await service.give('giver', 'checkin');
    expect(tx.notification.upsert).toHaveBeenCalledTimes(2);
    expect(tx.notification.upsert).toHaveBeenNthCalledWith(1, {
      where: { kudosId: 'checkin' },
      create: { recipientId: 'other', kudosId: 'checkin', kind: 'KUDOS' },
      update: {},
    });
    expect(tx.notification.upsert.mock.calls[1][0]).toEqual(
      tx.notification.upsert.mock.calls[0][0],
    );
  });
  it('still rejects self-awards', async () => {
    tx.checkIn.findUnique.mockResolvedValue({ userId: 'giver' });
    await expect(service.give('giver', 'own')).rejects.toThrow('own check-in');
    expect(tx.kudos.upsert).not.toHaveBeenCalled();
    expect(tx.notification.upsert).not.toHaveBeenCalled();
  });
  it('still rejects missing check-ins', async () => {
    tx.checkIn.findUnique.mockResolvedValue(null);
    await expect(service.give('giver', 'missing')).rejects.toThrow('not found');
  });
});
