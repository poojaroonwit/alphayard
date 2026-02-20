import { PrismaClient } from '@prisma/client';

async function verifyAll() {
  const prisma = new PrismaClient();
  try {
    const adminCount = await prisma.adminUser.count();
    const auditCount = await prisma.auditLog.count();
    console.log(`COUNTS:admin=${adminCount},audit=${auditCount}`);
    
    // Check schemas again
    const schemas: any = await prisma.$queryRawUnsafe("SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public', 'core', 'admin', 'bondarys')");
    console.log('SCHEMAS:' + schemas.map((s: any) => s.schema_name).join(','));

  } catch (e: any) {
    console.log('ERROR:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAll();
