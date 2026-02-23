// Manual admin user creation endpoint
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  console.log('🔧 Manual admin user creation...')
  
  try {
    // First, delete any existing admin user
    await prisma.user.deleteMany({
      where: { email: 'admin@appkit.com' }
    })
    console.log('🗑️ Cleared existing admin user')
    
    // Create new admin user
    const adminPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@appkit.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: hashedPassword,
        isActive: true,
        isVerified: true,
        userType: 'admin'
      }
    })
    
    console.log('✅ Created admin user:', adminUser.email)
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        isActive: adminUser.isActive,
        isVerified: adminUser.isVerified
      }
    })
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isVerified: true,
        userType: true
      },
      take: 10
    })
    
    return NextResponse.json({
      users: users,
      count: users.length
    })
  } catch (error) {
    console.error('❌ Failed to list users:', error)
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    )
  }
}
