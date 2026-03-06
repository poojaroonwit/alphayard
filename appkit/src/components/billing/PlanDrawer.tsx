'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { billingService, SubscriptionPlan } from '@/services/billingService'
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// ── Standard feature catalog ──────────────────────────────────────────────────
export const STANDARD_FEATURES: { key: string; label: string; description: string }[] = [
  { key: 'chat', label: 'Chat & Messaging', description: 'Direct messages and group chat' },
  { key: 'circles', label: 'Circles / Groups', description: 'Create and join social circles' },
  { key: 'video_calls', label: 'Video Calls', description: 'In-app video calling' },
  { key: 'voice_calls', label: 'Voice Calls', description: 'In-app voice calling' },
  { key: 'push_notifications', label: 'Push Notifications', description: 'Mobile push notifications' },
  { key: 'analytics', label: 'Analytics', description: 'Usage analytics & insights' },
  { key: 'api_access', label: 'API Access', description: 'Third-party API integrations' },
  { key: 'custom_domain', label: 'Custom Domain', description: 'White-label custom domain' },
  { key: 'social_features', label: 'Social Features', description: 'Likes, comments, follows' },
  { key: 'file_uploads', label: 'File Uploads', description: 'Upload images and files' },
  { key: 'advanced_search', label: 'Advanced Search', description: 'Full-text search across content' },
  { key: 'export_data', label: 'Data Export', description: 'Export user data and reports' },
]

// ── Standard limits catalog ──────────────────────────────────────────────────
const STANDARD_LIMITS: { key: string; label: string; unit: string }[] = [
  { key: 'maxUsers', label: 'Max Users', unit: 'users' },
  { key: 'maxCircles', label: 'Max Circles', unit: 'circles' },
  { key: 'storageGB', label: 'Storage', unit: 'GB' },
  { key: 'apiRequestsPerDay', label: 'API Requests / Day', unit: 'req/day' },
  { key: 'maxFileUploadMB', label: 'Max File Upload', unit: 'MB' },
  { key: 'maxVideoCallMinutes', label: 'Video Call Minutes / Month', unit: 'min/mo' },
]

// ─────────────────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface PlanDrawerProps {
  plan: SubscriptionPlan | null // null = create mode
  applications: { id: string; name: string }[]
  onClose: () => void
  onSaved: (plan: SubscriptionPlan) => void
  onDeleted?: (id: string) => void
}

export function PlanDrawer({ plan, applications, onClose, onSaved, onDeleted }: PlanDrawerProps) {
  const isEdit = !!plan

  // Basic fields
  const [name, setName] = useState(plan?.name ?? '')
  const [slug, setSlug] = useState(plan?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!plan)
  const [description, setDescription] = useState(plan?.description ?? '')
  const [applicationId, setApplicationId] = useState(plan?.applicationId ?? '')
  const [currency, setCurrency] = useState(plan?.currency ?? 'USD')
  const [priceMonthly, setPriceMonthly] = useState(plan?.priceMonthly ?? '')
  const [priceYearly, setPriceYearly] = useState(plan?.priceYearly ?? '')
  const [trialDays, setTrialDays] = useState(String(plan?.trialDays ?? 0))
  const [sortOrder, setSortOrder] = useState(String(plan?.sortOrder ?? 0))
  const [isActive, setIsActive] = useState(plan?.isActive ?? true)
  const [isPublic, setIsPublic] = useState(plan?.isPublic ?? true)
  const [stripePriceIdMonthly, setStripePriceIdMonthly] = useState(plan?.stripePriceIdMonthly ?? '')
  const [stripePriceIdYearly, setStripePriceIdYearly] = useState(plan?.stripePriceIdYearly ?? '')

  // Features (string[])
  const [features, setFeatures] = useState<string[]>(plan?.features ?? [])
  const [customFeature, setCustomFeature] = useState('')

  // Limits (Record<string, number | null>)
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    if (plan?.limits) {
      Object.entries(plan.limits).forEach(([k, v]) => { init[k] = v != null ? String(v) : '' })
    }
    return init
  })
  const [customLimitKey, setCustomLimitKey] = useState('')
  const [customLimitValue, setCustomLimitValue] = useState('')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Auto-derive slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(toSlug(name))
    }
  }, [name, slugManuallyEdited])

  const toggleFeature = (key: string) => {
    setFeatures(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const addCustomFeature = () => {
    const key = customFeature.trim().toLowerCase().replace(/\s+/g, '_')
    if (!key || features.includes(key)) return
    setFeatures(prev => [...prev, key])
    setCustomFeature('')
  }

  const setLimit = (key: string, value: string) => {
    setLimits(prev => ({ ...prev, [key]: value }))
  }

  const addCustomLimit = () => {
    const key = customLimitKey.trim().toLowerCase().replace(/\s+/g, '')
    if (!key || key in limits) return
    setLimits(prev => ({ ...prev, [key]: customLimitValue }))
    setCustomLimitKey('')
    setCustomLimitValue('')
  }

  const removeLimit = (key: string) => {
    setLimits(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const buildPayload = useCallback(() => {
    const parsedLimits: Record<string, number | null> = {}
    Object.entries(limits).forEach(([k, v]) => {
      parsedLimits[k] = v !== '' ? Number(v) : null
    })
    return {
      applicationId: applicationId || null,
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      priceMonthly: priceMonthly !== '' ? Number(priceMonthly) : null,
      priceYearly: priceYearly !== '' ? Number(priceYearly) : null,
      currency,
      features,
      limits: parsedLimits,
      isActive,
      isPublic,
      trialDays: Number(trialDays) || 0,
      sortOrder: Number(sortOrder) || 0,
      stripePriceIdMonthly: stripePriceIdMonthly || null,
      stripePriceIdYearly: stripePriceIdYearly || null,
    }
  }, [
    applicationId, name, slug, description, priceMonthly, priceYearly, currency,
    features, limits, isActive, isPublic, trialDays, sortOrder,
    stripePriceIdMonthly, stripePriceIdYearly,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Plan name is required'); return }
    setError('')
    setSubmitting(true)
    try {
      let saved: SubscriptionPlan
      if (isEdit && plan) {
        const res = await billingService.updatePlan(plan.id, buildPayload())
        saved = res.plan
      } else {
        const res = await billingService.createPlan(buildPayload() as any)
        saved = res.plan
      }
      setSuccess(isEdit ? 'Plan updated!' : 'Plan created!')
      setTimeout(() => { onSaved(saved) }, 700)
    } catch (e: any) {
      setError(e.message || 'Failed to save plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!plan) return
    setDeleting(true)
    try {
      const res = await billingService.deletePlan(plan.id)
      setSuccess(res.message)
      setTimeout(() => { onDeleted?.(plan.id) }, 700)
    } catch (e: any) {
      setError(e.message || 'Failed to delete plan')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  // Standard limits not yet in the limits state
  const unusedStandardLimits = STANDARD_LIMITS.filter(l => !(l.key in limits))
  const customLimitKeys = Object.keys(limits).filter(k => !STANDARD_LIMITS.find(l => l.key === k))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Plan' : 'New Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 space-y-8">
          {/* ── Basic Info ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-zinc-800">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Plan Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Pro, Starter, Enterprise"
                  className={inputCls}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
                  placeholder="e.g. pro"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Application</label>
                <select
                  value={applicationId}
                  onChange={e => setApplicationId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">— Global (all apps) —</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What's included in this plan?"
                  className={inputCls + ' resize-none'}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
                <input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Trial Days</label>
                <input type="number" min={0} value={trialDays} onChange={e => setTrialDays(e.target.value)} className={inputCls} placeholder="0" />
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Publicly visible</span>
              </label>
            </div>
          </section>

          {/* ── Pricing ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-zinc-800">
              Pricing
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectCls}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="THB">THB</option>
                  <option value="JPY">JPY</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Monthly Price</label>
                <input type="number" min={0} step="0.01" value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} placeholder="9.99" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Yearly Price</label>
                <input type="number" min={0} step="0.01" value={priceYearly} onChange={e => setPriceYearly(e.target.value)} placeholder="99.00" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stripe Monthly Price ID</label>
                <input type="text" value={stripePriceIdMonthly} onChange={e => setStripePriceIdMonthly(e.target.value)} placeholder="price_..." className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stripe Yearly Price ID</label>
                <input type="text" value={stripePriceIdYearly} onChange={e => setStripePriceIdYearly(e.target.value)} placeholder="price_..." className={inputCls} />
              </div>
            </div>
          </section>

          {/* ── Features / Permissions ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 pb-2 border-b border-gray-100 dark:border-zinc-800">
              Features & Permissions
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Select which app capabilities users on this plan can access.</p>

            <div className="grid grid-cols-2 gap-2">
              {STANDARD_FEATURES.map(f => {
                const enabled = features.includes(f.key)
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFeature(f.key)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      enabled
                        ? 'border-blue-300 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/10'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      enabled ? 'bg-blue-600 border-blue-600' : 'border-gray-400 dark:border-zinc-500'
                    }`}>
                      {enabled && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{f.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">{f.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom features already added (not in standard list) */}
            {features.filter(f => !STANDARD_FEATURES.find(sf => sf.key === f)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {features
                  .filter(f => !STANDARD_FEATURES.find(sf => sf.key === f))
                  .map(f => (
                    <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-full text-xs text-purple-700 dark:text-purple-300 font-mono">
                      {f}
                      <button type="button" onClick={() => toggleFeature(f)} className="hover:text-red-500">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Add custom feature */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customFeature}
                onChange={e => setCustomFeature(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                placeholder="Custom feature key (e.g. sms_gateway)"
                className={inputCls + ' flex-1 text-xs font-mono'}
              />
              <button type="button" onClick={addCustomFeature} className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors">
                Add
              </button>
            </div>
          </section>

          {/* ── Usage Limits ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 pb-2 border-b border-gray-100 dark:border-zinc-800">
              Usage Limits
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Set numeric caps. Leave blank for unlimited.</p>

            <div className="space-y-2">
              {/* Standard limits that are already set */}
              {STANDARD_LIMITS.filter(l => l.key in limits).map(l => (
                <div key={l.key} className="flex items-center gap-3">
                  <label className="w-44 text-xs text-gray-700 dark:text-gray-300 shrink-0">{l.label}</label>
                  <input
                    type="number"
                    min={0}
                    value={limits[l.key] ?? ''}
                    onChange={e => setLimit(l.key, e.target.value)}
                    placeholder={`Unlimited`}
                    className={inputCls + ' flex-1'}
                  />
                  <span className="text-xs text-gray-400 w-16 shrink-0">{l.unit}</span>
                  <button type="button" onClick={() => removeLimit(l.key)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Custom limits */}
              {customLimitKeys.map(key => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-44 text-xs font-mono text-purple-700 dark:text-purple-300 shrink-0">{key}</label>
                  <input
                    type="number"
                    min={0}
                    value={limits[key] ?? ''}
                    onChange={e => setLimit(key, e.target.value)}
                    placeholder="Unlimited"
                    className={inputCls + ' flex-1'}
                  />
                  <span className="text-xs text-gray-400 w-16 shrink-0">custom</span>
                  <button type="button" onClick={() => removeLimit(key)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick-add standard limits */}
            {unusedStandardLimits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {unusedStandardLimits.map(l => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setLimit(l.key, '')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-600 rounded-full text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" />
                    {l.label}
                  </button>
                ))}
              </div>
            )}

            {/* Custom limit */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customLimitKey}
                onChange={e => setCustomLimitKey(e.target.value)}
                placeholder="Custom key (e.g. maxProjects)"
                className={inputCls + ' flex-1 text-xs font-mono'}
              />
              <input
                type="number"
                min={0}
                value={customLimitValue}
                onChange={e => setCustomLimitValue(e.target.value)}
                placeholder="Value"
                className={inputCls + ' w-28'}
              />
              <button type="button" onClick={addCustomLimit} className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors">
                Add
              </button>
            </div>
          </section>

          {/* ── Error / Success ── */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-2 pb-4">
            {isEdit && onDeleted && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 dark:text-red-400">Confirm delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete plan
                </button>
              )
            )}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Shared input class helpers
const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

const selectCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
