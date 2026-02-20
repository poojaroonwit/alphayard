import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    const schemas: any = await prisma.$queryRawUnsafe(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('public', 'admin', 'core', 'bondarys')
    `);
    console.log('SCHEMAS_FOUND:' + schemas.map((s: any) => s.schema_name).sort().join(','));

    const tables: any = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'admin'
    `);
    console.log('ADMIN_TABLES:' + tables.map((t: any) => t.table_name).sort().join(','));
  } catch (e: any) {
    console.log('ERROR:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
