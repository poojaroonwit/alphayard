import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the root/appkit directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@appkit.com';
  const password = 'admin123';
  const name = 'Admin User';

  console.log(`--- Seeding Admin User: ${email} ---`);

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        name,
        isActive: true,
        isSuperAdmin: true,
      },
      create: {
        email,
        passwordHash: hashedPassword,
        name,
        isActive: true,
        isSuperAdmin: true,
      },
    });

    console.log('Admin user seeded successfully:');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`SuperAdmin: ${admin.isSuperAdmin}`);
    
  } catch (error: any) {
    console.error('Error seeding admin user:', error.message);
    if (error.code) console.error(`Error code: ${error.code}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
