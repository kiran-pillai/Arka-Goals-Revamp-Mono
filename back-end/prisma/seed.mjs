import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const email = process.env.SEED_ADMIN_EMAIL;
if (!email) {
  console.warn('SEED_ADMIN_EMAIL not set — skipping admin seed.');
  process.exit(0);
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
