'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import {
  MailIcon,
  MessageSquareIcon,
  SmartphoneIcon,
  BellIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  SaveIcon,
  InfoIcon,
  SendIcon,
  Loader2Icon,
} from 'lucide-react'

interface CommProvider {
  id: string
  name: string
  type: string
  enabled: boolean
  settings: Record<string, any>
}

interface CommConfig {
  providers: CommProvider[]
  channels: { email: boolean; sms: boolean; push: boolean; inApp: boolean }
  smtpSettings?: { host: string; port: number; username: string; fromEmail: string; fromName: string; secure: boolean }
}

const PROVIDER_META: Record<string, { icon: React.ReactNode; color: string; desc: string; fields: { label: string; placeholder: string; type?: string; key: string }[] }> = {
  smtp: { icon: <MailIcon className="w-5 h-5" />, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500', desc: 'Email delivery via SMTP server', fields: [{ label: 'SMTP Host', placeholder: 'smtp.example.com', key: 'host' }, { label: 'SMTP Port', placeholder: '587', type: 'number', key: 'port' }, { label: 'Username', placeholder: 'smtp-username', key: 'username' }, { label: 'Password', placeholder: '••••••••', type: 'password', key: 'password' }, { label: 'From Email', placeholder: 'noreply@example.com', key: 'fromEmail' }, { label: 'From Name', placeholder: 'AppKit', key: 'fromName' }] },
  twilio: { icon: <SmartphoneIcon className="w-5 h-5" />, color: 'bg-red-50 dark:bg-red-500/10 text-red-500', desc: 'SMS delivery via Twilio', fields: [{ label: 'Account SID', placeholder: 'your-account-sid', key: 'accountSid' }, { label: 'Auth Token', placeholder: '••••••••', type: 'password', key: 'authToken' }, { label: 'From Number', placeholder: '+1234567890', key: 'fromNumber' }] },
  vonage: { icon: <MessageSquareIcon className="w-5 h-5" />, color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500', desc: 'SMS delivery via Vonage (Nexmo)', fields: [{ label: 'API Key', placeholder: 'your-api-key', key: 'apiKey' }, { label: 'API Secret', placeholder: '••••••••', type: 'password', key: 'apiSecret' }, { label: 'From Number', placeholder: '+1234567890', key: 'fromNumber' }] },
  firebase: { icon: <BellIcon className="w-5 h-5" />, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500', desc: 'Push notifications via Firebase', fields: [{ label: 'Project ID', placeholder: 'your-firebase-project-id', key: 'projectId' }, { label: 'Server Key', placeholder: '••••••••', type: 'password', key: 'serverKey' }] },
  apns: { icon: <SendIcon className="w-5 h-5" />, color: 'bg-gray-50 dark:bg-zinc-500/10 text-gray-700 dark:text-zinc-300', desc: 'Push notifications via Apple Push Notification service', fields: [{ label: 'Key ID', placeholder: 'your-key-id', key: 'keyId' }, { label: 'Team ID', placeholder: 'your-team-id', key: 'teamId' }, { label: 'Bundle ID', placeholder: 'com.example.app', key: 'bundleId' }] },
}

const FALLBACK_CONFIG: CommConfig = {
  providers: [
    { id: 'smtp', name: 'SMTP / Email', type: 'smtp', enabled: true, settings: {} },
    { id: 'twilio', name: 'Twilio SMS', type: 'twilio', enabled: false, settings: {} },
    { id: 'vonage', name: 'Vonage SMS', type: 'vonage', enabled: false, settings: {} },
    { id: 'firebase', name: 'Firebase Cloud Messaging', type: 'firebase', enabled: false, settings: {} },
    { id: 'apns', name: 'Apple Push (APNs)', type: 'apns', enabled: false, settings: {} },
  ],
  channels: { email: true, sms: false, push: true, inApp: true },
}

const emailTemplates = [
  { name: 'Welcome Email', desc: 'Sent when a new user registers', status: 'Active' },
  { name: 'Password Reset', desc: 'Password reset link email', status: 'Active' },
  { name: 'Email Verification', desc: 'Verify email address', status: 'Active' },
  { name: 'MFA Code', desc: 'Multi-factor authentication code', status: 'Active' },
  { name: 'Account Locked', desc: 'Account lockout notification', status: 'Draft' },
  { name: 'Plan Upgrade', desc: 'Subscription upgrade confirmation', status: 'Draft' },
]

export default function DefaultCommunicationPage() {
  const [config, setConfig] = useState<CommConfig>(FALLBACK_CONFIG)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getDefaultCommConfig()
      if (res.config) {
        setConfig(res.config)
      }
    } catch (err) {
      console.error('Failed to load comm config:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleProvider = (id: string) => {
    setConfig(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
    }))
  }

  const toggleChannel = (ch: keyof CommConfig['channels']) => {
    setConfig(prev => ({
      ...prev,
      channels: { ...prev.channels, [ch]: !prev.channels[ch] },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminService.saveDefaultCommConfig(config)
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
        <span className="ml-2 text-sm text-gray-500">Loading communication config...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure default communication providers and templates. Individual applications inherit these unless overridden.</p>
        </div>
        <div className="flex items-center space-x-2">
          {saveMessage && <span className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>{saveMessage}</span>}
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
          <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-0.5">These settings serve as the platform-wide defaults for all communication channels.</p>
        </div>
      </div>

      {/* Communication Providers */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><CogIcon className="w-4 h-4 mr-2 text-gray-400" />Communication Providers</h2>
        <div className="space-y-4">
          {config.providers.map(provider => {
            const meta = PROVIDER_META[provider.type] || { icon: <CogIcon className="w-5 h-5" />, color: 'bg-gray-50 text-gray-500', desc: provider.name, fields: [] }
            return (
              <div key={provider.id} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden transition-all">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center`}>{meta.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{meta.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {provider.enabled ? (
                      <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="w-4 h-4 mr-1" /> Enabled</span>
                    ) : (
                      <span className="flex items-center text-xs font-medium text-gray-400 dark:text-zinc-500"><XCircleIcon className="w-4 h-4 mr-1" /> Disabled</span>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={provider.enabled} onChange={() => toggleProvider(provider.id)} />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                    <button onClick={() => setExpandedId(expandedId === provider.id ? null : provider.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                      {expandedId === provider.id ? 'Collapse' : 'Configure'}
                    </button>
                  </div>
                </div>
                {expandedId === provider.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {meta.fields.map(field => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{field.label}</label>
                          <input
                            type={field.type || 'text'}
                            placeholder={field.placeholder}
                            defaultValue={provider.settings?.[field.key] || ''}
                            onChange={e => {
                              setConfig(prev => ({
                                ...prev,
                                providers: prev.providers.map(p => p.id === provider.id ? { ...p, settings: { ...p.settings, [field.key]: e.target.value } } : p),
                              }))
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
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

      {/* Email Templates */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><MailIcon className="w-4 h-4 mr-2 text-blue-500" />Default Email Templates</h2>
        <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {emailTemplates.map(template => (
              <div key={template.name} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{template.desc}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${template.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>{template.status}</span>
                  <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Channels */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><BellIcon className="w-4 h-4 mr-2 text-violet-500" />Default Notification Channels</h2>
        <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 space-y-2">
          {([
            { name: 'Email Notifications', key: 'email' as const },
            { name: 'SMS Notifications', key: 'sms' as const },
            { name: 'Push Notifications', key: 'push' as const },
            { name: 'In-App Notifications', key: 'inApp' as const },
          ]).map(ch => (
            <div key={ch.key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
              <span className="text-sm text-gray-700 dark:text-zinc-300">{ch.name}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.channels[ch.key]} onChange={() => toggleChannel(ch.key)} />
                <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
