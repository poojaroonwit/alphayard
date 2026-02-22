
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function check() {
  console.log('--- ADMIN USER CHECK ---');
  const admins = await prisma.adminUser.findMany({
    include: { role: true }
  });
  
  console.log(`Found ${admins.length} admin users.`);
  
  for (const admin of admins) {
    console.log(`- Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Is Active: ${admin.isActive}`);
    console.log(`  Is SuperAdmin: ${admin.isSuperAdmin}`);
    console.log(`  Role: ${admin.role?.name || 'N/A'}`);
    
    // Check password 'admin123'
    const isMatch = await bcrypt.compare('admin123', admin.passwordHash);
    console.log(`  Password 'admin123' match: ${isMatch}`);
  }
}

check()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
