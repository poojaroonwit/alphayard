import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseSettings(input: unknown): Record<string, any> {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input || '{}')
    } catch {
      return {}
    }
  }
  return input && typeof input === 'object' ? { ...(input as Record<string, any>) } : {}
}

function normalizeOptionalString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : ''
}

function resolveStringSetting(input: unknown, fallback: unknown): string {
  if (typeof input === 'string') return input.trim()
  return typeof fallback === 'string' ? fallback : ''
}

function normalizeSecurityConfig(input: unknown, fallback?: any) {
  const source = input && typeof input === 'object' ? (input as any) : (fallback || {})
  const mfa = source.mfa && typeof source.mfa === 'object' ? source.mfa : {}
  const password = source.password && typeof source.password === 'object' ? source.password : {}
  const session = source.session && typeof source.session === 'object' ? source.session : {}
  return {
    mfa: {
      totp: mfa.totp !== false,
      sms: mfa.sms === true,
      email: mfa.email !== false,
      fido2: mfa.fido2 === true
    },
    password: {
      minLength: Number.isFinite(password.minLength) ? Number(password.minLength) : 8,
      maxAttempts: Number.isFinite(password.maxAttempts) ? Number(password.maxAttempts) : 5,
      expiryDays: Number.isFinite(password.expiryDays) ? Number(password.expiryDays) : 90,
      lockoutMinutes: Number.isFinite(password.lockoutMinutes) ? Number(password.lockoutMinutes) : 30,
      requireUppercase: password.requireUppercase !== false,
      requireLowercase: password.requireLowercase !== false,
      requireNumber: password.requireNumber !== false,
      requireSpecial: password.requireSpecial === true
    },
    session: {
      timeoutMinutes: Number.isFinite(session.timeoutMinutes) ? Number(session.timeoutMinutes) : 60,
      maxConcurrent: Number.isFinite(session.maxConcurrent) ? Number(session.maxConcurrent) : 3
    }
  }
}

function normalizeIdentityConfig(input: unknown, fallback?: any) {
  const source = input && typeof input === 'object' ? (input as any) : (fallback || {})
  const scopes = source.scopes && typeof source.scopes === 'object' ? source.scopes : {}
  const model = typeof source.model === 'string' && source.model.trim() ? source.model.trim() : 'Email-based'
  return {
    model,
    scopes: {
      openid: scopes.openid !== false,
      profile: scopes.profile !== false,
      email: scopes.email !== false,
      phone: scopes.phone === true,
      address: scopes.address === true
    }
  }
}

function normalizeBrandingConfig(input: unknown, fallback?: any) {
  const source = input && typeof input === 'object' ? (input as any) : (fallback || {})
  const announcements = source.announcements && typeof source.announcements === 'object' ? source.announcements : {}
  const social = source.social && typeof source.social === 'object' ? source.social : {}
  const splash = source.splash && typeof source.splash === 'object' ? source.splash : {}
  const updates = source.updates && typeof source.updates === 'object' ? source.updates : {}

  return {
    appName: typeof source.appName === 'string' ? source.appName.trim() : '',
    logoUrl: typeof source.logoUrl === 'string' ? source.logoUrl.trim() : '',
    announcements: {
      enabled: announcements.enabled === true,
      text: typeof announcements.text === 'string' ? announcements.text : '',
      linkUrl: typeof announcements.linkUrl === 'string' ? announcements.linkUrl : '',
      type: ['info', 'success', 'warning', 'error'].includes(announcements.type) ? announcements.type : 'info',
      isDismissible: announcements.isDismissible !== false
    },
    social: {
      supportEmail: typeof social.supportEmail === 'string' ? social.supportEmail : '',
      helpDeskUrl: typeof social.helpDeskUrl === 'string' ? social.helpDeskUrl : '',
      whatsapp: typeof social.whatsapp === 'string' ? social.whatsapp : '',
      instagram: typeof social.instagram === 'string' ? social.instagram : '',
      facebook: typeof social.facebook === 'string' ? social.facebook : '',
      line: typeof social.line === 'string' ? social.line : '',
      twitter: typeof social.twitter === 'string' ? social.twitter : '',
      linkedin: typeof social.linkedin === 'string' ? social.linkedin : '',
      discord: typeof social.discord === 'string' ? social.discord : '',
      appStoreId: typeof social.appStoreId === 'string' ? social.appStoreId : '',
      playStoreId: typeof social.playStoreId === 'string' ? social.playStoreId : ''
    },
    splash: {
      backgroundColor: typeof splash.backgroundColor === 'string' ? splash.backgroundColor : '#FFFFFF',
      spinnerColor: typeof splash.spinnerColor === 'string' ? splash.spinnerColor : '#3B82F6',
      spinnerType: typeof splash.spinnerType === 'string' ? splash.spinnerType : 'circle',
      showAppName: splash.showAppName !== false,
      showLogo: splash.showLogo !== false,
      resizeMode: typeof splash.resizeMode === 'string' ? splash.resizeMode : 'cover',
      logoAnimation: typeof splash.logoAnimation === 'string' ? splash.logoAnimation : 'none'
    },
    updates: {
      minVersion: typeof updates.minVersion === 'string' ? updates.minVersion : '1.0.0',
      storeUrl: typeof updates.storeUrl === 'string' ? updates.storeUrl : '',
      forceUpdate: updates.forceUpdate === true
    }
  }
}

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

async function generateUniqueOAuthClientId(basePrefix: string): Promise<string | null> {
  const prefix = (basePrefix || 'app').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'app'
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${prefix}_${randomBytes(6).toString('hex')}`
    const existing = await prisma.oAuthClient.findFirst({
      where: { clientId: candidate },
      select: { id: true }
    })
    if (!existing) return candidate
  }
  return null
}

const applicationQuery = {
  include: {
    oauthClients: {
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' as const },
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

  const settings = parseSettings(application.settings)
  const rawAuthBehavior = settings.authBehavior || {}
  const platform = settings.platform === 'mobile' ? 'mobile' : 'web'
  const securityConfig = normalizeSecurityConfig(settings.securityConfig)
  const identityConfig = normalizeIdentityConfig(settings.identityConfig)
  const brandingConfig = normalizeBrandingConfig(settings.brandingConfig)

  return {
    id: application.id,
    name: application.name,
    description: application.description || 'No description provided.',
    status: application.isActive ? 'active' : 'inactive',
    platform,
    users: application._count.userApplications,
    createdAt: application.createdAt.toISOString(),
    lastModified: application.updatedAt.toISOString(),
    plan: 'free', // Default fallback since plan isn't on the model directly
    domain:
      typeof settings.domain === 'string' && settings.domain.trim()
        ? settings.domain.trim()
        : (application.slug ? `${application.slug}.appkit.com` : undefined),
    appUrl: normalizeOptionalString(settings.appUrl),
    gaTrackingId: normalizeOptionalString(settings.gaTrackingId),
    metaTitle: normalizeOptionalString(settings.metaTitle),
    metaDescription: normalizeOptionalString(settings.metaDescription),
    faviconUrl: normalizeOptionalString(settings.faviconUrl),
    bundleId: normalizeOptionalString(settings.bundleId),
    deepLinkScheme: normalizeOptionalString(settings.deepLinkScheme),
    securityConfig,
    identityConfig,
    brandingConfig,
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
      platform,
      logoUrl,
      appUrl,
      domain,
      gaTrackingId,
      metaTitle,
      metaDescription,
      faviconUrl,
      bundleId,
      deepLinkScheme,
      securityConfig,
      identityConfig,
      brandingConfig,
      oauthRedirectUris,
      authBehavior,
      oauthClientId,
      rotateClientSecret,
      generateClientId
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

    const currentSettings = parseSettings(app.settings)

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

    const normalizedPlatform =
      platform === 'mobile' || platform === 'web'
        ? platform
        : (currentSettings.platform === 'mobile' ? 'mobile' : 'web')
    const normalizedSecurityConfig = normalizeSecurityConfig(securityConfig, currentSettings.securityConfig)
    const normalizedIdentityConfig = normalizeIdentityConfig(identityConfig, currentSettings.identityConfig)
    const normalizedBrandingConfig = normalizeBrandingConfig(brandingConfig, currentSettings.brandingConfig)

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
          platform: normalizedPlatform,
          authBehavior: normalizedAuthBehavior,
          appUrl: resolveStringSetting(appUrl, currentSettings.appUrl),
          domain: resolveStringSetting(domain, currentSettings.domain),
          gaTrackingId: resolveStringSetting(gaTrackingId, currentSettings.gaTrackingId),
          metaTitle: resolveStringSetting(metaTitle, currentSettings.metaTitle),
          metaDescription: resolveStringSetting(metaDescription, currentSettings.metaDescription),
          faviconUrl: resolveStringSetting(faviconUrl, currentSettings.faviconUrl),
          bundleId: resolveStringSetting(bundleId, currentSettings.bundleId),
          deepLinkScheme: resolveStringSetting(deepLinkScheme, currentSettings.deepLinkScheme),
          securityConfig: normalizedSecurityConfig,
          identityConfig: normalizedIdentityConfig,
          brandingConfig: normalizedBrandingConfig
        }
      }
    })

    let redirectUpdateWarning: string | null = null
    let generatedClientSecret: string | null = null
    let generatedClientId: string | null = null
    let primaryOAuthClient = app.oauthClients[0]
    let generatedClientIdHandledDuringCreate = false

    const normalizedRequestedClientId = typeof oauthClientId === 'string' ? oauthClientId.trim() : null
    if (normalizedRequestedClientId) {
      const matchedClient = app.oauthClients.find(
        (client: any) => client.clientId === normalizedRequestedClientId || client.id === normalizedRequestedClientId
      )
      if (matchedClient) {
        primaryOAuthClient = matchedClient as any
      }
    }
    const requestedRedirectUris = Array.isArray(oauthRedirectUris)
      ? oauthRedirectUris
          .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
      : []
    const shouldEnsureOAuthClient =
      generateClientId === true ||
      rotateClientSecret === true ||
      requestedRedirectUris.length > 0 ||
      typeof oauthClientId === 'string'

    if (!primaryOAuthClient && shouldEnsureOAuthClient) {
      let clientIdForCreate = normalizedRequestedClientId

      if (generateClientId === true || !clientIdForCreate) {
        clientIdForCreate = await generateUniqueOAuthClientId(app.slug || app.name || 'app')
        if (!clientIdForCreate) {
          return NextResponse.json(
            { error: 'Failed to generate a unique Client ID. Please try again.' },
            { status: 500 }
          )
        }
        generatedClientId = clientIdForCreate
        if (generateClientId === true) {
          generatedClientIdHandledDuringCreate = true
        }
      }

      const duplicateClient = await prisma.oAuthClient.findFirst({
        where: { clientId: clientIdForCreate },
        select: { id: true }
      })
      if (duplicateClient) {
        return NextResponse.json(
          { error: 'Client ID is already in use.' },
          { status: 409 }
        )
      }

      let clientSecretHashForCreate: string | null = null
      if (rotateClientSecret === true) {
        generatedClientSecret = `acs_${randomBytes(24).toString('base64url')}`
        clientSecretHashForCreate = await bcrypt.hash(generatedClientSecret, 12)
      }

      primaryOAuthClient = await prisma.oAuthClient.create({
        data: {
          clientId: clientIdForCreate,
          clientType: 'confidential',
          name: `${app.name} OAuth Client`,
          applicationId: app.id,
          redirectUris: requestedRedirectUris,
          ...(clientSecretHashForCreate ? { clientSecretHash: clientSecretHashForCreate } : {})
        },
        select: {
          id: true,
          clientId: true,
          clientType: true,
          clientSecretHash: true,
          redirectUris: true
        }
      }) as any
    }

    if (primaryOAuthClient && generateClientId === true && !generatedClientIdHandledDuringCreate) {
      const nextClientId = await generateUniqueOAuthClientId(app.slug || app.name || 'app')
      if (!nextClientId) {
        return NextResponse.json(
          { error: 'Failed to generate a unique Client ID. Please try again.' },
          { status: 500 }
        )
      }
      await prisma.oAuthClient.update({
        where: { id: primaryOAuthClient.id },
        data: { clientId: nextClientId }
      })
      generatedClientId = nextClientId
    } else if (primaryOAuthClient && typeof oauthClientId === 'string' && generateClientId !== true) {
      const normalizedClientId = oauthClientId.trim()
      if (!normalizedClientId) {
        return NextResponse.json(
          { error: 'Client ID cannot be empty.' },
          { status: 400 }
        )
      }

      const duplicateClient = await prisma.oAuthClient.findFirst({
        where: {
          clientId: normalizedClientId,
          NOT: { id: primaryOAuthClient.id }
        },
        select: { id: true }
      })
      if (duplicateClient) {
        return NextResponse.json(
          { error: 'Client ID is already in use.' },
          { status: 409 }
        )
      }

      if (normalizedClientId !== primaryOAuthClient.clientId) {
        await prisma.oAuthClient.update({
          where: { id: primaryOAuthClient.id },
          data: { clientId: normalizedClientId }
        })
      }
    }

    if (primaryOAuthClient && rotateClientSecret === true && !generatedClientSecret) {
      // One-time reveal secret; only hash is stored in DB.
      generatedClientSecret = `acs_${randomBytes(24).toString('base64url')}`
      const clientSecretHash = await bcrypt.hash(generatedClientSecret, 12)
      await prisma.oAuthClient.update({
        where: { id: primaryOAuthClient.id },
        data: { clientSecretHash }
      })
    }

    if (Array.isArray(oauthRedirectUris)) {
      const sanitizedRedirectUris = Array.from(
        new Set(
          oauthRedirectUris
            .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
        )
      )

      if (primaryOAuthClient) {
        await prisma.oAuthClient.update({
          where: { id: primaryOAuthClient.id },
          data: {
            redirectUris: sanitizedRedirectUris
          }
        })
      } else if (sanitizedRedirectUris.length > 0) {
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
      warning: redirectUpdateWarning,
      generatedClientSecret,
      generatedClientId
    })
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
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

    const app = await prisma.application.findUnique({
      where: { id },
      select: { id: true, name: true }
    })
    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    await prisma.application.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, id: app.id })
  } catch (error: any) {
    console.error('Error deleting application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}
