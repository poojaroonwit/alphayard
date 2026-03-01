import { NextResponse } from 'next/server'
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
  const ready = privateKeyReady && publicKeyReady

  return NextResponse.json(
    {
      status: ready ? 'healthy' : 'unhealthy',
      service: 'appkit-admin',
      check: 'oidc-signing-keys',
      oidc: {
        ready,
        privateKeyReady,
        publicKeyReady,
        privateKeySource: hasInlinePem(config.OIDC_PRIVATE_KEY) ? 'env' : 'path',
        publicKeySource: hasInlinePem(config.OIDC_PUBLIC_KEY) ? 'env' : 'path',
      },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  )
}
