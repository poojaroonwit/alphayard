'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ServerIcon, ArrowLeftIcon, Loader2Icon } from 'lucide-react'

export default function NewApplicationPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Application name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || '',
          isActive,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create application')
      }

      const appId = data?.application?.id
      if (!appId) {
        throw new Error('Server did not return application ID')
      }

      router.push(`/applications/${appId}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to create application')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push('/applications')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to applications
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
          <ServerIcon className="w-3.5 h-3.5" />
          <span>Step 1 of 1 · Basic details</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a new application</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Give your application a name and optional slug. You can configure environments, billing, and advanced settings after creation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-6 space-y-6"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
            Application Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My Mobile App"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            This is how your app will appear in the admin console and Boundary.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide flex items-center justify-between">
            App Slug
            <span className="text-[10px] font-normal text-gray-400 dark:text-zinc-500">Optional</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-[11px] text-gray-500 dark:text-zinc-400 select-none">
              https://
            </span>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="my-app"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-[11px] text-gray-500 dark:text-zinc-400 select-none">
              .appkit.com
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            Leave blank to auto-generate from the name.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide flex items-center justify-between">
            Description
            <span className="text-[10px] font-normal text-gray-400 dark:text-zinc-500">Optional</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description of what this application is used for."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Mark application as active</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/applications')}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-1.5 text-xs font-medium rounded-lg shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <>
                  <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Application'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

