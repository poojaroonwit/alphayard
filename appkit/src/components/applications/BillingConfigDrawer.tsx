'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import {
  XIcon,
  CreditCardIcon,
  SaveIcon,
  Loader2Icon,
  RotateCcwIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  DollarSignIcon,
  ShieldCheckIcon,
} from 'lucide-react'

interface BillingConfigDrawerProps {
  isOpen: boolean
  onClose: () => void
  appId: string
  appName: string
}

interface BillingConfig {
  enabled: boolean
  provider: string
  mode: 'test' | 'live'
  publicKey: string
  secretKey: string
  webhookSecret: string
  currency: string
  settings?: Record<string, any>
  providerConfig?: Record<string, Record<string, string>>
}

const BILLING_PROVIDERS = [
  {
    value: 'stripe',
    label: 'Stripe',
    fields: [
      { key: 'publicKey', label: 'Publishable Key', placeholder: 'pk_test_...', icon: <GlobeIcon className="w-3.5 h-3.5 text-gray-400" /> },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_test_...', secret: true, icon: <AlertCircleIcon className="w-3.5 h-3.5 text-gray-400" /> },
      { key: 'webhookSecret', label: 'Webhook Signing Secret', placeholder: 'whsec_...', secret: true, icon: <ShieldCheckIcon className="w-3.5 h-3.5 text-gray-400" /> },
    ],
  },
  {
    value: 'paypal',
    label: 'PayPal',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'AV2e...' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'EKj8...', secret: true },
      { key: 'webhookId', label: 'Webhook ID', placeholder: 'WH-...' },
    ],
  },
  {
    value: 'paddle',
    label: 'Paddle',
    fields: [
      { key: 'vendorId', label: 'Vendor ID', placeholder: '12345' },
      { key: 'apiKey', label: 'API Key', placeholder: 'xxxx...', secret: true },
      { key: 'publicKey', label: 'Public Key', placeholder: 'xxxx...' },
    ],
  },
  {
    value: 'lemonsqueezy',
    label: 'Lemon Squeezy',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'eyJ0...', secret: true },
      { key: 'storeId', label: 'Store ID', placeholder: '12345' },
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...', secret: true },
    ],
  },
]

const DEFAULT_BILLING_CONFIG: BillingConfig = {
  enabled: false,
  provider: 'stripe',
  mode: 'test',
  publicKey: '',
  secretKey: '',
  webhookSecret: '',
  currency: 'USD',
  settings: {},
  providerConfig: {},
}

export default function BillingConfigDrawer({ isOpen, onClose, appId, appName }: BillingConfigDrawerProps) {
  const [useDefault, setUseDefault] = useState(true)
  const [config, setConfig] = useState<BillingConfig>(DEFAULT_BILLING_CONFIG)
  const [defaultConfig, setDefaultConfig] = useState<BillingConfig>(DEFAULT_BILLING_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen && appId) loadData()
  }, [isOpen, appId])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getAppConfigOverride(appId, 'billing')
      setUseDefault(res.useDefault)

      // Get effective defaults from service
      const effectiveRes = await adminService.getAppConfigOverride('', 'billing')
      const systemDefaults = effectiveRes.config || DEFAULT_BILLING_CONFIG
      setDefaultConfig(systemDefaults)

      if (!res.useDefault && res.config) {
        setConfig({ ...DEFAULT_BILLING_CONFIG, ...res.config })
      } else {
        setConfig(systemDefaults)
      }
    } catch (err) {
      console.error('Failed to load app billing config:', err)
      setConfig(DEFAULT_BILLING_CONFIG)
    } finally {
      setLoading(false)
    }
  }

  const toggleUseDefault = async (val: boolean) => {
    setUseDefault(val)
    if (val) {
      try {
        await adminService.deleteAppConfig(appId, 'billing')
        setConfig(defaultConfig)
      } catch (err) {
        console.error('Failed to revert to default:', err)
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminService.saveAppConfig(appId, 'billing', config)
      setSaveMessage('Saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Failed to save billing config:', err)
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Billing & Subscriptions</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{appName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading configuration...</span>
            </div>
          ) : (
            <>
              {/* Type Switcher */}
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <button 
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${useDefault ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`} 
                  onClick={() => toggleUseDefault(true)}
                >
                  Use Global Defaults
                </button>
                <button 
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${!useDefault ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`} 
                  onClick={() => toggleUseDefault(false)}
                >
                  Individual App Credentials
                </button>
              </div>

              {/* Status Section */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Enable Payments</span>
                    {!useDefault && config.enabled !== defaultConfig.enabled && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-[9px] font-bold text-blue-600 uppercase rounded">Changed</span>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={config.enabled} 
                      disabled={useDefault}
                      onChange={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))} 
                    />
                    <div className="w-10 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Currency</div>
                  <select 
                    value={config.currency}
                    disabled={useDefault}
                    onChange={(e) => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                    className="px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    title="Currency"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="THB">THB (฿)</option>
                  </select>
                </div>
              </div>

              {/* Provider Selection + Configuration */}
              <div className={`space-y-4 ${!config.enabled && 'opacity-50 grayscale pointer-events-none'}`}>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Provider</h3>
                    {config.mode === 'test' ? (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-[9px] font-bold text-amber-600 uppercase rounded">Test Mode</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-[9px] font-bold text-emerald-600 uppercase rounded">Live Mode</span>
                    )}
                  </div>
                </div>

                {/* Provider Selector */}
                <div className="flex flex-wrap gap-2">
                  {BILLING_PROVIDERS.map(p => (
                    <button
                      key={p.value}
                      disabled={useDefault}
                      onClick={() => setConfig(prev => ({ ...prev, provider: p.value }))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        config.provider === p.value
                          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Mode Selector */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Operation Mode</label>
                    <div className="flex gap-2">
                      {['test', 'live'].map((m) => (
                        <button
                          key={m}
                          disabled={useDefault}
                          onClick={() => setConfig(prev => ({ ...prev, mode: m as any }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                            config.mode === m 
                              ? 'bg-white dark:bg-zinc-700 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'border-transparent text-gray-500 dark:text-zinc-500 hover:bg-white dark:hover:bg-zinc-800'
                          }`}
                        >
                          {m.charAt(0).toUpperCase() + m.slice(1)} Mode
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Provider Fields */}
                  {(() => {
                    const activeProvider = BILLING_PROVIDERS.find(p => p.value === config.provider)
                    if (!activeProvider) return null
                    const providerKey = config.provider
                    return (
                      <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-zinc-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{activeProvider.label} Credentials</p>
                        {activeProvider.fields.map(field => {
                          const fieldKey = `${providerKey}_${field.key}`
                          const isSecret = (field as any).secret
                          const isVisible = visibleSecrets[fieldKey]
                          return (
                            <div key={field.key}>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">{field.label}</label>
                              <div className="relative">
                                <input
                                  type={isSecret && !isVisible ? 'password' : 'text'}
                                  value={config.providerConfig?.[providerKey]?.[field.key] || ''}
                                  disabled={useDefault}
                                  placeholder={field.placeholder}
                                  onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    providerConfig: {
                                      ...prev.providerConfig,
                                      [providerKey]: {
                                        ...(prev.providerConfig?.[providerKey] || {}),
                                        [field.key]: e.target.value,
                                      },
                                    },
                                  }))}
                                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-10"
                                />
                                {isSecret && (
                                  <button
                                    onClick={() => setVisibleSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }))}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    title={isVisible ? 'Hide' : 'Show'}
                                  >
                                    {isVisible ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {!useDefault && (
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      onClick={() => setConfig(defaultConfig)}
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcwIcon className="w-3 h-3" />
                      Revert all fields to default
                    </button>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <CreditCardIcon className="w-3 h-3" />
                      {BILLING_PROVIDERS.find(p => p.value === config.provider)?.label || config.provider}
                    </div>
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20">
                <div className="flex gap-3">
                  <AlertCircleIcon className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">Security Recommendation</p>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-500/70 leading-relaxed">
                      Always use <strong>Test Mode</strong> credentials during development. Live keys should only be applied to production environments. Ensure your Webhook URL is correctly configured in your provider dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!useDefault && !loading && (
          <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saveMessage && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  saveMessage === 'Saved!' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                }`}>
                  {saveMessage === 'Saved!' ? <CheckCircle2Icon className="w-3.5 h-3.5" /> : <AlertCircleIcon className="w-3.5 h-3.5" />}
                  {saveMessage}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/20">
                {saving ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
                Update Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
