'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { KeyIcon, TrashIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ApiKeyItem {
  id: string
  name: string
  key: string
  created: string
  status: 'Active' | 'Revoked'
}

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/v1/admin/system/config/api-keys', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to load API keys')
        const data = await res.json()
        setKeys(Array.isArray(data?.config?.keys) ? data.config.keys : [])
      } catch (err) {
        console.error(err)
        setMessage('Failed to load API keys')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async (next: ApiKeyItem[]) => {
    try {
      setSaving(true)
      setKeys(next)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/config/api-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: { keys: next } }),
      })
      if (!res.ok) throw new Error('Failed to save API keys')
      setMessage('Saved!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('Failed to save API keys')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const generateNewKey = () => {
    const raw = `ak_live_${Math.random().toString(36).slice(2, 18)}`
    const masked = `${raw.slice(0, 8)}••••••••${raw.slice(-4)}`
    const next: ApiKeyItem[] = [
      {
        id: crypto.randomUUID(),
        name: `API Key ${keys.length + 1}`,
        key: masked,
        created: new Date().toISOString().split('T')[0],
        status: 'Active',
      },
      ...keys,
    ]
    save(next)
    toast({ title: 'API Key Created', description: `New API key generated: ${masked}`, variant: 'success' })
  }

  const removeKey = (id: string) => {
    const next = keys.filter((item) => item.id !== id)
    save(next)
    toast({ title: 'API Key Removed', description: 'The API key has been permanently deleted.', variant: 'success' })
  }

  const rotateKey = (id: string) => {
    const next = keys.map((item) =>
      item.id === id
        ? {
            ...item,
            key: `ak_live_${Math.random().toString(36).slice(2, 10)}••••••••${Math.random().toString(36).slice(2, 6)}`,
            created: new Date().toISOString().split('T')[0],
          }
        : item
    )
    save(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys & Access Tokens</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage API keys for programmatic access to AppKit.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        <div className="space-y-3">
          {keys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{apiKey.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{apiKey.created}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono mt-0.5">{apiKey.key}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {apiKey.status}
                </span>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => rotateKey(apiKey.id)}>Rotate</Button>
                <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeKey(apiKey.id)}>
                  <TrashIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {!loading && keys.length === 0 && (
            <p className="text-sm text-gray-500">No API keys yet.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {message && <span className={`text-xs font-medium ${message === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{message}</span>}
          <Button variant="outline" className="text-sm" onClick={generateNewKey} disabled={saving || loading}>
            <KeyIcon className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Generate New API Key'}
          </Button>
        </div>
      </div>
    </div>
  )
}
