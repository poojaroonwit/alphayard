import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

export async function GET() {
  console.log('💓 Health check v2026-02-24-01:05 - Railway Debug')
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2026-02-24-01:05',
      service: 'appkit-admin',
      environment: process.env.NODE_ENV || 'unknown'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      version: '2026-02-24-01:05',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
