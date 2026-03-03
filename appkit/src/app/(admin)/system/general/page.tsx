'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ColorPickerPopover, toColorValue } from '@/components/ui/ColorPickerPopover'
import { useToast } from '@/hooks/use-toast'

export default function GeneralSettingsPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState({
    platformName: 'AppKit',
    supportEmail: 'support@appkit.io',
    timezone: 'UTC',
    language: 'English',
    appkitLogoUrl: '',
    loginBackground: toColorValue('#FFFFFF'),
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/v1/admin/system/config/general', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to load settings')
        const data = await res.json()
        if (data?.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            loginBackground: toColorValue(data.config.loginBackground || '#FFFFFF'),
          }))
        }
      } catch (err) {
        console.error(err)
        setMessage('Failed to load settings')
        toast({ title: 'Load failed', description: 'Could not load general settings.', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/config/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setMessage('Saved!')
      toast({ title: 'Saved', description: 'General settings updated.', variant: 'success' })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('Failed to save')
      toast({ title: 'Save failed', description: 'Could not save general settings.', variant: 'destructive' })
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure your AppKit platform settings.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Platform Name</label>
            <input
              type="text"
              title="Platform name"
              placeholder="AppKit"
              value={config.platformName}
              onChange={(e) => setConfig((prev) => ({ ...prev, platformName: e.target.value }))}
              className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Support Email</label>
            <input
              type="email"
              title="Support email"
              placeholder="support@appkit.io"
              value={config.supportEmail}
              onChange={(e) => setConfig((prev) => ({ ...prev, supportEmail: e.target.value }))}
              className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Default Timezone</label>
            <select
              title="Default timezone"
              value={config.timezone}
              onChange={(e) => setConfig((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Bangkok">Asia/Bangkok</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Default Language</label>
            <select
              title="Default language"
              value={config.language}
              onChange={(e) => setConfig((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="English">English</option>
              <option value="Thai">Thai</option>
              <option value="Japanese">Japanese</option>
              <option value="Chinese (Simplified)">Chinese (Simplified)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">AppKit Logo</label>
            <div className="flex items-center gap-4 max-w-md">
              {config.appkitLogoUrl && (
                <img src={config.appkitLogoUrl} alt="Logo preview" className="w-16 h-16 rounded-lg object-contain border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  title="Upload logo"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      setConfig((prev) => ({ ...prev, appkitLogoUrl: ev.target?.result as string }))
                    }
                    reader.readAsDataURL(file)
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-500/10 dark:file:text-blue-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, SVG up to 2MB</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Login Background</label>
            <div className="max-w-md">
              <ColorPickerPopover
                value={config.loginBackground as any}
                onChange={(value) => setConfig((prev) => ({ ...prev, loginBackground: value as any }))}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">Supports solid color, gradient, and image backgrounds.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {message && <span className={`text-xs font-medium ${message === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{message}</span>}
            <Button onClick={handleSave} disabled={saving || loading} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
