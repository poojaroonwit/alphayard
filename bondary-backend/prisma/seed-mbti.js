const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Available models in prisma:', Object.keys(prisma).filter(k => !k.startsWith('_')));
  
  const questions = [
    { text: "You enjoy vibrant social events with lots of people.", dimension: "E", weight: 1 },
    { text: "You often spend time exploring unrealistic yet intriguing ideas.", dimension: "N", weight: 1 },
    { text: "Your travel plans are usually well thought out.", dimension: "J", weight: 1 },
    { text: "You become touched by the stories of others.", dimension: "F", weight: 1 },
    { text: "You prefer to have a detailed daily routine.", dimension: "J", weight: 1 },
    { text: "You often rely on your financial stability than your intuition.", dimension: "S", weight: 1 },
    { text: "You are more inclined to follow your head than your heart.", dimension: "T", weight: 1 },
    { text: "You prefer to work alone in a quiet environment.", dimension: "I", weight: 1 },
  ];

  // Try to find the right property name
  const modelName = 'mBTIQuestion'; // or 'mbtiQuestion'
  const targetProperty = prisma[modelName] ? modelName : 'mbtiQuestion';

  console.log(`Using target property: ${targetProperty}`);
  
  if (!prisma[targetProperty]) {
      throw new Error(`Model not found in Prisma Client. Available: ${Object.keys(prisma).join(', ')}`);
  }

  for (const q of questions) {
    await prisma[targetProperty].create({
      data: q,
    });
  }
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
