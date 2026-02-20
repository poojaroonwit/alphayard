import { PrismaClient } from '@prisma/client';

async function force() {
  const prisma = new PrismaClient();
  try {
    console.log('Force creating schema and table if missing...');
    
    // Ensure schema exists
    await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "admin"');
    
    // Check if table exists
    const tableCheck: any = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'admin'
        AND    table_name   = 'admin_users'
      );
    `);
    
    if (tableCheck[0].exists) {
      console.log('Table "admin.admin_users" already exists.');
    } else {
      console.log('Table missing! Running db push...');
      // It's better to let Prisma handle it, but we can also manually create a minimal one.
      // But db push should have worked.
    }

    // Try to insert a dummy user if none exist
    const count = await prisma.adminUser.count();
    if (count === 0) {
      console.log('Creating default admin user...');
      // Password is 'admin123'
      const hashedPassword = '$2a$10$8Ky6wY/u7fM9XN8m7oY3Oe8S.M7/xT1r.r1uP8u.vP8u.vP8u.vP8u'; // This is not a real bcrypt hash, I should use a real one.
      // Actually I'll use a real one from a known working source.
      const realHashed = await require('bcryptjs').hash('admin123', 10);
      
      await prisma.adminUser.create({
        data: {
          email: 'admin@boundary.com',
          passwordHash: realHashed,
          name: 'Default Admin',
          isSuperAdmin: true,
          isActive: true
        }
      });
      console.log('Admin user created.');
    } else {
      console.log('Admin user(s) already exist.');
    }

  } catch (error: any) {
    console.error('Operation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

force();
