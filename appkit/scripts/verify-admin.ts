import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  try {
    const adminUser = await prisma.adminUser.findFirst();
    if (adminUser) {
      console.log(`VERIFIED:Found admin user ${adminUser.email}`);
    } else {
      console.log('VERIFIED:No admin user found, but table exists.');
    }
  } catch (e: any) {
    console.log('VERIFIED:FAILED:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
