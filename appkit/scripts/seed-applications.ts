import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the root/appkit directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Applications ---');

  try {
    const applications = [
      {
        id: 'appkit-demo',
        name: 'AppKit Demo',
        slug: 'appkit',
        description: 'Main AppKit Application',
        branding: {
          logo: '',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          theme: 'modern'
        },
        settings: {
          google_analytics_id: '',
          features: {
            cms: true,
            users: true,
            analytics: true
          }
        },
        isActive: true
      },
      {
        id: 'bondarys-app',
        name: 'Bondarys App',
        slug: 'bondarys',
        description: 'Legacy Bondarys Application',
        branding: {
          logo: '',
          primaryColor: '#8B5CF6',
          secondaryColor: '#F59E0B',
          theme: 'classic'
        },
        settings: {
          google_analytics_id: '',
          features: {
            cms: true,
            users: true,
            analytics: false
          }
        },
        isActive: true
      },
      {
        id: 'mobile-app',
        name: 'Mobile App',
        slug: 'mobile',
        description: 'Mobile Application Instance',
        branding: {
          logo: '',
          primaryColor: '#EF4444',
          secondaryColor: '#3B82F6',
          theme: 'mobile'
        },
        settings: {
          google_analytics_id: 'G-XXXXXXXXXX',
          features: {
            cms: false,
            users: true,
            analytics: true
          }
        },
        isActive: true
      }
    ];

    for (const app of applications) {
      const existingApp = await prisma.application.findUnique({
        where: { id: app.id }
      });

      if (existingApp) {
        console.log(`Application ${app.name} already exists, updating...`);
        await prisma.application.update({
          where: { id: app.id },
          data: app
        });
      } else {
        console.log(`Creating application: ${app.name}`);
        await prisma.application.create({
          data: app
        });
      }
    }

    console.log('Applications seeded successfully!');
    
    // List all applications
    const allApps = await prisma.application.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    console.log('\nAll Active Applications:');
    allApps.forEach(app => {
      console.log(`- ${app.name} (${app.slug}) - ${app.id}`);
    });
    
  } catch (error: any) {
    console.error('Error seeding applications:', error.message);
    if (error.code) console.error(`Error code: ${error.code}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
