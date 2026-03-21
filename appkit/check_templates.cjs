const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, slug: true, name: true, applicationId: true }
    })
    console.log(JSON.stringify(templates, null, 2))
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
