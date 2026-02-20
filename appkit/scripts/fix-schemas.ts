import { PrismaClient } from '@prisma/client';

async function fix() {
  const prisma = new PrismaClient();
  try {
    console.log('Ensuring schemas exist...');
    await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "core"');
    await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "admin"');
    await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "bondarys"');
    console.log('Schemas checked/created.');

    console.log('Running prisma db push...');
    // We'll run this separately as a command.

  } catch (error: any) {
    console.error('Failed to create schemas:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
