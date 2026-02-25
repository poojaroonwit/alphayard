'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import {
  ScaleIcon,
  FileTextIcon,
  ShieldIcon,
  GlobeIcon,
  SaveIcon,
  InfoIcon,
  PlusIcon,
  EditIcon,
  Loader2Icon,
} from 'lucide-react'

interface LegalDocument {
  id: string
  title: string
  type: string
  version: string
  status: 'Published' | 'Draft'
  lastUpdated: string
  url?: string
}

interface LegalConfig {
  documents: LegalDocument[]
  compliance: Record<string, boolean>
  retention: { userData: number; auditLog: number; sessionData: number }
}

const FALLBACK_CONFIG: LegalConfig = {
  documents: [
    { id: 'tos', title: 'Terms of Service', type: 'terms-of-service', version: 'v2.1', status: 'Published', lastUpdated: new Date().toISOString().split('T')[0] },
    { id: 'privacy', title: 'Privacy Policy', type: 'privacy-policy', version: 'v3.0', status: 'Published', lastUpdated: new Date().toISOString().split('T')[0] },
    { id: 'cookie', title: 'Cookie Policy', type: 'cookie-policy', version: 'v1.2', status: 'Draft', lastUpdated: new Date().toISOString().split('T')[0] },
    { id: 'dpa', title: 'Data Processing Agreement', type: 'dpa', version: 'v1.0', status: 'Published', lastUpdated: new Date().toISOString().split('T')[0] },
    { id: 'aup', title: 'Acceptable Use Policy', type: 'aup', version: 'v1.0', status: 'Draft', lastUpdated: new Date().toISOString().split('T')[0] },
  ],
  compliance: {
    gdprMode: true,
    cookieConsent: true,
    dataRetention: false,
    rightToErasure: true,
    dataExport: true,
    ageVerification: false,
  },
  retention: { userData: 365, auditLog: 90, sessionData: 30 },
}

export default function DefaultLegalPage() {
  const [config, setConfig] = useState<LegalConfig>(FALLBACK_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getDefaultLegalConfig()
      if (res.config) {
        setConfig(res.config)
      }
    } catch (err) {
      console.error('Failed to load legal config:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCompliance = (key: string) => {
    setConfig(prev => ({
      ...prev,
      compliance: { ...prev.compliance, [key]: !prev.compliance[key] },
    }))
  }

  const updateRetention = (key: keyof LegalConfig['retention'], value: number) => {
    setConfig(prev => ({
      ...prev,
      retention: { ...prev.retention, [key]: value },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminService.saveDefaultLegalConfig(config)
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
        <span className="ml-2 text-sm text-gray-500">Loading legal config...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal & Compliance</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage default legal documents and compliance settings. Individual applications inherit these unless overridden.</p>
        </div>
        <div className="flex items-center space-x-2">
          {saveMessage && <span className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>{saveMessage}</span>}
          <Button variant="outline"><PlusIcon className="w-4 h-4 mr-2" />Add Document</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">
            {saving ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
            Save Defaults
          </Button>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20">
        <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Default Configuration</p>
          <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-0.5">These legal documents serve as the platform-wide defaults. Each application can choose to use these defaults or upload individual documents.</p>
        </div>
      </div>

      {/* Legal Documents */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><FileTextIcon className="w-4 h-4 mr-2 text-gray-400" />Legal Documents</h2>
        <div className="space-y-3">
          {config.documents.map(doc => (
            <div key={doc.id} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center"><ScaleIcon className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400 dark:text-zinc-500">{doc.version}</span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">Updated: {doc.lastUpdated}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${doc.status === 'Published' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>{doc.status}</span>
                  <Button variant="ghost" size="sm" className="text-xs"><EditIcon className="w-3.5 h-3.5 mr-1" />Edit</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Settings */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><ShieldIcon className="w-4 h-4 mr-2 text-violet-500" />Compliance Settings</h2>
        <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 space-y-2">
          {[
            { key: 'gdprMode', name: 'GDPR Compliance Mode', desc: 'Enable GDPR-specific data handling requirements' },
            { key: 'cookieConsent', name: 'Cookie Consent Banner', desc: 'Show cookie consent banner to users' },
            { key: 'dataRetention', name: 'Data Retention Policy', desc: 'Automatically purge user data after retention period' },
            { key: 'rightToErasure', name: 'Right to Erasure', desc: 'Allow users to request data deletion' },
            { key: 'dataExport', name: 'Data Export', desc: 'Allow users to export their data' },
            { key: 'ageVerification', name: 'Age Verification', desc: 'Require age verification for new accounts' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.compliance[item.key] ?? false} onChange={() => toggleCompliance(item.key)} />
                <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Data Retention */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><GlobeIcon className="w-4 h-4 mr-2 text-emerald-500" />Data Retention Defaults</h2>
        <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'User Data Retention (days)', key: 'userData' as const },
              { label: 'Audit Log Retention (days)', key: 'auditLog' as const },
              { label: 'Session Data Retention (days)', key: 'sessionData' as const },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{field.label}</label>
                <input
                  type="number"
                  value={config.retention[field.key]}
                  onChange={e => updateRetention(field.key, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
