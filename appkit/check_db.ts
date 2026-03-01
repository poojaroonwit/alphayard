import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Applications ---');
  const apps = await prisma.application.findMany();
  apps.forEach(a => console.log(`${a.id} | ${a.name} | ${a.slug}`));

  console.log('\n--- OAuth Clients ---');
  const clients = await prisma.oAuthClient.findMany();
  clients.forEach(c => console.log(`${c.clientId} | ${c.name} | ${c.applicationId}`));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
