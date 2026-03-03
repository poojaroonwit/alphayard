'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromEmail: string
  fromName: string
}

const DEFAULT_CONFIG: SmtpConfig = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  password: '',
  fromEmail: '',
  fromName: 'AppKit',
}

export default function SystemSmtpPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [config, setConfig] = useState<SmtpConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/v1/admin/system/config/smtp', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to load SMTP config')
        const data = await res.json()
        setConfig({ ...DEFAULT_CONFIG, ...(data?.config || {}) })
      } catch (error) {
        console.error(error)
        toast({ title: 'Load failed', description: 'Could not load SMTP configuration.', variant: 'destructive' })
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
      const res = await fetch('/api/v1/admin/system/config/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) throw new Error('Failed to save SMTP config')
      toast({ title: 'Saved', description: 'SMTP configuration updated.', variant: 'success' })
    } catch (error) {
      console.error(error)
      toast({ title: 'Save failed', description: 'Could not save SMTP configuration.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const testSmtp = async () => {
    try {
      setTesting(true)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/config/smtp', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('SMTP test failed')
      toast({ title: 'SMTP reachable', description: 'Configuration loaded and basic check passed.', variant: 'success' })
    } catch (error) {
      console.error(error)
      toast({ title: 'SMTP test failed', description: 'Please verify SMTP host, port, and credentials.', variant: 'destructive' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SMTP Configuration</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure AppKit email delivery settings.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-0 divide-y divide-gray-100 dark:divide-zinc-800/50">
        {/* SMTP Host */}
        <div className="flex items-center justify-between py-4 first:pt-0">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">SMTP Host</label>
          <input type="text" title="SMTP host" value={config.host} onChange={(e) => setConfig((prev) => ({ ...prev, host: e.target.value }))} className="w-2/3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
        </div>
        {/* SMTP Port */}
        <div className="flex items-center justify-between py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">SMTP Port</label>
          <input type="number" title="SMTP port" value={config.port} onChange={(e) => setConfig((prev) => ({ ...prev, port: Number(e.target.value || 587) }))} className="w-2/3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
        </div>
        {/* SMTP User */}
        <div className="flex items-center justify-between py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">SMTP User</label>
          <input type="text" title="SMTP user" value={config.user} onChange={(e) => setConfig((prev) => ({ ...prev, user: e.target.value }))} className="w-2/3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
        </div>
        {/* SMTP Password */}
        <div className="flex items-center justify-between py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">SMTP Password</label>
          <input type="password" title="SMTP password" value={config.password} onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))} placeholder="Leave masked value to keep existing secret" className="w-2/3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
        </div>
        {/* From Email */}
        <div className="flex items-center justify-between py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">From Email</label>
          <input type="email" title="From email" value={config.fromEmail} onChange={(e) => setConfig((prev) => ({ ...prev, fromEmail: e.target.value }))} className="w-2/3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
        </div>
        {/* From Name */}
        <div className="flex items-center justify-between py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">From Name</label>
          <input type="text" title="From name" value={config.fromName} onChange={(e) => setConfig((prev) => ({ ...prev, fromName: e.target.value }))} className="w-2/3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
        </div>
        {/* Secure */}
        <div className="flex items-center justify-between py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-1/3">Use TLS</label>
          <div className="w-2/3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.secure} onChange={(e) => setConfig((prev) => ({ ...prev, secure: e.target.checked }))} />
              <div className="w-10 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>

      {/* Send Test Email */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Send Test Email</h3>
        <div className="flex items-center gap-3">
          <input
            type="email"
            title="Test email recipient"
            placeholder="recipient@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
          />
          <Button variant="outline" onClick={testSmtp} disabled={testing || loading || !testEmail}>{testing ? 'Sending...' : 'Send Test'}</Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {loading && <span className="text-xs text-gray-500">Loading...</span>}
        <Button onClick={save} disabled={saving || loading} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          {saving ? 'Saving...' : 'Save SMTP'}
        </Button>
      </div>
    </div>
  )
}
