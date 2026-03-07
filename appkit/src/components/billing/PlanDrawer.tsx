'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { billingService, SubscriptionPlan } from '@/services/billingService'
import {
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

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
  fixedApplicationId?: string // when set, locks the applicationId and hides the picker
}

export function PlanDrawer({ plan, applications, onClose, onSaved, onDeleted, fixedApplicationId }: PlanDrawerProps) {
  const isEdit = !!plan

  const isStripeManaged =
    !!plan?.stripePriceIdMonthly ||
    !!plan?.stripePriceIdYearly ||
    !!plan?.stripeLookupKeyMonthly ||
    !!plan?.stripeLookupKeyYearly

  // Basic fields
  const [name, setName] = useState(plan?.name ?? '')
  const [slug, setSlug] = useState(plan?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!plan)
  const [description, setDescription] = useState(plan?.description ?? '')
  const [applicationId, setApplicationId] = useState(fixedApplicationId ?? plan?.applicationId ?? '')
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
      priceMonthly: priceMonthly !== '' ? String(priceMonthly) : null,
      priceYearly: priceYearly !== '' ? String(priceYearly) : null,
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
                  disabled={isStripeManaged}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => {
                    setSlug(e.target.value)
                    setSlugManuallyEdited(true)
                  }}
                  placeholder="e.g. pro"
                  className={inputCls}
                  disabled={isStripeManaged}
                />
              </div>

              {!fixedApplicationId && (
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
              )}

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

          {/* ── Pricing & Stripe ── */}
          <section>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pricing</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold">
                <svg viewBox="0 0 32 32" className="w-3 h-3" fill="currentColor"><path d="M14.33 10.09c0-.76.63-1.06 1.66-1.06 1.48 0 3.36.45 4.84 1.25V6.1a12.85 12.85 0 0 0-4.84-.89c-3.98 0-6.62 2.07-6.62 5.53 0 5.4 7.44 4.54 7.44 6.87 0 .9-.78 1.19-1.87 1.19-1.62 0-3.69-.67-5.33-1.57v4.22c1.81.78 3.64 1.1 5.33 1.1 4.06 0 6.85-2 6.85-5.5-.02-5.83-7.46-4.8-7.46-6.96z"/></svg>
                Stripe
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className={selectCls}
                  disabled={isStripeManaged}
                >
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
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceMonthly}
                  onChange={e => setPriceMonthly(e.target.value)}
                  placeholder="9.99"
                  className={inputCls}
                  disabled={isStripeManaged}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Yearly Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceYearly}
                  onChange={e => setPriceYearly(e.target.value)}
                  placeholder="99.00"
                  className={inputCls}
                  disabled={isStripeManaged}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/40">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stripe Price ID — Monthly</label>
                <input
                  type="text"
                  value={stripePriceIdMonthly}
                  onChange={e => setStripePriceIdMonthly(e.target.value)}
                  placeholder="price_..."
                  className={inputCls}
                  disabled={isStripeManaged}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stripe Price ID — Yearly</label>
                <input
                  type="text"
                  value={stripePriceIdYearly}
                  onChange={e => setStripePriceIdYearly(e.target.value)}
                  placeholder="price_..."
                  className={inputCls}
                  disabled={isStripeManaged}
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Stripe Lookup Key — Monthly
                  </label>
                  <input
                    type="text"
                    value={plan?.stripeLookupKeyMonthly ?? ''}
                    readOnly
                    placeholder="(from Stripe price.lookup_key)"
                    className={inputCls + ' bg-gray-50 dark:bg-zinc-800/70 cursor-default'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Stripe Lookup Key — Yearly
                  </label>
                  <input
                    type="text"
                    value={plan?.stripeLookupKeyYearly ?? ''}
                    readOnly
                    placeholder="(from Stripe price.lookup_key)"
                    className={inputCls + ' bg-gray-50 dark:bg-zinc-800/70 cursor-default'}
                  />
                </div>
              </div>
              <p className="col-span-2 text-[10px] text-indigo-500 dark:text-indigo-400">
                Plans and prices are created and managed in Stripe. This page reflects synced products/prices and lets you
                configure app-specific features and limits only.
              </p>
            </div>
          </section>

          {/* ── Features / Permissions ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 pb-2 border-b border-gray-100 dark:border-zinc-800">
              Features & Permissions
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Select which app capabilities users on this plan can access.</p>

            {/* All features as badges */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {features.map(f => (
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
              {/* All standard limits — always visible */}
              {STANDARD_LIMITS.map(l => (
                <div key={l.key} className="flex items-center gap-3">
                  <label className="w-44 text-xs text-gray-700 dark:text-gray-300 shrink-0">{l.label}</label>
                  <input
                    type="number"
                    min={0}
                    value={limits[l.key] ?? ''}
                    onChange={e => setLimit(l.key, e.target.value)}
                    placeholder="Unlimited"
                    className={inputCls + ' flex-1'}
                  />
                  <span className="text-xs text-gray-400 w-16 shrink-0">{l.unit}</span>
                  <div className="w-4 shrink-0" />
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
