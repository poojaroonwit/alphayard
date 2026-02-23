// Prisma Seed Data
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')
  
  // Debug: Check database schema
  console.log('🔍 Seed script - Database schema debug...')
  try {
    const schemaCheck = await prisma.$queryRaw`SELECT current_schema()`
    console.log('📊 Seed - Current schema:', schemaCheck)
    
    const userTableCheck = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'`
    console.log('👤 Seed - User table exists (users):', userTableCheck)
    
    // Also check for any user-related tables
    const userRelatedTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%'`
    console.log('👥 Seed - User-related tables:', userRelatedTables)
    
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true, isActive: true },
      take: 5
    })
    console.log('👥 Seed - Existing users:', existingUsers.length)
    existingUsers.forEach(user => {
      console.log(`  - ${user.email} (active: ${user.isActive})`)
    })
  } catch (schemaError) {
    console.error('❌ Seed schema debug failed:', schemaError)
  }

  // Create default application
  const app = await prisma.application.upsert({
    where: { slug: 'appkit-admin' },
    update: {
      name: 'AppKit Admin Console',
      description: 'Admin console for AppKit applications',
      isActive: true
    },
    create: {
      name: 'AppKit Admin Console',
      slug: 'appkit-admin',
      description: 'Admin console for AppKit applications',
      isActive: true,
      branding: {
        adminAppName: 'AppKit Admin',
        logoUrl: null,
        iconUrl: null
      },
      settings: {
        theme: 'system',
        language: 'en'
      }
    }
  })

  console.log('Created/updated application:', app.name)

  // Create admin user
  const adminPassword = 'admin123' // Change this in production!
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  console.log('🔍 Checking for existing admin user...')
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@appkit.com' },
    select: { id: true, email: true, isActive: true, isVerified: true }
  })
  
  if (existingUser) {
    console.log('✅ Admin user already exists:', existingUser.email)
  } else {
    console.log('❌ Admin user not found, will create new one')
  }

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@appkit.com' },
    update: {
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      isActive: true,
      isVerified: true
    },
    create: {
      email: 'admin@appkit.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      isActive: true,
      isVerified: true,
      userType: 'admin'
    }
  })

  console.log('Created/updated admin user:', adminUser.email)
  console.log('👤 Admin user details:', {
    id: adminUser.id,
    email: adminUser.email,
    isActive: adminUser.isActive,
    isVerified: adminUser.isVerified,
    userType: adminUser.userType
  })

  // Link admin user to application
  await prisma.userApplication.upsert({
    where: {
      userId_applicationId: {
        userId: adminUser.id,
        applicationId: app.id
      }
    },
    update: {
      role: 'admin',
      status: 'active'
    },
    create: {
      userId: adminUser.id,
      applicationId: app.id,
      role: 'admin',
      status: 'active'
    }
  })

  console.log('Linked admin user to application')

  // Create admin user settings
  await prisma.userSettings.upsert({
    where: {
      userId_applicationId: {
        userId: adminUser.id,
        applicationId: app.id
      }
    },
    update: {
      languageCode: 'en',
      timezone: 'UTC',
      theme: 'system'
    },
    create: {
      userId: adminUser.id,
      applicationId: app.id,
      languageCode: 'en',
      timezone: 'UTC',
      theme: 'system'
    }
  })

  console.log('Created admin user settings')

  // Create default security policy
  const existingPolicy = await prisma.securityPolicy.findFirst({
    where: {
      applicationId: app.id,
      policyName: 'default'
    }
  })

  const securityPolicy = existingPolicy || await prisma.securityPolicy.create({
    data: {
      applicationId: app.id,
      policyName: 'default',
      policyType: 'default',
      isActive: true,
      priority: 0,
      passwordMinLength: 8,
      passwordMaxLength: 128,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: true,
      passwordHistoryCount: 5,
      passwordExpiryDays: 90,
      lockoutEnabled: true,
      lockoutThreshold: 5,
      lockoutDurationMinutes: 30,
      lockoutResetAfterMinutes: 30,
      sessionTimeoutMinutes: 1440,
      sessionMaxConcurrent: 5,
      mfaRequired: false,
      mfaRequiredForRoles: [],
      mfaRememberDeviceDays: 30,
      mfaAllowedTypes: ['totp'],
      ipWhitelist: [],
      ipBlacklist: [],
      ipGeoWhitelist: [],
      ipGeoBlacklist: []
    }
  })

  console.log('Created default security policy')

  // Create default admin group
  await prisma.userGroup.upsert({
    where: { slug: 'administrators' },
    update: {
      applicationId: app.id,
      name: 'Administrators',
      description: 'System administrators with full access',
      isSystem: true,
      isDefault: false
    },
    create: {
      applicationId: app.id,
      name: 'Administrators',
      slug: 'administrators',
      description: 'System administrators with full access',
      isSystem: true,
      isDefault: false,
      permissions: ['*'], // Full permissions
      color: '#ef4444',
      icon: 'shield'
    }
  })

  console.log('Created administrators group')

  // Final verification - check if admin user actually exists
  console.log('🔍 Final verification - checking admin user exists...')
  const finalCheck = await prisma.user.findUnique({
    where: { email: 'admin@appkit.com' },
    select: {
      id: true,
      email: true,
      isActive: true,
      isVerified: true,
      userType: true,
      passwordHash: true
    }
  })
  
  if (finalCheck) {
    console.log('✅ SUCCESS: Admin user verified in database:', {
      id: finalCheck.id,
      email: finalCheck.email,
      isActive: finalCheck.isActive,
      isVerified: finalCheck.isVerified,
      userType: finalCheck.userType,
      hasPassword: !!finalCheck.passwordHash
    })
  } else {
    console.log('❌ ERROR: Admin user NOT found in database after seeding!')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
