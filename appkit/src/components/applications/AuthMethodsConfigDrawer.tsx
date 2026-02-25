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

export default function AuthMethodsConfigDrawer({ isOpen, onClose, appId, appName }: AuthMethodsConfigDrawerProps) {
  const [useDefault, setUseDefault] = useState(true)
  const [providers, setProviders] = useState<AuthProvider[]>([])
  const [defaultProviders, setDefaultProviders] = useState<AuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (isOpen && appId) loadData()
  }, [isOpen, appId])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getAppConfigOverride(appId, 'auth')
      setUseDefault(res.useDefault)

      // Also load the defaults for display
      const defaults = await adminService.getDefaultAuthMethods()
      setDefaultProviders(defaults.methods || [])

      if (!res.useDefault && res.config) {
        setProviders(res.config)
      } else {
        setProviders(defaults.methods || [])
      }
    } catch (err) {
      console.error('Failed to load app auth config:', err)
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
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auth Methods Config</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{appName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500"><XIcon className="w-5 h-5" /></button>
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

              {useDefault ? (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">Using Platform Defaults</p>
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
                <div className="space-y-3">
                  {providers.map(p => {
                    const meta = PROVIDER_META[p.providerName]
                    return (
                      <div key={p.providerName} className="flex items-center justify-between p-3 rounded-lg border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-md ${meta?.color || 'bg-gray-50 text-gray-500'} flex items-center justify-center`}>{meta?.icon || <CogIcon className="w-4 h-4" />}</div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{p.displayName}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={p.isEnabled} onChange={() => toggleProvider(p.providerName)} />
                          <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                      </div>
                    )
                  })}
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
