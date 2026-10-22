/* Run after build and migrations against an isolated *_test database:
 * CELEBRATIONS_TEST_DATABASE_URL=... node test/celebrations.integration.cjs
 */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('../generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const {
  CelebrationsService,
} = require('../dist/checkins/celebrations.service');
const { CheckInsService } = require('../dist/checkins/checkins.service');
const url = process.env.CELEBRATIONS_TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error('An isolated *_test database is required.');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const createdUsers = [];
const input = {
  completedGoal: true,
  results: 'Result',
  commitments: 'Next',
  wins: 'Win',
  frictions: 'Friction',
  rating: 4,
};
(async () => {
  const service = new CelebrationsService(prisma);
  const checkins = new CheckInsService(prisma);
  async function user(name) {
    const row = await prisma.user.create({
      data: { email: `${randomUUID()}@test.invalid`, firstName: name },
    });
    createdUsers.push(row.id);
    return row;
  }
  async function checkin(owner, timing) {
    return prisma.checkIn.create({
      data: {
        ...input,
        userId: owner.id,
        createdAt: new Date('2026-01-05T17:00:00Z'),
        dueAt:
          timing === 'unknown'
            ? null
            : new Date(
                timing === 'on'
                  ? '2026-01-05T18:00:00Z'
                  : '2026-01-05T16:00:00Z',
              ),
      },
    });
  }
  const giver = await user('Giver');
  const own = await checkin(giver, 'unknown');
  const maya = await user('Maya');
  const kiran = await user('Kiran');
  const taylor = await user('Taylor');
  const alex = await user('Alex');
  const sam = await user('Sam');
  const targets = [];
  for (const [owner, timings] of [
    [maya, ['on', 'on', 'late']],
    [kiran, ['on', 'late', 'unknown']],
    [taylor, ['on', 'late', 'late']],
    [alex, ['on', 'late']],
    [sam, ['on']],
  ]) {
    for (const timing of timings) targets.push(await checkin(owner, timing));
  }
  // All distinct historical targets can receive kudos without a weekly cap.
  const results = await Promise.allSettled(
    targets.slice(0, 3).map((c) => service.give(giver.id, c.id)),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
  const award = results.find((r) => r.status === 'fulfilled').value;
  assert.equal((await service.give(giver.id, award.checkInId)).id, award.id);
  assert.equal(await prisma.kudos.count({ where: { giverId: giver.id } }), 3);
  await assert.rejects(
    service.give(giver.id, own.id),
    (error) => error.getStatus() === 403,
  );
  await assert.rejects(
    service.give(giver.id, randomUUID()),
    (error) => error.getStatus() === 404,
  );
  const recipients = await service.recipients(award.checkInId);
  assert.equal(recipients[0].giver.id, giver.id);
  // Duplicate awards remain prohibited by the database.
  await assert.rejects(
    prisma.kudos.create({
      data: { giverId: giver.id, checkInId: award.checkInId },
    }),
  );
  const board = (await service.leaderboard()).filter((r) =>
    createdUsers.includes(r.id),
  );
  const byId = new Map(board.map((r) => [r.id, r]));
  assert.equal(byId.get(maya.id).onTimeSubmissions, 2); // Multiple kudos did not inflate counts.
  assert.equal(byId.get(kiran.id).rank, byId.get(taylor.id).rank);
  assert.equal(byId.get(kiran.id).tied, true);
  assert.equal(byId.get(alex.id).rank, byId.get(kiran.id).rank + 1);
  assert.equal(byId.get(sam.id).rank, byId.get(alex.id).rank + 1);
  const dashboard = await service.dashboard(kiran.id);
  assert.equal(dashboard.onTimeSubmissions, 1);
  assert.equal(dashboard.totalSubmissions, 3);
  assert.equal(dashboard.unknownTimingSubmissions, 1);
  assert.equal(dashboard.kudosReceived, 0);
  assert.deepEqual(dashboard.recentRecognition, []);
  const fresh = await user('New');
  const first = await checkins.create(fresh.id, {
    ...input,
    dueAt: new Date('2099-01-01'),
    userId: maya.id,
  });
  assert.equal(first.userId, fresh.id);
  assert.notEqual(first.dueAt.getUTCFullYear(), 2099);
  await assert.rejects(
    checkins.create(fresh.id, input),
    (error) => error.getStatus() === 409,
  );
  console.log(
    'PASS: migration, historical targets, unlimited concurrent awards, idempotency, self/missing targets, database constraints, dense ranking, dashboard, and first-submission protection.',
  );
})()
  .finally(async () => {
    // Remove only this run's records, in FK order; never touch unrelated data.
    await prisma.kudos.deleteMany({
      where: {
        OR: [
          { giverId: { in: createdUsers } },
          { checkIn: { userId: { in: createdUsers } } },
        ],
      },
    });
    await prisma.checkIn.deleteMany({
      where: { userId: { in: createdUsers } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUsers } } });
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
