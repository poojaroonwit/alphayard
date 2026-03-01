import { NextRequest, NextResponse } from 'next/server'
import ssoProviderService from '@/server/services/SSOProviderService'
import { prisma } from '@/server/lib/prisma'
import jwt from 'jsonwebtoken'
import { config } from '@/server/config/env'

const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set('appkit_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

const revokeSessionFromToken = async (token: string | undefined) => {
  if (!token) return
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any
    const sessionId = decoded?.sessionId
    if (typeof sessionId === 'string' && sessionId) {
      await prisma.userSession.updateMany({
        where: { id: sessionId, isActive: true },
        data: { isActive: false, revokedAt: new Date(), revokeReason: 'OIDC logout' }
      })
    }
  } catch {
    // Best effort only; logout should continue even if token/session cannot be parsed.
  }
}

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const parseRedirectUris = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

const hasTrustedOriginMatch = (candidate: string, allowedRedirects: string[]) => {
  let candidateUrl: URL
  try {
    candidateUrl = new URL(candidate)
  } catch {
    return false
  }

  for (const allowed of allowedRedirects) {
    try {
      const allowedUrl = new URL(allowed)
      if (allowedUrl.origin === candidateUrl.origin) return true
    } catch {
      continue
    }
  }
  return false
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const clientId = searchParams.get('client_id')?.trim()
  const postLogoutRedirectUri = searchParams.get('post_logout_redirect_uri')?.trim()
  const state = searchParams.get('state')?.trim()
  const cookieToken = request.cookies.get('appkit_token')?.value
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined

  // Validate redirect URI against registered client redirect URIs.
  // This prevents open redirects while supporting OIDC logout callbacks.
  if (postLogoutRedirectUri) {
    if (!clientId) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id is required when post_logout_redirect_uri is provided' },
        { status: 400 }
      )
    }

    try {
      await ssoProviderService.validateClient(clientId, postLogoutRedirectUri)
    } catch (error: any) {
      // Fallback for common RP logout UX:
      // allow post_logout_redirect_uri on the same origin as any registered redirect URI.
      const client = await prisma.oAuthClient.findFirst({
        where: {
          isActive: true,
          OR: [
            { clientId },
            ...(isUuid(clientId) ? [{ id: clientId }, { applicationId: clientId }] : [])
          ]
        },
        select: { redirectUris: true }
      })

      const registeredRedirects = parseRedirectUris(client?.redirectUris)
      if (!hasTrustedOriginMatch(postLogoutRedirectUri, registeredRedirects)) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: error?.message || 'Invalid post_logout_redirect_uri' },
          { status: 400 }
        )
      }
    }
  }

  const redirectTarget = postLogoutRedirectUri || `${origin}/login`
  await revokeSessionFromToken(cookieToken || bearerToken)
  const response = NextResponse.redirect(redirectTarget)
  clearSessionCookie(response)

  if (state) {
    const url = new URL(redirectTarget)
    url.searchParams.set('state', state)
    const stateResponse = NextResponse.redirect(url)
    clearSessionCookie(stateResponse)
    return stateResponse
  }

  return response
}

