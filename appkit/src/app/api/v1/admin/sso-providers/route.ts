import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('[SSO Providers API] Fetching enabled providers...');
    // SSO providers list is public — needed by the login page to show SSO buttons
    // Fetch OAuth providers from the database (CORE schema table)
    const providers = await prisma.oAuthProvider.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`[SSO Providers API] Found ${providers?.length || 0} enabled providers`);

    return NextResponse.json({
      success: true,
      data: { providers: providers || [] },
      message: 'SSO providers retrieved successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[SSO Providers API] Local SSO providers fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch SSO providers',
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}
