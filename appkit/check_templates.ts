import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, slug: true, name: true, applicationId: true }
  })
  console.log(JSON.stringify(templates, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
