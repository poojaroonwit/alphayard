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
  CheckCircleIcon,
  XCircleIcon,
  SaveIcon,
  Loader2Icon,
  RotateCcwIcon,
  AlertTriangleIcon,
  LinkIcon,
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
  settings?: Record<string, any>
}

const PROVIDER_META: Record<string, { icon: React.ReactNode; color: string }> = {
  'email-password': { icon: <MailIcon className="w-4 h-4" />, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' },
  'google-oauth': { icon: <GlobeIcon className="w-4 h-4" />, color: 'bg-red-50 dark:bg-red-500/10 text-red-500' },
  'github-oauth': { icon: <CogIcon className="w-4 h-4" />, color: 'bg-gray-50 dark:bg-zinc-500/10 text-gray-700 dark:text-zinc-300' },
  'saml-sso': { icon: <ShieldCheckIcon className="w-4 h-4" />, color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500' },
  'magic-link': { icon: <KeyIcon className="w-4 h-4" />, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' },
  'sms-otp': { icon: <SmartphoneIcon className="w-4 h-4" />, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' },
}

const FALLBACK_PROVIDERS: AuthProvider[] = [
  { id: 'default-email', providerName: 'email-password', displayName: 'Email & Password', isEnabled: true },
  { id: 'default-google', providerName: 'google-oauth', displayName: 'Google OAuth', isEnabled: false },
  { id: 'default-github', providerName: 'github-oauth', displayName: 'GitHub OAuth', isEnabled: false },
  { id: 'default-saml', providerName: 'saml-sso', displayName: 'SAML / SSO', isEnabled: false },
  { id: 'default-magic', providerName: 'magic-link', displayName: 'Magic Link', isEnabled: false },
  { id: 'default-sms', providerName: 'sms-otp', displayName: 'SMS OTP', isEnabled: false },
]

export default function AuthMethodsConfigDrawer({ isOpen, onClose, appId, appName }: AuthMethodsConfigDrawerProps) {
  const [useDefault, setUseDefault] = useState(true)
  const [providers, setProviders] = useState<AuthProvider[]>(FALLBACK_PROVIDERS)
  const [defaultProviders, setDefaultProviders] = useState<AuthProvider[]>(FALLBACK_PROVIDERS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (isOpen && appId) loadData()
  }, [isOpen, appId])

  const mergeWithFallbacks = (apiProviders: AuthProvider[]): AuthProvider[] => {
    if (!apiProviders || apiProviders.length === 0) return FALLBACK_PROVIDERS
    // Merge: keep API providers, add any missing fallback methods
    const merged = [...apiProviders]
    for (const fb of FALLBACK_PROVIDERS) {
      if (!merged.find(p => p.providerName === fb.providerName)) {
        merged.push(fb)
      }
    }
    return merged
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getAppConfigOverride(appId, 'auth')
      setUseDefault(res.useDefault)

      // Load defaults, merge with fallbacks so we always show known methods
      const defaults = await adminService.getDefaultAuthMethods()
      const mergedDefaults = mergeWithFallbacks(defaults.methods || [])
      setDefaultProviders(mergedDefaults)

      if (!res.useDefault && res.config) {
        setProviders(mergeWithFallbacks(res.config))
      } else {
        setProviders(mergedDefaults)
      }
    } catch (err) {
      console.error('Failed to load app auth config:', err)
      // On error, still show the fallback defaults
      setDefaultProviders(FALLBACK_PROVIDERS)
      setProviders(FALLBACK_PROVIDERS)
    } finally {
      setLoading(false)
    }
  }

  const toggleUseDefault = async (val: boolean) => {
    setUseDefault(val)
    if (val) {
      try {
        await adminService.deleteAppConfig(appId, 'auth')
        setProviders(defaultProviders)
      } catch (err) {
        console.error('Failed to revert to default:', err)
      }
    }
  }

  const toggleProvider = (providerName: string) => {
    setProviders(prev => prev.map(p => p.providerName === providerName ? { ...p, isEnabled: !p.isEnabled } : p))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
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
              {/* Toggle */}
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <button className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${useDefault ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`} onClick={() => toggleUseDefault(true)}>Use Default</button>
                <button className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${!useDefault ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`} onClick={() => toggleUseDefault(false)}>Individual</button>
              </div>

              {/* OAuth Guides */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Authorized Redirect URIs Guide</p>
                  </div>
                  <ul className="text-xs text-blue-800/90 dark:text-blue-300/90 space-y-1.5 list-disc pl-4">
                    <li>Add every callback URL used by web, mobile web, and app deep link flows.</li>
                    <li>Redirect URI must be an exact string match (scheme, host, path, trailing slash).</li>
                    <li>Use HTTPS in production and separate dev/staging/prod callback URLs.</li>
                    <li>Use the same redirect URI in both authorize and token requests.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Common OAuth Setup Guide</p>
                  </div>
                  <ul className="text-xs text-amber-800/90 dark:text-amber-300/90 space-y-1.5 list-disc pl-4">
                    <li>Public clients should use PKCE and must not store client secrets in frontend code.</li>
                    <li>Confidential clients should exchange tokens on backend and keep client secret server-side.</li>
                    <li>If login fails with invalid redirect URI, verify authorized URI list and exact callback value.</li>
                    <li>If token exchange fails, verify code_verifier (PKCE), client type, and secret requirements.</li>
                  </ul>
                </div>
              </div>

              {useDefault ? (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Using Platform Defaults</p>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-[10px] font-bold text-blue-600 uppercase tracking-tight rounded">Global</span>
                  </div>
                  <div className="space-y-2">
                    {defaultProviders.map(p => {
                      const meta = PROVIDER_META[p.providerName]
                      return (
                        <div key={p.providerName} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-7 h-7 rounded-md ${meta?.color || 'bg-gray-50 text-gray-500'} flex items-center justify-center`}>{meta?.icon || <CogIcon className="w-4 h-4" />}</div>
                            <span className="text-sm text-gray-700 dark:text-zinc-300">{p.displayName}</span>
                          </div>
                          {p.isEnabled ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <XCircleIcon className="w-4 h-4 text-gray-300 dark:text-zinc-600" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Individual Overrides</h3>
                    <span className="text-[10px] text-gray-400 italic">Adjust individual methods from base</span>
                  </div>
                  <div className="space-y-3">
                    {providers.map(p => {
                      const meta = PROVIDER_META[p.providerName]
                      const defaultP = defaultProviders.find(dp => dp.providerName === p.providerName)
                      const isOverridden = JSON.stringify(p) !== JSON.stringify(defaultP)
                      
                      return (
                        <div key={p.providerName} className={`p-4 rounded-xl border transition-all ${isOverridden ? 'border-blue-500/30 bg-blue-500/5 shadow-sm' : 'border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-9 h-9 rounded-lg ${meta?.color || 'bg-gray-50 text-gray-500'} flex items-center justify-center shadow-sm`}>{meta?.icon || <CogIcon className="w-5 h-5" />}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.displayName}</span>
                                  {isOverridden && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-[9px] font-bold text-blue-600 uppercase rounded">Custom</span>}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">
                                  {isOverridden ? 'Configuration overridden for this app' : 'Inheriting system default settings'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" title={`${p.displayName} enabled`} className="sr-only peer" checked={p.isEnabled} onChange={() => toggleProvider(p.providerName)} />
                                <div className="w-10 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                              </label>
                            </div>
                          </div>
                          
                          {/* Expanded Config */}
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50 space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Client ID</label>
                                <input 
                                  type="text" 
                                  value={p.clientId || ''} 
                                  placeholder={defaultP?.clientId || 'Enter client id...'}
                                  onChange={(e) => {
                                    setProviders(prev => prev.map(item => item.providerName === p.providerName ? { ...item, clientId: e.target.value } : item))
                                  }}
                                  className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-1">
                              {isOverridden ? (
                                <button 
                                  onClick={() => {
                                    if (defaultP) setProviders(prev => prev.map(item => item.providerName === p.providerName ? { ...defaultP } : item))
                                  }}
                                  className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                  <RotateCcwIcon className="w-3 h-3" />
                                  Reset to Default
                                </button>
                              ) : (
                                <div />
                              )}
                              <span className="text-[10px] text-gray-400">
                                {p.isEnabled ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!useDefault && !loading && (
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
