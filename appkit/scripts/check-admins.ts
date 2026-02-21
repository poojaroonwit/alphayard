import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        passwordHash: true
      }
    });

    console.log('--- ADMIN USERS ---');
    if (admins.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      admins.forEach(admin => {
        console.log(`Email: ${admin.email}`);
        console.log(`Name: ${admin.name}`);
        console.log(`Active: ${admin.isActive}`);
        console.log(`SuperAdmin: ${admin.isSuperAdmin}`);
        console.log(`Hash starts with: ${admin.passwordHash.substring(0, 10)}...`);
        console.log('---');
      });
    }
  } catch (error: any) {
    console.error('Error fetching admins:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
