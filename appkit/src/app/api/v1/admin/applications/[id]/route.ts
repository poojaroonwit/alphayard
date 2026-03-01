import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidPostAuthRedirect(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (trimmed.startsWith('/')) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const applicationQuery = {
  include: {
    oauthClients: {
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' as const },
      take: 1,
      select: {
        id: true,
        clientId: true,
        clientType: true,
        clientSecretHash: true,
        redirectUris: true
      }
    },
    _count: {
      select: { userApplications: true }
    }
  }
}

function formatApplication(application: any) {
  const primaryOAuthClient = application.oauthClients[0]
  const oauthRedirectUrisRaw = primaryOAuthClient?.redirectUris
  const oauthRedirectUris =
    Array.isArray(oauthRedirectUrisRaw)
      ? oauthRedirectUrisRaw.filter((item: unknown): item is string => typeof item === 'string')
      : []

  const settings =
    typeof application.settings === 'string'
      ? JSON.parse(application.settings || '{}')
      : (application.settings || {})
  const rawAuthBehavior = settings.authBehavior || {}

  return {
    id: application.id,
    name: application.name,
    description: application.description || 'No description provided.',
    status: application.isActive ? 'active' : 'inactive',
    users: application._count.userApplications,
    createdAt: application.createdAt.toISOString(),
    lastModified: application.updatedAt.toISOString(),
    plan: 'free', // Default fallback since plan isn't on the model directly
    domain: application.slug ? `${application.slug}.appkit.com` : undefined, // Fallback slug
    oauthClientId: primaryOAuthClient?.clientId || null,
    oauthClientType: primaryOAuthClient?.clientType || null,
    oauthClientSecretConfigured: Boolean(primaryOAuthClient?.clientSecretHash),
    oauthRedirectUris,
    oauthPrimaryRedirectUri: oauthRedirectUris[0] || null,
    authBehavior: {
      signupEnabled: rawAuthBehavior.signupEnabled !== false,
      emailVerificationRequired: rawAuthBehavior.emailVerificationRequired === true,
      inviteOnly: rawAuthBehavior.inviteOnly === true,
      allowedEmailDomains: Array.isArray(rawAuthBehavior.allowedEmailDomains)
        ? rawAuthBehavior.allowedEmailDomains.filter((item: unknown): item is string => typeof item === 'string')
        : [],
      postLoginRedirect: typeof rawAuthBehavior.postLoginRedirect === 'string' ? rawAuthBehavior.postLoginRedirect : '',
      postSignupRedirect: typeof rawAuthBehavior.postSignupRedirect === 'string' ? rawAuthBehavior.postSignupRedirect : ''
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 }
      )
    }
    
    // Fetch the specific application
    const application = await prisma.application.findUnique({
      where: { id },
      ...applicationQuery
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const formattedApp = formatApplication(application)

    return NextResponse.json({ application: formattedApp })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      status,
      logoUrl,
      oauthRedirectUris,
      authBehavior
    } = body || {}

    const app = await prisma.application.findUnique({
      where: { id },
      ...applicationQuery
    })
    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const isActive =
      status === 'inactive'
        ? false
        : status === 'active' || status === 'development'
          ? true
          : app.isActive

    const currentSettings =
      typeof app.settings === 'string'
        ? JSON.parse(app.settings || '{}')
        : (app.settings || {})

    const normalizedAuthBehavior = authBehavior && typeof authBehavior === 'object'
      ? {
          signupEnabled: authBehavior.signupEnabled !== false,
          emailVerificationRequired: authBehavior.emailVerificationRequired === true,
          inviteOnly: authBehavior.inviteOnly === true,
          allowedEmailDomains: Array.isArray(authBehavior.allowedEmailDomains)
            ? Array.from(new Set(
                authBehavior.allowedEmailDomains
                  .map((item: unknown) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
                  .filter(Boolean)
              ))
            : [],
          postLoginRedirect: typeof authBehavior.postLoginRedirect === 'string' ? authBehavior.postLoginRedirect.trim() : '',
          postSignupRedirect: typeof authBehavior.postSignupRedirect === 'string' ? authBehavior.postSignupRedirect.trim() : ''
        }
      : (currentSettings.authBehavior || {
          signupEnabled: true,
          emailVerificationRequired: false,
          inviteOnly: false,
          allowedEmailDomains: [],
          postLoginRedirect: '',
          postSignupRedirect: ''
        })

    if (
      !isValidPostAuthRedirect(normalizedAuthBehavior.postLoginRedirect) ||
      !isValidPostAuthRedirect(normalizedAuthBehavior.postSignupRedirect)
    ) {
      return NextResponse.json(
        { error: 'Invalid post-auth redirect. Use relative path (/) or absolute http(s) URL.' },
        { status: 400 }
      )
    }

    await prisma.application.update({
      where: { id },
      data: {
        name: typeof name === 'string' && name.trim() ? name.trim() : app.name,
        description: typeof description === 'string' ? description.trim() : app.description,
        logoUrl: typeof logoUrl === 'string' ? logoUrl.trim() : app.logoUrl,
        isActive,
        settings: {
          ...currentSettings,
          authBehavior: normalizedAuthBehavior
        }
      }
    })

    let redirectUpdateWarning: string | null = null
    if (Array.isArray(oauthRedirectUris)) {
      const sanitizedRedirectUris = Array.from(
        new Set(
          oauthRedirectUris
            .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
        )
      )

      const primaryOAuthClient = app.oauthClients[0]
      if (primaryOAuthClient) {
        await prisma.oAuthClient.update({
          where: { id: primaryOAuthClient.id },
          data: {
            redirectUris: sanitizedRedirectUris
          }
        })
      } else {
        redirectUpdateWarning = 'No active OAuth client found for this application.'
      }
    }

    const updatedApp = await prisma.application.findUnique({
      where: { id },
      ...applicationQuery
    })
    if (!updatedApp) {
      return NextResponse.json(
        { error: 'Application not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      application: formatApplication(updatedApp),
      warning: redirectUpdateWarning
    })
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}
