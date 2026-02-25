/**
 * Default Config Service
 *
 * Centralized service for managing platform‑wide default configurations
 * and per‑app overrides for Auth Methods, Communication, and Legal settings.
 *
 * Storage:
 *   Platform defaults  → SystemConfig (key/value JSON)
 *   Per‑app overrides  → AppSetting  (applicationId + key → JSON)
 *   Auth providers     → OAuthProvider (applicationId nullable)
 */

import { prisma } from '../lib/prisma'

/* ------------------------------------------------------------------ */
/*  Type helpers                                                       */
/* ------------------------------------------------------------------ */

export interface AuthMethodConfig {
  id: string
  providerName: string
  displayName: string
  isEnabled: boolean
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  scopes?: string[]
  settings?: Record<string, any>
}

export interface CommConfig {
  providers: {
    id: string
    name: string
    type: string // smtp | sms | push
    enabled: boolean
    settings: Record<string, any>
  }[]
  channels: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
  }
  smtpSettings?: {
    host: string
    port: number
    username: string
    fromEmail: string
    fromName: string
    secure: boolean
  }
}

export interface LegalConfig {
  documents: {
    id: string
    title: string
    type: string
    version: string
    status: 'Published' | 'Draft'
    lastUpdated: string
    url?: string
  }[]
  compliance: {
    gdprMode: boolean
    cookieConsent: boolean
    dataRetention: boolean
    rightToErasure: boolean
    dataExport: boolean
    ageVerification: boolean
  }
  retention: {
    userData: number
    auditLog: number
    sessionData: number
  }
}

/* ------------------------------------------------------------------ */
/*  Config keys                                                        */
/* ------------------------------------------------------------------ */

const CONFIG_KEYS = {
  COMM: 'default_comm_config',
  LEGAL: 'default_legal_config',
} as const

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

class DefaultConfigService {

  /* ===================== AUTH METHODS (OAuthProvider) =============== */

  /** Get platform‑default auth providers (applicationId IS NULL) */
  async getDefaultAuthMethods(): Promise<AuthMethodConfig[]> {
    try {
      const providers = await prisma.oAuthProvider.findMany({
        where: { applicationId: null },
        orderBy: { displayOrder: 'asc' },
      })
      return providers.map(p => ({
        id: p.id,
        providerName: p.providerName,
        displayName: p.displayName,
        isEnabled: p.isEnabled,
        clientId: p.clientId,
        clientSecret: undefined, // never leak
        redirectUri: (p.scopes as any)?.redirectUri,
        scopes: p.scopes as string[] ?? [],
        settings: {
          allowSignup: p.allowSignup,
          requireEmailVerified: p.requireEmailVerified,
          autoLinkByEmail: p.autoLinkByEmail,
          allowedDomains: p.allowedDomains,
        },
      }))
    } catch (error) {
      console.error('getDefaultAuthMethods error:', error)
      return []
    }
  }

  /** Save / upsert a platform‑default auth provider */
  async saveDefaultAuthMethod(data: Partial<AuthMethodConfig> & { providerName: string; displayName: string }): Promise<AuthMethodConfig | null> {
    try {
      const existing = await prisma.oAuthProvider.findFirst({
        where: { applicationId: null, providerName: data.providerName },
      })

      const payload = {
        providerName: data.providerName,
        displayName: data.displayName,
        isEnabled: data.isEnabled ?? true,
        clientId: data.clientId ?? '',
        clientSecret: data.clientSecret ?? '',
        allowSignup: data.settings?.allowSignup ?? true,
        requireEmailVerified: data.settings?.requireEmailVerified ?? true,
        autoLinkByEmail: data.settings?.autoLinkByEmail ?? false,
        allowedDomains: data.settings?.allowedDomains ?? [],
      }

      let provider
      if (existing) {
        provider = await prisma.oAuthProvider.update({
          where: { id: existing.id },
          data: payload,
        })
      } else {
        provider = await prisma.oAuthProvider.create({
          data: { ...payload, applicationId: null },
        })
      }

      return {
        id: provider.id,
        providerName: provider.providerName,
        displayName: provider.displayName,
        isEnabled: provider.isEnabled,
        clientId: provider.clientId,
        scopes: provider.scopes as string[] ?? [],
        settings: {
          allowSignup: provider.allowSignup,
          requireEmailVerified: provider.requireEmailVerified,
          autoLinkByEmail: provider.autoLinkByEmail,
          allowedDomains: provider.allowedDomains,
        },
      }
    } catch (error) {
      console.error('saveDefaultAuthMethod error:', error)
      return null
    }
  }

  /** Bulk save default auth methods */
  async saveDefaultAuthMethods(methods: Partial<AuthMethodConfig>[]): Promise<boolean> {
    try {
      for (const m of methods) {
        if (m.providerName && m.displayName) {
          await this.saveDefaultAuthMethod(m as any)
        }
      }
      return true
    } catch (error) {
      console.error('saveDefaultAuthMethods error:', error)
      return false
    }
  }

  /* ===================== COMMUNICATION (SystemConfig) ============== */

  async getDefaultCommConfig(): Promise<CommConfig | null> {
    try {
      const row = await prisma.systemConfig.findUnique({
        where: { key: CONFIG_KEYS.COMM },
      })
      return (row?.value as unknown as CommConfig) ?? null
    } catch (error) {
      console.error('getDefaultCommConfig error:', error)
      return null
    }
  }

  async saveDefaultCommConfig(data: CommConfig): Promise<boolean> {
    try {
      await prisma.systemConfig.upsert({
        where: { key: CONFIG_KEYS.COMM },
        update: { value: data as any },
        create: { key: CONFIG_KEYS.COMM, value: data as any, description: 'Default communication configuration' },
      })
      return true
    } catch (error) {
      console.error('saveDefaultCommConfig error:', error)
      return false
    }
  }

  /* ===================== LEGAL (SystemConfig) ====================== */

  async getDefaultLegalConfig(): Promise<LegalConfig | null> {
    try {
      const row = await prisma.systemConfig.findUnique({
        where: { key: CONFIG_KEYS.LEGAL },
      })
      return (row?.value as unknown as LegalConfig) ?? null
    } catch (error) {
      console.error('getDefaultLegalConfig error:', error)
      return null
    }
  }

  async saveDefaultLegalConfig(data: LegalConfig): Promise<boolean> {
    try {
      await prisma.systemConfig.upsert({
        where: { key: CONFIG_KEYS.LEGAL },
        update: { value: data as any },
        create: { key: CONFIG_KEYS.LEGAL, value: data as any, description: 'Default legal & compliance configuration' },
      })
      return true
    } catch (error) {
      console.error('saveDefaultLegalConfig error:', error)
      return false
    }
  }

  /* ===================== PER‑APP OVERRIDES ========================= */

  /** Get per‑app config override. Returns null if using defaults. */
  async getAppConfig(appId: string, configType: string): Promise<any | null> {
    try {
      const key = `config_override_${configType}`
      const setting = await prisma.appSetting.findFirst({
        where: { applicationId: appId, key },
      })
      return setting?.value ?? null
    } catch (error) {
      console.error('getAppConfig error:', error)
      return null
    }
  }

  /** Save per‑app config override */
  async saveAppConfig(appId: string, configType: string, data: any): Promise<boolean> {
    try {
      const key = `config_override_${configType}`
      // Find existing to get id for upsert
      const existing = await prisma.appSetting.findFirst({
        where: { applicationId: appId, key },
      })

      if (existing) {
        await prisma.appSetting.update({
          where: { id: existing.id },
          data: { value: data },
        })
      } else {
        await prisma.appSetting.create({
          data: {
            applicationId: appId,
            key,
            value: data,
            description: `Per-app override for ${configType}`,
          },
        })
      }
      return true
    } catch (error) {
      console.error('saveAppConfig error:', error)
      return false
    }
  }

  /** Delete per‑app override (revert to default) */
  async deleteAppConfig(appId: string, configType: string): Promise<boolean> {
    try {
      const key = `config_override_${configType}`
      const existing = await prisma.appSetting.findFirst({
        where: { applicationId: appId, key },
      })
      if (existing) {
        await prisma.appSetting.delete({ where: { id: existing.id } })
      }
      return true
    } catch (error) {
      console.error('deleteAppConfig error:', error)
      return false
    }
  }

  /** Get effective config — returns per‑app override if exists, otherwise the default */
  async getEffectiveConfig(appId: string, configType: string): Promise<{ useDefault: boolean; config: any }> {
    const override = await this.getAppConfig(appId, configType)
    if (override) {
      return { useDefault: false, config: override }
    }
    // Fall back to default
    let defaultConfig: any = null
    switch (configType) {
      case 'auth':
        defaultConfig = await this.getDefaultAuthMethods()
        break
      case 'comm':
        defaultConfig = await this.getDefaultCommConfig()
        break
      case 'legal':
        defaultConfig = await this.getDefaultLegalConfig()
        break
    }
    return { useDefault: true, config: defaultConfig }
  }
}

export const defaultConfigService = new DefaultConfigService()
export default defaultConfigService
