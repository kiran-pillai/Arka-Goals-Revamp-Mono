import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Bootstraps the first admin from SEED_ADMIN_EMAIL. The admin then signs in
 * through the normal magic-link flow (a User row already exists, so
 * request-link issues a login token). Idempotent: re-running only ensures the
 * account exists with ADMIN role.
 */
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    console.warn('SEED_ADMIN_EMAIL not set — skipping admin seed.');
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, role: 'ADMIN' },
  });

  console.log(`Seeded admin: ${admin.email} (${admin.role})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
