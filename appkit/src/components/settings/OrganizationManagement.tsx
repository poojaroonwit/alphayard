'use client'

import React, { useState, useEffect } from 'react'
import { authService } from '@/services/authService'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface OrgData {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken()
  const res = await fetch(`/api/v1/admin${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function OrganizationManagement() {
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [slugManual, setSlugManual] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load current user's primary org
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const meRes = await apiFetch<{ organizations: OrgData[] }>('/auth/me/organization')
        const orgs = meRes.organizations ?? []
        const primary = orgs.find((o: any) => o.isPrimary) ?? orgs[0]
        if (!primary) {
          setError('No organization found. Complete onboarding first.')
          setLoading(false)
          return
        }
        setOrg(primary)
        setName(primary.name)
        setSlug(primary.slug)
        setDescription(primary.description ?? '')
        setSlugManual(true) // existing — don't auto-derive
      } catch (e: any) {
        setError(e.message || 'Failed to load organization')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Auto-derive slug from name when editing a new name (only if user hasn't manually edited slug)
  useEffect(() => {
    if (!slugManual && name) setSlug(toSlug(name))
  }, [name, slugManual])

  const handleSave = async () => {
    if (!org) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const updated = await apiFetch<{ organization: OrgData }>(`/organizations/${org.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), slug, description: description.trim() || null }),
      })
      setOrg(updated.organization)
      setSaveMsg({ type: 'success', text: 'Organization updated successfully.' })
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message || 'Failed to save changes.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Organization Settings</h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            These are the details set when your organization was created. Changes here update your org profile across the platform.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 dark:ring-zinc-800">
          <CardBody className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
              <div>
                <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Organization Name</Label>
                <p className="text-[10px] text-gray-400 mt-0.5">Display name of your organization.</p>
              </div>
              <Input
                value={name}
                onChange={e => { setName(e.target.value); setSlugManual(false) }}
                placeholder="My Organization"
                className="bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start border-t border-gray-100 dark:border-zinc-800 pt-5">
              <div>
                <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Slug</Label>
                <p className="text-[10px] text-gray-400 mt-0.5">URL-safe identifier. Must be unique.</p>
              </div>
              <div className="relative">
                <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={slug}
                  onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugManual(true) }}
                  placeholder="my-organization"
                  className="pl-10 bg-white dark:bg-zinc-900 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start border-t border-gray-100 dark:border-zinc-800 pt-5">
              <div>
                <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Description</Label>
                <p className="text-[10px] text-gray-400 mt-0.5">Optional short description.</p>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does your organization do?"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-center border-t border-gray-100 dark:border-zinc-800 pt-5">
              <div>
                <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Status</Label>
                <p className="text-[10px] text-gray-400 mt-0.5">Account standing.</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                <span className="text-sm text-gray-700 dark:text-zinc-300">{org?.isActive ? 'Active' : 'Inactive'}</span>
                <span className={`px-2.5 py-0.5 text-white text-[10px] font-bold rounded-full uppercase tracking-wider ${org?.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                  {org?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {org?.id && (
              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start border-t border-gray-100 dark:border-zinc-800 pt-5">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Details</Label>
                </div>
                <div className="text-xs text-gray-400 dark:text-zinc-500 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Organization ID</span>
                    <span className="font-mono text-gray-600 dark:text-zinc-300">{org.id.slice(0, 8)}…</span>
                  </div>
                  {org.createdAt && (
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <span className="text-gray-600 dark:text-zinc-300">{new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Save feedback */}
      {saveMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          saveMsg.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
        }`}>
          {saveMsg.type === 'success'
            ? <CheckCircleIcon className="w-4 h-4 shrink-0" />
            : <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />}
          {saveMsg.text}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          className="dark:bg-zinc-800 dark:border-zinc-700"
          onClick={() => {
            if (org) { setName(org.name); setSlug(org.slug); setDescription(org.description ?? ''); setSlugManual(true); setSaveMsg(null) }
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          onClick={handleSave}
          disabled={saving || !name.trim() || !slug.trim()}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
