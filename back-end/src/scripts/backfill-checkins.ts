import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { REPORTING_TIME_ZONE } from '../checkins/reporting-week';
import { planHistoricalCheckIns } from './historical-checkins';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(`Historical check-in backfill

Usage: npm run db:backfill-checkins -- [--dry-run | --apply]

Defaults to --dry-run. Uses DATABASE_URL (or back-end/.env when run there).
Applies the same Saturday–Friday reporting week and Monday 12 PM
America/Chicago deadline as new check-ins, including CST/CDT transitions.
Exactly noon is on time. Original timestamps and existing timing are preserved.

Duplicate user/week records are reported; --apply fails atomically rather than
removing rows or arbitrarily awarding duplicate on-time credit.
Run db:migrate and npm run build before using this command.`);
    return;
  }
  if (
    args.some((arg) => !['--dry-run', '--apply'].includes(arg)) ||
    (args.includes('--apply') && args.includes('--dry-run'))
  ) {
    throw new Error('Use --dry-run or --apply. Run with --help for usage.');
  }
  const apply = args.includes('--apply');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const target = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(target.protocol))
    throw new Error('DATABASE_URL must point to PostgreSQL.');
  // Print the target without usernames, passwords, or query parameters.
  console.log(
    JSON.stringify({
      mode: apply ? 'apply' : 'dry-run',
      host: target.hostname,
      port: target.port || '5432',
      database: decodeURIComponent(target.pathname.slice(1)),
      timeZone: REPORTING_TIME_ZONE,
      deadline: 'Monday 12:00 PM (inclusive)',
    }),
  );
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await prisma.$transaction(
      async (tx) => {
        // Only --apply locks writes, keeping the plan and all updates atomic even
        // when the app is running. Ordinary SELECT readers remain unblocked.
        if (apply)
          await tx.$executeRaw`LOCK TABLE "CheckIn" IN SHARE ROW EXCLUSIVE MODE`;
        const rows = await tx.checkIn.findMany({
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            userId: true,
            createdAt: true,
            reportingWeekStart: true,
            dueAt: true,
          },
        });
        const plan = planHistoricalCheckIns(rows);
        console.log(JSON.stringify(plan.summary, null, 2));
        if (plan.conflicts.length) {
          console.log(JSON.stringify({ conflicts: plan.conflicts }, null, 2));
          throw new Error(
            'Duplicate submissions exist for the same user/week. Resolve these conflicts before applying; no rows were changed.',
          );
        }
        if (!apply) {
          console.log(
            'Dry run complete. No rows changed. Re-run with --apply to record historical timing.',
          );
          return;
        }
        for (const row of plan.updates) {
          await tx.checkIn.update({
            where: { id: row.id },
            data: {
              reportingWeekStart: row.reportingWeekStart,
              dueAt: row.dueAt,
            },
          });
        }
        console.log(
          `Recorded historical timing for ${plan.updates.length} check-ins. Original submission timestamps are unchanged.`,
        );
      },
      { isolationLevel: 'RepeatableRead', maxWait: 10_000, timeout: 120_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Avoid dumping connection options or credentials from driver errors.
  console.error(
    error instanceof Error
      ? error.message
      : 'Historical check-in backfill failed.',
  );
  process.exitCode = 1;
});
