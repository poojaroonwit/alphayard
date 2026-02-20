import { PrismaClient } from '@prisma/client';

async function diagnose() {
  const prisma = new PrismaClient();
  try {
    console.log('--- Comprehensive Database Diagnostics ---');
    
    // 1. Current Database
    const currentDb = await prisma.$queryRawUnsafe('SELECT current_database()');
    console.log('Current Database:', JSON.stringify(currentDb, null, 2));

    // 2. All Schemas
    const allSchemas = await prisma.$queryRawUnsafe(`
      SELECT schema_name 
      FROM information_schema.schemata
    `);
    console.log('All Schemas in DB:', JSON.stringify(allSchemas, null, 2));

    // 3. Search Path
    const searchPath = await prisma.$queryRawUnsafe('SHOW search_path');
    console.log('Search Path:', JSON.stringify(searchPath, null, 2));

    // 4. Check for admin_users in ANY schema
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'admin_users'
    `);
    console.log('Found "admin_users" in schemas:', JSON.stringify(tableCheck, null, 2));

    // 5. Try to access AdminUser model
    try {
      const count = await prisma.adminUser.count();
      console.log('Prisma adminUser.count() success:', count);
    } catch (e: any) {
      console.log('Prisma adminUser.count() FAILED:', e.message);
    }

  } catch (error: any) {
    console.error('Diagnostic failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
