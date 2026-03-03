'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import {
  XIcon,
  ShieldCheckIcon,
  MailIcon,
  GlobeIcon,
  CogIcon,
  KeyIcon,
  SmartphoneIcon,
  SaveIcon,
  Loader2Icon,
  LinkIcon,
  MessageCircleIcon,
} from 'lucide-react'

interface AuthMethodsConfigDrawerProps {
  isOpen: boolean
  onClose: () => void
  appId: string
  appName: string
}

interface AuthProvider {
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

const PROVIDER_META: Record<string, { icon: React.ReactNode; color: string }> = {
  'email-password': { icon: <MailIcon className="w-4 h-4" />, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' },
  'google-oauth': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
    color: 'bg-white dark:bg-zinc-800/50 text-gray-700 border border-gray-200 dark:border-zinc-700'
  },
  'facebook-oauth': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg>,
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
  },
  'x-oauth': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>,
    color: 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-900 dark:text-zinc-100'
  },
  'microsoft-oauth': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>,
    color: 'bg-gray-50 dark:bg-zinc-800/50 text-gray-700'
  },
  'line-oauth': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="#06C755"/></svg>,
    color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
  },
  'github-oauth': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/></svg>,
    color: 'bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white'
  },
  'saml-sso': { icon: <ShieldCheckIcon className="w-4 h-4" />, color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500' },
  'magic-link': { icon: <KeyIcon className="w-4 h-4" />, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' },
  'sms-otp': { icon: <SmartphoneIcon className="w-4 h-4" />, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' },
  'whatsapp-otp': {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366"/></svg>,
    color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
  },
}

const FALLBACK_PROVIDERS: AuthProvider[] = [
  { id: 'default-email', providerName: 'email-password', displayName: 'Email & Password', isEnabled: true, settings: {} },
  { id: 'default-saml', providerName: 'saml-sso', displayName: 'SAML / SSO', isEnabled: false, settings: {} },
  { id: 'default-magic', providerName: 'magic-link', displayName: 'Magic Link', isEnabled: false, settings: {} },
  { id: 'default-sms', providerName: 'sms-otp', displayName: 'SMS OTP', isEnabled: false, settings: {} },
  { id: 'default-whatsapp', providerName: 'whatsapp-otp', displayName: 'WhatsApp OTP', isEnabled: false, settings: {} },
  { id: 'default-google', providerName: 'google-oauth', displayName: 'Google OAuth', isEnabled: false },
  { id: 'default-facebook', providerName: 'facebook-oauth', displayName: 'Facebook OAuth', isEnabled: false },
  { id: 'default-x', providerName: 'x-oauth', displayName: 'X OAuth', isEnabled: false },
  { id: 'default-microsoft', providerName: 'microsoft-oauth', displayName: 'Microsoft OAuth', isEnabled: false },
  { id: 'default-line', providerName: 'line-oauth', displayName: 'LINE OAuth', isEnabled: false },
  { id: 'default-github', providerName: 'github-oauth', displayName: 'GitHub OAuth', isEnabled: false },
]

const PROVIDER_GROUP: Record<string, 'social login' | 'password less' | 'general'> = {
  'email-password': 'general',
  'saml-sso': 'general',
  'magic-link': 'password less',
  'sms-otp': 'password less',
  'whatsapp-otp': 'password less',
  'google-oauth': 'social login',
  'github-oauth': 'social login',
  'facebook-oauth': 'social login',
  'x-oauth': 'social login',
  'microsoft-oauth': 'social login',
  'line-oauth': 'social login',
}

const PROVIDER_GUIDES: Record<string, string[]> = {
  'email-password': [
    'Enable strong password rules and account lockout for brute-force protection.',
    'Always hash passwords server-side and never log raw credentials.',
    'Use email verification before granting full account access.',
  ],
  'saml-sso': [
    'Match ACS URL and Entity ID exactly with your identity provider configuration.',
    'Rotate signing certificates safely and support overlap during rollover.',
    'Validate audience, issuer, and assertion expiration on every login.',
  ],
  'magic-link': [
    'Use short-lived, one-time tokens and invalidate tokens after first use.',
    'Bind token usage to expected app/client context where possible.',
    'Throttle resend attempts to reduce abuse and email spam.',
  ],
  'sms-otp': [
    'Keep OTP expiration short and limit retry attempts per challenge.',
    'Use rate limits per phone number and IP to prevent abuse.',
    'Prefer OTP as second factor; avoid SMS-only for high-risk flows.',
  ],
  'whatsapp-otp': [
    'Use approved WhatsApp templates and verify sender business identity.',
    'Expire OTP quickly and enforce retry + resend cooldowns.',
    'Fallback to alternate channel if delivery status is delayed.',
  ],
  'google-oauth': [
    'Register exact redirect URIs (including scheme, host, and trailing slash).',
    'Use PKCE for public clients and keep client secrets on backend only.',
    'Request minimal scopes first and add sensitive scopes only when needed.',
  ],
  'github-oauth': [
    'Ensure callback URL matches app settings exactly.',
    'Store client secret only in secure server environment variables.',
    'Handle denied-consent responses and show retry path to users.',
  ],
  'facebook-oauth': [
    'Whitelist exact redirect URIs in Facebook app settings.',
    'Complete app review before requesting restricted profile permissions.',
    'Enable strict mode for redirect URI validation in production.',
  ],
  'x-oauth': [
    'Configure callback URL exactly and use OAuth 2.0 with PKCE when available.',
    'Request the smallest scope set needed for your feature.',
    'Handle token refresh and revoked-consent errors gracefully.',
  ],
  'microsoft-oauth': [
    'Choose correct tenant model (single-tenant vs multi-tenant) early.',
    'Register platform-specific redirect URIs for web and mobile separately.',
    'Validate issuer and audience from Microsoft tokens on backend.',
  ],
  'line-oauth': [
    'Set callback URL exactly in LINE Developers console.',
    'Use state parameter and verify it to prevent CSRF attacks.',
    'Request profile/email scopes only when needed by the app.',
  ],
}

type FieldType = 'text' | 'password' | 'url' | 'number' | 'textarea' | 'boolean' | 'csv'

interface ProviderField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  requiredWhenEnabled?: boolean
  min?: number
}

const COMMON_OAUTH_FIELDS: ProviderField[] = [
  { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter OAuth client id', requiredWhenEnabled: true },
  { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter OAuth client secret', requiredWhenEnabled: true },
  { key: 'redirectUri', label: 'Redirect URI', type: 'url', placeholder: 'https://app.example.com/auth/callback', requiredWhenEnabled: true },
  { key: 'scopes', label: 'Scopes (comma separated)', type: 'csv', placeholder: 'openid, profile, email', requiredWhenEnabled: true },
  { key: 'settings.oauth.usePkce', label: 'Use PKCE', type: 'boolean' },
]

const PROVIDER_FIELDS: Record<string, ProviderField[]> = {
  'email-password': [
    { key: 'settings.passwordPolicy.minLength', label: 'Minimum Password Length', type: 'number', min: 8, requiredWhenEnabled: true },
    { key: 'settings.passwordPolicy.requireUppercase', label: 'Require Uppercase', type: 'boolean' },
    { key: 'settings.passwordPolicy.requireLowercase', label: 'Require Lowercase', type: 'boolean' },
    { key: 'settings.passwordPolicy.requireNumber', label: 'Require Number', type: 'boolean' },
    { key: 'settings.passwordPolicy.requireSpecial', label: 'Require Special Character', type: 'boolean' },
    { key: 'settings.security.requireEmailVerification', label: 'Require Email Verification', type: 'boolean' },
    { key: 'settings.security.maxFailedAttempts', label: 'Max Failed Attempts', type: 'number', min: 1, requiredWhenEnabled: true },
    { key: 'settings.security.lockoutMinutes', label: 'Lockout Minutes', type: 'number', min: 1, requiredWhenEnabled: true },
  ],
  'saml-sso': [
    { key: 'settings.saml.entityId', label: 'Entity ID', type: 'text', requiredWhenEnabled: true },
    { key: 'settings.saml.ssoUrl', label: 'SSO URL', type: 'url', requiredWhenEnabled: true },
    { key: 'settings.saml.certificate', label: 'X.509 Certificate', type: 'textarea', requiredWhenEnabled: true },
  ],
  'magic-link': [
    { key: 'settings.magicLink.expiryMinutes', label: 'Link Expiry (minutes)', type: 'number', min: 1, requiredWhenEnabled: true },
    { key: 'settings.magicLink.maxAttempts', label: 'Max Attempts Per Link', type: 'number', min: 1, requiredWhenEnabled: true },
    { key: 'settings.magicLink.resendCooldownSeconds', label: 'Resend Cooldown (seconds)', type: 'number', min: 0, requiredWhenEnabled: true },
    { key: 'settings.magicLink.rateLimitPerHour', label: 'Rate Limit Per Hour', type: 'number', min: 1, requiredWhenEnabled: true },
  ],
  'sms-otp': [
    { key: 'settings.otp.expirySeconds', label: 'OTP Expiry (seconds)', type: 'number', min: 30, requiredWhenEnabled: true },
    { key: 'settings.otp.codeLength', label: 'OTP Length', type: 'number', min: 4, requiredWhenEnabled: true },
    { key: 'settings.otp.maxAttempts', label: 'Max Verify Attempts', type: 'number', min: 1, requiredWhenEnabled: true },
    { key: 'settings.otp.resendCooldownSeconds', label: 'Resend Cooldown (seconds)', type: 'number', min: 0, requiredWhenEnabled: true },
    { key: 'settings.otp.rateLimitPerHour', label: 'Rate Limit Per Hour', type: 'number', min: 1, requiredWhenEnabled: true },
  ],
  'whatsapp-otp': [
    { key: 'settings.otp.expirySeconds', label: 'OTP Expiry (seconds)', type: 'number', min: 30, requiredWhenEnabled: true },
    { key: 'settings.otp.codeLength', label: 'OTP Length', type: 'number', min: 4, requiredWhenEnabled: true },
    { key: 'settings.otp.maxAttempts', label: 'Max Verify Attempts', type: 'number', min: 1, requiredWhenEnabled: true },
    { key: 'settings.otp.resendCooldownSeconds', label: 'Resend Cooldown (seconds)', type: 'number', min: 0, requiredWhenEnabled: true },
    { key: 'settings.otp.rateLimitPerHour', label: 'Rate Limit Per Hour', type: 'number', min: 1, requiredWhenEnabled: true },
  ],
  'google-oauth': COMMON_OAUTH_FIELDS,
  'github-oauth': COMMON_OAUTH_FIELDS,
  'facebook-oauth': COMMON_OAUTH_FIELDS,
  'x-oauth': COMMON_OAUTH_FIELDS,
  'microsoft-oauth': COMMON_OAUTH_FIELDS,
  'line-oauth': COMMON_OAUTH_FIELDS,
}

export default function AuthMethodsConfigDrawer({ isOpen, onClose, appId, appName }: AuthMethodsConfigDrawerProps) {
  const [providers, setProviders] = useState<AuthProvider[]>(FALLBACK_PROVIDERS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (isOpen && appId) loadData()
  }, [isOpen, appId])

  const mergeWithFallbacks = (apiProviders: AuthProvider[]): AuthProvider[] => {
    if (!apiProviders || apiProviders.length === 0) return FALLBACK_PROVIDERS
    const map = new Map(apiProviders.map((p) => [p.providerName, p]))
    return FALLBACK_PROVIDERS.map((fallback) => {
      const fromApi = map.get(fallback.providerName)
      if (!fromApi) return fallback
      return {
        ...fallback,
        ...fromApi,
        settings: {
          ...(fallback.settings || {}),
          ...(fromApi.settings || {}),
        },
      }
    })
  }

  const getNestedValue = (obj: Record<string, any> | undefined, path: string) => {
    if (!obj) return undefined
    return path.split('.').reduce<any>((acc, part) => (acc && part in acc ? acc[part] : undefined), obj)
  }

  const setNestedValue = (obj: Record<string, any>, path: string, value: any) => {
    const parts = path.split('.')
    let cursor: any = obj
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]
      cursor[key] = cursor[key] && typeof cursor[key] === 'object' ? cursor[key] : {}
      cursor = cursor[key]
    }
    cursor[parts[parts.length - 1]] = value
  }

  const getFieldValue = (provider: AuthProvider, field: ProviderField) => {
    if (field.key === 'scopes') {
      return (provider.scopes || []).join(', ')
    }
    if (field.key.startsWith('settings.')) {
      return getNestedValue(provider.settings, field.key.replace('settings.', ''))
    }
    return (provider as any)[field.key]
  }

  const updateProviderField = (providerName: string, field: ProviderField, rawValue: any) => {
    setProviders((prev) =>
      prev.map((provider) => {
        if (provider.providerName !== providerName) return provider

        if (field.key === 'scopes') {
          const scopes = String(rawValue)
            .split(',')
            .map((scope) => scope.trim())
            .filter(Boolean)
          return { ...provider, scopes }
        }

        if (field.key.startsWith('settings.')) {
          const nextSettings = { ...(provider.settings || {}) }
          setNestedValue(nextSettings, field.key.replace('settings.', ''), rawValue)
          return { ...provider, settings: nextSettings }
        }

        return { ...provider, [field.key]: rawValue }
      })
    )
  }

  const validateEnabledProviders = (): string | null => {
    for (const provider of providers) {
      if (!provider.isEnabled) continue
      const fields = PROVIDER_FIELDS[provider.providerName] || []
      for (const field of fields) {
        if (!field.requiredWhenEnabled) continue
        const value = getFieldValue(provider, field)
        if (field.type === 'number') {
          const parsed = Number(value)
          if (!Number.isFinite(parsed) || parsed < (field.min ?? 0)) {
            return `${provider.displayName}: ${field.label} is required`
          }
          continue
        }
        if (typeof value !== 'string' || !value.trim()) {
          return `${provider.displayName}: ${field.label} is required`
        }
      }
    }
    return null
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getAppConfigOverride(appId, 'auth')
      const apiConfig = Array.isArray(res.config) ? res.config : []
      setProviders(mergeWithFallbacks(apiConfig))
    } catch (err) {
      console.error('Failed to load app auth config:', err)
      setProviders(FALLBACK_PROVIDERS)
    } finally {
      setLoading(false)
    }
  }

  const toggleProvider = (providerName: string) => {
    setProviders(prev => prev.map(p => p.providerName === providerName ? { ...p, isEnabled: !p.isEnabled } : p))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const validationError = validateEnabledProviders()
      if (validationError) {
        setSaveMessage(validationError)
        setTimeout(() => setSaveMessage(''), 5000)
        return
      }
      await adminService.saveAppConfig(appId, 'auth', providers)
      setSaveMessage('Saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveMessage('Failed to save')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-4 right-4 bottom-4 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-zinc-800/80">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auth Methods Config</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{appName}</p>
          </div>
          <button onClick={onClose} title="Close auth methods config" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500"><XIcon className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authentication Methods</h3>
                </div>
                {(['general', 'social login', 'password less'] as const).map((group) => {
                  const groupProviders = providers.filter((p) => (PROVIDER_GROUP[p.providerName] || 'general') === group)
                  if (groupProviders.length === 0) return null

                  return (
                    <div key={group} className="space-y-3">
                      <div className="px-1">
                        <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                          {group}
                        </span>
                      </div>
                      {groupProviders.map(p => {
                        const meta = PROVIDER_META[p.providerName]
                        const fields = PROVIDER_FIELDS[p.providerName] || []

                        return (
                          <div key={p.providerName} className={`p-4 rounded-xl border ${p.isEnabled ? 'border-blue-200/80 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-500/5' : 'border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-9 h-9 rounded-lg ${meta?.color || 'bg-gray-50 text-gray-500'} flex items-center justify-center shadow-sm`}>{meta?.icon || <CogIcon className="w-5 h-5" />}</div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.displayName}</span>
                                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{p.isEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" title={`${p.displayName} enabled`} className="sr-only peer" checked={p.isEnabled} onChange={() => toggleProvider(p.providerName)} />
                                  <div className="w-10 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                                </label>
                              </div>
                            </div>

                            {/* Only show config for ENABLED providers */}
                            {p.isEnabled && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50 space-y-3">
                                <div className="p-3 rounded-lg border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                      {p.displayName} setup guide
                                    </p>
                                  </div>
                                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-900/90 dark:text-blue-200/90">
                                    {(PROVIDER_GUIDES[p.providerName] || [
                                      'Use exact callback/redirect URL matching in provider settings.',
                                      'Keep secrets on backend only and use PKCE for public clients.',
                                      'Handle denied consent and token errors with clear retry UX.',
                                    ]).map((tip) => (
                                      <li key={tip}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  {fields.map((field) => {
                                    const fieldValue = getFieldValue(p, field)
                                    const label = field.requiredWhenEnabled ? `${field.label} *` : field.label

                                    if (field.type === 'boolean') {
                                      return (
                                        <label key={field.key} className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(fieldValue)}
                                            onChange={(e) => updateProviderField(p.providerName, field, e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          {label}
                                        </label>
                                      )
                                    }

                                    if (field.type === 'textarea') {
                                      return (
                                        <div key={field.key}>
                                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">{label}</label>
                                          <textarea
                                            rows={4}
                                            value={typeof fieldValue === 'string' ? fieldValue : ''}
                                            placeholder={field.placeholder}
                                            onChange={(e) => updateProviderField(p.providerName, field, e.target.value)}
                                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                          />
                                        </div>
                                      )
                                    }

                                    {/* Scopes multiselect dropdown */}
                                    if (field.type === 'csv') {
                                      const COMMON_SCOPES = ['openid', 'profile', 'email', 'phone', 'address', 'offline_access']
                                      const currentScopes = (p.scopes || [])
                                      return (
                                        <div key={field.key}>
                                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">{label}</label>
                                          <div className="flex flex-wrap gap-1.5 mb-2">
                                            {currentScopes.map((scope) => (
                                              <span key={scope} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-medium">
                                                {scope}
                                                <button type="button" onClick={() => {
                                                  const next = currentScopes.filter(s => s !== scope)
                                                  updateProviderField(p.providerName, field, next.join(', '))
                                                }} className="ml-0.5 hover:text-red-500">×</button>
                                              </span>
                                            ))}
                                          </div>
                                          <select
                                            title="Add scope"
                                            value=""
                                            onChange={(e) => {
                                              if (e.target.value && !currentScopes.includes(e.target.value)) {
                                                updateProviderField(p.providerName, field, [...currentScopes, e.target.value].join(', '))
                                              }
                                            }}
                                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                          >
                                            <option value="">Add scope...</option>
                                            {COMMON_SCOPES.filter(s => !currentScopes.includes(s)).map(s => (
                                              <option key={s} value={s}>{s}</option>
                                            ))}
                                          </select>
                                        </div>
                                      )
                                    }

                                    return (
                                      <div key={field.key}>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">{label}</label>
                                        <input
                                          type={field.type}
                                          min={field.type === 'number' ? field.min : undefined}
                                          value={
                                            field.type === 'number'
                                              ? (fieldValue ?? '')
                                              : (typeof fieldValue === 'string' ? fieldValue : '')
                                          }
                                          placeholder={field.placeholder}
                                          onChange={(e) => {
                                            const nextValue = field.type === 'number'
                                              ? (e.target.value === '' ? '' : Number(e.target.value))
                                              : e.target.value
                                            updateProviderField(p.providerName, field, nextValue)
                                          }}
                                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-end space-x-2">
            {saveMessage && <span className={`text-sm font-medium mr-2 ${saveMessage === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{saveMessage}</span>}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              {saving ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
