import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import fs from 'fs'
import path from 'path'
import { config } from '@/server/config/env'

const hasInlinePem = (value?: string) => Boolean(value && value.trim())

const hasReadableFile = (candidatePath?: string) => {
  if (!candidatePath) return false
  const resolved = path.isAbsolute(candidatePath) ? candidatePath : path.resolve(process.cwd(), candidatePath)
  try {
    return fs.existsSync(resolved) && fs.statSync(resolved).size > 0
  } catch {
    return false
  }
}

export async function GET() {
  console.log('💓 Health check v2026-02-24-01:05 - Railway Debug')
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    const privateKeyCandidates = [
      config.OIDC_PRIVATE_KEY_PATH,
      '/run/secrets/oidc_private_key',
      '/run/secrets/oidc-private-key',
      '/run/secrets/private.key',
      '/app/secrets/oidc/private.key',
      '/app/secrets/private.key',
    ]
    const publicKeyCandidates = [
      config.OIDC_PUBLIC_KEY_PATH,
      '/run/secrets/oidc_public_key',
      '/run/secrets/oidc-public-key',
      '/run/secrets/public.key',
      '/app/secrets/oidc/public.key',
      '/app/secrets/public.key',
    ]

    const privateKeyReady = hasInlinePem(config.OIDC_PRIVATE_KEY) || privateKeyCandidates.some(hasReadableFile)
    const publicKeyReady = hasInlinePem(config.OIDC_PUBLIC_KEY) || publicKeyCandidates.some(hasReadableFile)
    const oidcReady = privateKeyReady && publicKeyReady

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      oidc: {
        ready: oidcReady,
        privateKeyReady,
        publicKeyReady,
      },
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
