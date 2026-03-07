'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { billingService, SubscriptionPlan } from '@/services/billingService'
import { adminService } from '@/services/adminService'
import { PlanDrawer } from '@/components/billing/PlanDrawer'
import {
  CreditCardIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

function formatPrice(price: string | null, currency: string): string {
  if (price == null || price === '') return 'Free'
  const n = Number(price)
  if (n === 0) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n)
}

function PlanCard({
  plan,
  onClick,
}: {
  plan: SubscriptionPlan
  onClick: () => void
}) {
  const featuresEnabled = (plan.features ?? []).length
  const limitsCount = Object.keys(plan.limits ?? {}).length
  const subCount = plan._count?.subscriptions ?? 0

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {plan.name}
            </h3>
            {!plan.isPublic && (
              <span className="shrink-0 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-medium rounded">
                Private
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono mt-0.5">{plan.slug}</p>
        </div>
        <span className={`shrink-0 ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
          plan.isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
        }`}>
          {plan.isActive ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
          {plan.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* App badge */}
      <div className="flex items-center gap-1.5 mb-3">
        {plan.application ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
            {plan.application.name}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            <GlobeAltIcon className="w-3 h-3" />
            Global
          </span>
        )}
        {plan.trialDays > 0 && (
          <span className="text-[11px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full">
            {plan.trialDays}d trial
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {formatPrice(plan.priceMonthly, plan.currency)}
        </span>
        {plan.priceMonthly && Number(plan.priceMonthly) > 0 && (
          <span className="text-xs text-gray-400">/mo</span>
        )}
        {plan.priceYearly && Number(plan.priceYearly) > 0 && (
          <span className="text-xs text-gray-400">
            · {formatPrice(plan.priceYearly, plan.currency)}/yr
          </span>
        )}
      </div>

      {/* Description */}
      {plan.description && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 line-clamp-2">{plan.description}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-gray-500 dark:text-zinc-400">
        <span>{featuresEnabled} feature{featuresEnabled !== 1 ? 's' : ''}</span>
        <span>{limitsCount} limit{limitsCount !== 1 ? 's' : ''}</span>
        <span className="ml-auto">{subCount} subscriber{subCount !== 1 ? 's' : ''}</span>
      </div>
    </button>
  )
}

export default function BillingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [applications, setApplications] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [appFilter, setAppFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [drawerPlan, setDrawerPlan] = useState<SubscriptionPlan | null | undefined>(undefined)

  // Stripe connection + sync
  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; email?: string | null; error?: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [plansRes, appsRes] = await Promise.all([
        billingService.listPlans(appFilter || undefined),
        adminService.getApplications(),
      ])
      setPlans(plansRes.plans)
      setApplications(appsRes.map((a: any) => ({ id: a.id, name: a.name })))
    } catch (e: any) {
      setError(e.message || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [appFilter])

  useEffect(() => { loadPlans() }, [loadPlans])

  useEffect(() => {
    billingService.checkStripeConnection().then(setStripeStatus).catch(() => setStripeStatus({ connected: false }))
  }, [])

  const handleStripeSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const result = await billingService.syncFromStripe()
      setSyncMsg({ type: 'success', text: `Synced ${result.synced} plan${result.synced !== 1 ? 's' : ''} from Stripe.${result.failed > 0 ? ` ${result.failed} failed.` : ''}` })
      await loadPlans()
    } catch (e: any) {
      setSyncMsg({ type: 'error', text: e.message || 'Stripe sync failed' })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 5000)
    }
  }

  const filtered = plans.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.includes(search.toLowerCase())) return false
    if (statusFilter === 'active' && !p.isActive) return false
    if (statusFilter === 'inactive' && p.isActive) return false
    return true
  })

  const handleSaved = (saved: SubscriptionPlan) => {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    setDrawerPlan(undefined)
  }

  const handleDeleted = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    setDrawerPlan(undefined)
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <CreditCardIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Billing Plans
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            Create and manage subscription plans with custom features and usage limits.
          </p>
        </div>
        <button
          onClick={() => setDrawerPlan(null)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Stripe connection banner */}
      <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm ${
        stripeStatus?.connected
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0 text-[#635BFF]" fill="currentColor"><path d="M14.33 10.09c0-.76.63-1.06 1.66-1.06 1.48 0 3.36.45 4.84 1.25V6.1a12.85 12.85 0 0 0-4.84-.89c-3.98 0-6.62 2.07-6.62 5.53 0 5.4 7.44 4.54 7.44 6.87 0 .9-.78 1.19-1.87 1.19-1.62 0-3.69-.67-5.33-1.57v4.22c1.81.78 3.64 1.1 5.33 1.1 4.06 0 6.85-2 6.85-5.5-.02-5.83-7.46-4.8-7.46-6.96z"/></svg>
          <div>
            {stripeStatus === null ? (
              <span className="text-gray-500 dark:text-zinc-400 text-xs">Checking Stripe connection…</span>
            ) : stripeStatus.connected ? (
              <>
                <span className="font-medium text-emerald-800 dark:text-emerald-200">Stripe connected</span>
                {stripeStatus.email && <span className="text-emerald-600 dark:text-emerald-400 ml-2 text-xs">{stripeStatus.email}</span>}
              </>
            ) : (
              <>
                <span className="font-medium text-amber-800 dark:text-amber-200">Stripe not connected</span>
                <span className="text-amber-600 dark:text-amber-400 ml-2 text-xs">Set STRIPE_SECRET_KEY to enable sync</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {syncMsg && (
            <span className={`text-xs font-medium ${syncMsg.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {syncMsg.type === 'error' && <ExclamationTriangleIcon className="inline w-3.5 h-3.5 mr-1" />}
              {syncMsg.text}
            </span>
          )}
          <button
            onClick={handleStripeSync}
            disabled={syncing || !stripeStatus?.connected}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#635BFF]/30 bg-[#635BFF]/10 text-[#635BFF] dark:text-indigo-300 text-xs font-medium hover:bg-[#635BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync from Stripe'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plans…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={appFilter}
          onChange={e => setAppFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Applications</option>
          {applications.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-300 dark:border-zinc-700 overflow-hidden">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-zinc-400 py-12 text-center">Loading plans…</div>
      ) : error ? (
        <div className="text-sm text-red-600 dark:text-red-400 py-12 text-center">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CreditCardIcon className="w-12 h-12 text-gray-300 dark:text-zinc-600 mb-3" />
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            {plans.length === 0 ? 'No plans yet. Create your first plan.' : 'No plans match your filters.'}
          </p>
          {plans.length === 0 && (
            <button
              onClick={() => setDrawerPlan(null)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create First Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => (
            <PlanCard key={plan.id} plan={plan} onClick={() => setDrawerPlan(plan)} />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerPlan !== undefined && (
        <PlanDrawer
          plan={drawerPlan}
          applications={applications}
          onClose={() => setDrawerPlan(undefined)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
