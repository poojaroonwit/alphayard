// Prisma Seed Data
import { prisma } from '../src/server/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Start seeding...')
  
  // Debug: Check database schema
  console.log('🔍 Seed script - Database schema debug (PUBLIC ONLY)...')
  try {
    const schemaCheck = await prisma.$queryRaw`SELECT current_schema()`
    console.log('📊 Seed - Current schema:', schemaCheck)
    
    // Check users table in public schema only
    const userTableCheck = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'`
    console.log('👤 Seed - User table in public schema:', userTableCheck)
    
    // Check all tables in public schema
    const publicTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    console.log('� Seed - All tables in public schema:', publicTables)
    
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

  // ── Email Templates ──────────────────────────────────────────────────────
  // Seed the platform-level OTP verification template (applicationId = null).
  // OtpService looks this up by slug 'otp-verification' at runtime.
  const existingOtpTpl = await prisma.emailTemplate.findFirst({
    where: { slug: 'otp-verification', applicationId: null },
  })

  if (!existingOtpTpl) {
    await prisma.emailTemplate.create({
      data: {
        name: 'OTP Verification',
        slug: 'otp-verification',
        subject: 'Your verification code',
        htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Your verification code</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Use the code below to sign in. It expires in {{expiry}}.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;">
      <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1d4ed8;">{{otp}}</span>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">If you did not request this code, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
        textContent: 'Your verification code is: {{otp}}. It expires in {{expiry}}.',
        variables: ['otp', 'expiry'],
        isActive: true,
        applicationId: null,
      },
    })
    console.log('✅ Created otp-verification email template')
  } else {
    console.log('✅ otp-verification email template already exists')
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
