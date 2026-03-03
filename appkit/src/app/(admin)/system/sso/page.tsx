'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'

interface SsoProviderConfig {
  enabled: boolean
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string
  tenantId?: string
}

interface SsoConfig {
  enabled: boolean
  providers: {
    google: SsoProviderConfig
    azure: SsoProviderConfig
  }
}

const DEFAULT_CONFIG: SsoConfig = {
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
}

export default function SystemSsoPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SsoConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/v1/admin/system/config/sso', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to load SSO config')
        const data = await res.json()
        setConfig({ ...DEFAULT_CONFIG, ...(data?.config || {}) })
      } catch (error) {
        console.error(error)
        toast({ title: 'Load failed', description: 'Could not load SSO configuration.', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  const save = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/config/sso', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) throw new Error('Failed to save SSO config')
      toast({ title: 'Saved', description: 'SSO configuration updated.', variant: 'success' })
    } catch (error) {
      console.error(error)
      toast({ title: 'Save failed', description: 'Could not save SSO configuration.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateProvider = (provider: 'google' | 'azure', key: keyof SsoProviderConfig, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          [key]: value,
        },
      },
    }))
  }

  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SSO Configuration</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure AppKit-level Google and Azure SSO providers.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            Enable SSO globally
          </label>
        </div>

        {/* Provider Cards */}
        <div className="space-y-3">
          {(['google', 'azure'] as const).map((provider) => {
            const isExpanded = expandedProvider === provider
            const providerConfig = config.providers[provider]
            const icon = provider === 'google' 
              ? <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              : <svg className="w-5 h-5" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
            
            return (
              <div
                key={provider}
                className={`rounded-xl border transition-all duration-200 ${
                  providerConfig.enabled
                    ? 'border-blue-200/80 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-500/5'
                    : 'border-gray-200 dark:border-zinc-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedProvider(isExpanded ? null : provider)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                      {icon}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {provider === 'google' ? 'Google SSO' : 'Azure AD SSO'}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {providerConfig.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="sr-only peer" checked={providerConfig.enabled} onChange={(e) => updateProvider(provider, 'enabled', e.target.checked)} />
                      <div className="w-10 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  </div>
                </button>

                {/* Expanded Config */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-zinc-800/50 pt-4">
                    {provider === 'azure' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Tenant ID</label>
                        <input type="text" title="Azure tenant ID" value={config.providers.azure.tenantId || ''} onChange={(e) => updateProvider('azure', 'tenantId', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Client ID</label>
                        <input type="text" title={`${provider} client id`} value={providerConfig.clientId} onChange={(e) => updateProvider(provider, 'clientId', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Client Secret</label>
                        <input type="password" title={`${provider} client secret`} value={providerConfig.clientSecret} onChange={(e) => updateProvider(provider, 'clientSecret', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Redirect URI</label>
                      <input type="url" title={`${provider} redirect uri`} value={providerConfig.redirectUri} onChange={(e) => updateProvider(provider, 'redirectUri', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Scopes (space separated)</label>
                      <input type="text" title={`${provider} scopes`} value={providerConfig.scopes} onChange={(e) => updateProvider(provider, 'scopes', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
          <Button onClick={save} disabled={saving || loading} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            {saving ? 'Saving...' : 'Save SSO'}
          </Button>
        </div>
      </div>
    </div>
  )
}
