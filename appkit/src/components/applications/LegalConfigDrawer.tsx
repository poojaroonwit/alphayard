'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import {
  XIcon,
  ScaleIcon,
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  SaveIcon,
  Loader2Icon,
} from 'lucide-react'

interface LegalConfigDrawerProps {
  isOpen: boolean
  onClose: () => void
  appId: string
  appName: string
}

interface LegalConfig {
  documents: { id: string; title: string; type: string; version: string; status: string; lastUpdated: string; url?: string }[]
  compliance: Record<string, boolean>
  retention: { userData: number; auditLog: number; sessionData: number }
}

const COMPLIANCE_ITEMS = [
  { key: 'gdprMode', name: 'GDPR Compliance' },
  { key: 'cookieConsent', name: 'Cookie Consent' },
  { key: 'dataRetention', name: 'Data Retention' },
  { key: 'rightToErasure', name: 'Right to Erasure' },
  { key: 'dataExport', name: 'Data Export' },
  { key: 'ageVerification', name: 'Age Verification' },
]

export default function LegalConfigDrawer({ isOpen, onClose, appId, appName }: LegalConfigDrawerProps) {
  const [useDefault, setUseDefault] = useState(true)
  const [config, setConfig] = useState<LegalConfig | null>(null)
  const [defaultConfig, setDefaultConfig] = useState<LegalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (isOpen && appId) loadData()
  }, [isOpen, appId])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getAppConfigOverride(appId, 'legal')
      setUseDefault(res.useDefault)

      const defaults = await adminService.getDefaultLegalConfig()
      setDefaultConfig(defaults.config)

      if (!res.useDefault && res.config) {
        setConfig(res.config)
      } else {
        setConfig(defaults.config)
      }
    } catch (err) {
      console.error('Failed to load app legal config:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleUseDefault = async (val: boolean) => {
    setUseDefault(val)
    if (val) {
      try {
        await adminService.deleteAppConfig(appId, 'legal')
        setConfig(defaultConfig)
      } catch (err) {
        console.error('Failed to revert to default:', err)
      }
    }
  }

  const toggleCompliance = (key: string) => {
    if (!config) return
    setConfig({ ...config, compliance: { ...config.compliance, [key]: !config.compliance[key] } })
  }

  const handleSave = async () => {
    if (!config) return
    try {
      setSaving(true)
      await adminService.saveAppConfig(appId, 'legal', config)
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Legal & Compliance Config</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{appName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500"><XIcon className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <button className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${useDefault ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`} onClick={() => toggleUseDefault(true)}>Use Default</button>
                <button className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${!useDefault ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`} onClick={() => toggleUseDefault(false)}>Individual</button>
              </div>

              {useDefault ? (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">Using Platform Defaults</p>
                  <div className="space-y-2">
                    {COMPLIANCE_ITEMS.map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700 dark:text-zinc-300">{item.name}</span>
                        {defaultConfig?.compliance[item.key] ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <XCircleIcon className="w-4 h-4 text-gray-300 dark:text-zinc-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : config ? (
                <div className="space-y-6">
                  {/* Compliance Toggles */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center"><ShieldIcon className="w-4 h-4 mr-2 text-violet-500" />Compliance Settings</h3>
                    <div className="space-y-2">
                      {COMPLIANCE_ITEMS.map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200/80 dark:border-zinc-800/80">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={config.compliance[item.key] ?? false} onChange={() => toggleCompliance(item.key)} />
                            <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Document URLs */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center"><ScaleIcon className="w-4 h-4 mr-2 text-blue-500" />Custom Document URLs</h3>
                    <div className="space-y-3">
                      {(config.documents || []).map(doc => (
                        <div key={doc.id}>
                          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">{doc.title} URL</label>
                          <input
                            type="url"
                            placeholder={`https://your-domain.com/${doc.type}`}
                            defaultValue={doc.url || ''}
                            onChange={e => {
                              setConfig(prev => prev ? { ...prev, documents: prev.documents.map(d => d.id === doc.id ? { ...d, url: e.target.value } : d) } : prev)
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

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
