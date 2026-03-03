import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

type SystemSection = 'general' | 'security' | 'api-keys' | 'webhooks' | 'legal'
  | 'sso'
  | 'smtp'
  | '2fa'
  | 'mfa'
  | 'logs'

const SECTION_KEYS: Record<SystemSection, string> = {
  general: 'system.general',
  security: 'system.security',
  'api-keys': 'system.api-keys',
  webhooks: 'system.webhooks',
  legal: 'system.legal',
  sso: 'system.sso',
  smtp: 'system.smtp',
  '2fa': 'system.mfa',
  mfa: 'system.mfa',
  logs: 'system.logs',
}

const DEFAULT_CONFIG: Record<SystemSection, any> = {
  general: {
    platformName: 'AppKit',
    supportEmail: 'support@appkit.io',
    timezone: 'UTC',
    language: 'English',
    appkitLogoUrl: '',
    loginBackground: {
      mode: 'solid',
      solid: '#FFFFFF',
    },
  },
  security: {
    enforceMfa: true,
    ipWhitelistEnabled: false,
    auditLogging: true,
    sessionTimeoutMins: 30,
    corsProtection: true,
  },
  'api-keys': {
    keys: [],
  },
  webhooks: {
    endpoints: [],
  },
  legal: {
    documents: [
      {
        id: 'terms',
        title: 'Terms of Service',
        type: 'terms-of-service',
        version: 'v1.0',
        status: 'Published',
        lastUpdated: new Date().toISOString().split('T')[0],
        content: '',
      },
      {
        id: 'privacy',
        title: 'Privacy Policy',
        type: 'privacy-policy',
        version: 'v1.0',
        status: 'Published',
        lastUpdated: new Date().toISOString().split('T')[0],
        content: '',
      },
    ],
    compliance: {
      gdprMode: true,
      cookieConsent: true,
      dataRetention: false,
      rightToErasure: true,
      dataExport: true,
      ageVerification: false,
    },
    retention: {
      userData: 365,
      auditLog: 90,
      sessionData: 30,
    },
  },
  sso: {
    enabled: false,
    providers: {
      google: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        scopes: 'openid profile email',
      },
      azure: {
        enabled: false,
        tenantId: '',
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        scopes: 'openid profile email',
      },
    },
  },
  smtp: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'AppKit',
  },
  mfa: {
    enforceMfa: false,
    allowedTypes: ['totp'],
    rememberDeviceDays: 30,
    backupCodesEnabled: true,
    challengeOnHighRiskOnly: false,
  },
  '2fa': {
    enforceMfa: false,
    allowedTypes: ['totp'],
    rememberDeviceDays: 30,
    backupCodesEnabled: true,
    challengeOnHighRiskOnly: false,
  },
  logs: {
    minLevel: 'info',
    sourceToggles: {
      server: true,
      client: true,
      api: true,
      auth: true,
      database: true,
      webhook: true,
    },
    retentionDays: 90,
    livePollingIntervalSeconds: 5,
  },
}

function normalizeSection(value: string): SystemSection | null {
  if (value in SECTION_KEYS) {
    return value as SystemSection
  }
  return null
}

async function syncSsoProviders(config: any) {
  const globalEnabled = Boolean(config?.enabled)
  const providers = config?.providers || {}
  const providerDefs: Array<{
    providerName: string
    displayName: string
    key: 'google' | 'azure'
    authorizationUrl: string | ((tenantId?: string) => string)
    tokenUrl: string | ((tenantId?: string) => string)
    userinfoUrl: string | ((tenantId?: string) => string)
  }> = [
    {
      providerName: 'google-oauth',
      displayName: 'Google OAuth',
      key: 'google',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userinfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    },
    {
      providerName: 'microsoft-oauth',
      displayName: 'Microsoft OAuth',
      key: 'azure',
      authorizationUrl: (tenantId?: string) =>
        `https://login.microsoftonline.com/${tenantId || 'common'}/oauth2/v2.0/authorize`,
      tokenUrl: (tenantId?: string) =>
        `https://login.microsoftonline.com/${tenantId || 'common'}/oauth2/v2.0/token`,
      userinfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    },
  ]

  for (const def of providerDefs) {
    const current = providers?.[def.key] || {}
    const isEnabled = globalEnabled && Boolean(current.enabled)
    const tenantId = typeof current.tenantId === 'string' ? current.tenantId : ''
    const authorizationUrl =
      typeof def.authorizationUrl === 'function' ? def.authorizationUrl(tenantId) : def.authorizationUrl
    const tokenUrl = typeof def.tokenUrl === 'function' ? def.tokenUrl(tenantId) : def.tokenUrl
    const userinfoUrl = typeof def.userinfoUrl === 'function' ? def.userinfoUrl(tenantId) : def.userinfoUrl
    const scopes = typeof current.scopes === 'string'
      ? current.scopes.split(/\s+/).map((v: string) => v.trim()).filter(Boolean)
      : Array.isArray(current.scopes) ? current.scopes : []

    const existing = await prisma.oAuthProvider.findFirst({
      where: { applicationId: null, providerName: def.providerName },
    })
    const payload = {
      applicationId: null,
      providerName: def.providerName,
      displayName: def.displayName,
      isEnabled,
      clientId: current.clientId || '',
      clientSecret: current.clientSecret || '',
      authorizationUrl,
      tokenUrl,
      userinfoUrl,
      scopes,
      allowSignup: true,
      requireEmailVerified: true,
      autoLinkByEmail: false,
      allowedDomains: [],
      displayOrder: def.providerName === 'google-oauth' ? 10 : 20,
    }

    if (existing) {
      await prisma.oAuthProvider.update({ where: { id: existing.id }, data: payload })
    } else {
      await prisma.oAuthProvider.create({ data: payload })
    }
  }
}

async function syncMfaPolicy(config: any) {
  const existingGlobal = await prisma.securityPolicy.findFirst({
    where: { applicationId: null, policyName: 'Global Security Policy' },
  })
  const payload = {
    applicationId: null,
    policyName: 'Global Security Policy',
    policyType: 'default',
    isActive: true,
    mfaRequired: Boolean(config?.enforceMfa),
    mfaRememberDeviceDays: Number(config?.rememberDeviceDays || 30),
    mfaAllowedTypes: Array.isArray(config?.allowedTypes) ? config.allowedTypes : ['totp'],
  }
  if (existingGlobal) {
    await prisma.securityPolicy.update({ where: { id: existingGlobal.id }, data: payload })
  } else {
    await prisma.securityPolicy.create({ data: payload as any })
  }

  const securityKey = SECTION_KEYS.security
  const existingSecurity = await prisma.systemConfig.findUnique({ where: { key: securityKey } })
  const existingSecurityValue = (existingSecurity?.value || DEFAULT_CONFIG.security) as Record<string, any>
  await prisma.systemConfig.upsert({
    where: { key: securityKey },
    update: {
      value: { ...existingSecurityValue, enforceMfa: Boolean(config?.enforceMfa) },
      description: 'System settings: security',
    },
    create: {
      key: securityKey,
      value: { ...DEFAULT_CONFIG.security, enforceMfa: Boolean(config?.enforceMfa) },
      description: 'System settings: security',
      isPublic: false,
    },
  })
}

async function readSectionConfig(section: SystemSection) {
  const key = SECTION_KEYS[section]
  const row = await prisma.systemConfig.findUnique({ where: { key } })
  const config = row?.value ?? DEFAULT_CONFIG[section]
  if (section === 'smtp' && config && typeof config === 'object') {
    const smtpCfg = { ...(config as Record<string, any>) }
    if (smtpCfg.password) {
      smtpCfg.password = '********'
    }
    return smtpCfg
  }
  return config
}

export async function GET(
  request: NextRequest,
  { params }: { params: { section: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'settings:view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const section = normalizeSection(params.section)
    if (!section) {
      return NextResponse.json({ error: 'Invalid system settings section' }, { status: 400 })
    }

    const config = await readSectionConfig(section)
    return NextResponse.json({ section, config })
  } catch (error) {
    console.error('GET system config error:', error)
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { section: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'settings:edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const section = normalizeSection(params.section)
    if (!section) {
      return NextResponse.json({ error: 'Invalid system settings section' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const config = body?.config
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Config object is required' }, { status: 400 })
    }

    const key = SECTION_KEYS[section]
    let nextConfig = config
    if (section === 'smtp') {
      const incoming = config as Record<string, any>
      if (typeof incoming.password !== 'string' || !incoming.password || incoming.password === '********') {
        const existing = await prisma.systemConfig.findUnique({ where: { key } })
        const existingValue = (existing?.value || {}) as Record<string, any>
        nextConfig = { ...incoming, password: existingValue.password || '' }
      }
    }
    await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: nextConfig,
        description: `System settings: ${section}`,
      },
      create: {
        key,
        value: nextConfig,
        description: `System settings: ${section}`,
        isPublic: false,
      },
    })

    if (section === 'sso') {
      await syncSsoProviders(nextConfig)
    }
    if (section === 'mfa' || section === '2fa') {
      await syncMfaPolicy(nextConfig)
    }

    return NextResponse.json({ message: 'Settings saved', section, config: nextConfig })
  } catch (error) {
    console.error('PUT system config error:', error)
    return NextResponse.json({ error: 'Failed to save system settings' }, { status: 500 })
  }
}
