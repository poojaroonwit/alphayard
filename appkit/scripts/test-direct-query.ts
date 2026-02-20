import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  try {
    console.log('Testing direct query to admin.admin_users...');
    const result = await prisma.$queryRawUnsafe('SELECT * FROM "admin"."admin_users" LIMIT 1');
    console.log('Query success:', JSON.stringify(result));
  } catch (e: any) {
    console.error('Query FAILED:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
