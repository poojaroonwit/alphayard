'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import {
  ShieldCheckIcon,
  MailIcon,
  GlobeIcon,
  CogIcon,
  KeyIcon,
  SmartphoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  SaveIcon,
  InfoIcon,
  Loader2Icon,
} from 'lucide-react'

interface AuthProvider {
  id: string
  providerName: string
  displayName: string
  isEnabled: boolean
  clientId?: string
  clientSecret?: string
  settings?: Record<string, any>
}

const FALLBACK_PROVIDERS: AuthProvider[] = [
  { id: 'email-password', providerName: 'email-password', displayName: 'Email & Password', isEnabled: true },
  { id: 'google-oauth', providerName: 'google-oauth', displayName: 'Google OAuth', isEnabled: true },
  { id: 'github-oauth', providerName: 'github-oauth', displayName: 'GitHub OAuth', isEnabled: false },
  { id: 'saml-sso', providerName: 'saml-sso', displayName: 'SAML SSO', isEnabled: false },
  { id: 'magic-link', providerName: 'magic-link', displayName: 'Magic Link', isEnabled: true },
  { id: 'sms-otp', providerName: 'sms-otp', displayName: 'SMS OTP', isEnabled: false },
]

const PROVIDER_META: Record<string, { icon: React.ReactNode; color: string; desc: string; fields?: { label: string; placeholder: string; type?: string }[] }> = {
  'email-password': { icon: <MailIcon className="w-5 h-5" />, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500', desc: 'Traditional email/password login', fields: [{ label: 'Min Password Length', placeholder: '8', type: 'number' }, { label: 'Require Email Verification', placeholder: 'true' }] },
  'google-oauth': { icon: <GlobeIcon className="w-5 h-5" />, color: 'bg-red-50 dark:bg-red-500/10 text-red-500', desc: 'Sign in with Google account', fields: [{ label: 'Client ID', placeholder: 'your-google-client-id' }, { label: 'Client Secret', placeholder: '••••••••', type: 'password' }, { label: 'Redirect URI', placeholder: 'https://your-domain.com/auth/google/callback' }] },
  'github-oauth': { icon: <CogIcon className="w-5 h-5" />, color: 'bg-gray-50 dark:bg-zinc-500/10 text-gray-700 dark:text-zinc-300', desc: 'Sign in with GitHub account', fields: [{ label: 'Client ID', placeholder: 'your-github-client-id' }, { label: 'Client Secret', placeholder: '••••••••', type: 'password' }, { label: 'Redirect URI', placeholder: 'https://your-domain.com/auth/github/callback' }] },
  'saml-sso': { icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500', desc: 'Enterprise SAML 2.0 single sign-on', fields: [{ label: 'Entity ID', placeholder: 'https://your-idp.com/entity-id' }, { label: 'SSO URL', placeholder: 'https://your-idp.com/sso' }, { label: 'Certificate', placeholder: 'Paste X.509 certificate...' }] },
  'magic-link': { icon: <KeyIcon className="w-5 h-5" />, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500', desc: 'Passwordless email login', fields: [{ label: 'Link Expiry (minutes)', placeholder: '15', type: 'number' }] },
  'sms-otp': { icon: <SmartphoneIcon className="w-5 h-5" />, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500', desc: 'Phone number verification', fields: [{ label: 'Provider', placeholder: 'Twilio' }, { label: 'Account SID', placeholder: 'your-account-sid' }, { label: 'Auth Token', placeholder: '••••••••', type: 'password' }, { label: 'From Number', placeholder: '+1234567890' }] },
}

export default function DefaultAuthMethodsPage() {
  const [providers, setProviders] = useState<AuthProvider[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getDefaultAuthMethods()
      if (res.methods && res.methods.length > 0) {
        setProviders(res.methods)
      } else {
        setProviders(FALLBACK_PROVIDERS)
      }
    } catch (err) {
      console.error('Failed to load auth methods:', err)
      setProviders(FALLBACK_PROVIDERS)
    } finally {
      setLoading(false)
    }
  }

  const toggleProvider = (providerName: string) => {
    setProviders(prev =>
      prev.map(p => (p.providerName === providerName ? { ...p, isEnabled: !p.isEnabled } : p))
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminService.saveDefaultAuthMethods(providers)
      setSaveMessage('Defaults saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveMessage('Failed to save')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading authentication methods...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Methods</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Configure default authentication providers. Individual applications inherit these settings unless overridden.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>{saveMessage}</span>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">
            {saving ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
            Save Defaults
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start space-x-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20">
        <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Default Configuration</p>
          <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-0.5">
            These settings serve as the platform-wide defaults. Each application can choose to use these defaults or configure individual settings.
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map(provider => {
          const meta = PROVIDER_META[provider.providerName] || { icon: <CogIcon className="w-5 h-5" />, color: 'bg-gray-50 dark:bg-zinc-500/10 text-gray-500', desc: provider.displayName, fields: [] }
          return (
            <div key={provider.providerName} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden transition-all">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center`}>{meta.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{meta.desc}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {provider.isEnabled ? (
                    <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="w-4 h-4 mr-1" /> Enabled</span>
                  ) : (
                    <span className="flex items-center text-xs font-medium text-gray-400 dark:text-zinc-500"><XCircleIcon className="w-4 h-4 mr-1" /> Disabled</span>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={provider.isEnabled} onChange={() => toggleProvider(provider.providerName)} />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                  {meta.fields && meta.fields.length > 0 && (
                    <button onClick={() => setExpandedId(expandedId === provider.providerName ? null : provider.providerName)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                      {expandedId === provider.providerName ? 'Collapse' : 'Configure'}
                    </button>
                  )}
                </div>
              </div>
              {expandedId === provider.providerName && meta.fields && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meta.fields.map(field => (
                      <div key={field.label}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{field.label}</label>
                        <input type={field.type || 'text'} placeholder={field.placeholder} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
