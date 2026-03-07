'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { billingService, SubscriptionPlan } from '@/services/billingService'
import { PlanDrawer } from '@/components/billing/PlanDrawer'
import {
  CreditCardIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

function formatPrice(price: string | null, currency: string): string {
  if (price == null || price === '') return 'Free'
  const n = Number(price)
  if (n === 0) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n)
}

function PlanCard({ plan, onClick }: { plan: SubscriptionPlan; onClick: () => void }) {
  const featuresEnabled = (plan.features ?? []).length
  const limitsCount = Object.keys(plan.limits ?? {}).length
  const subCount = plan._count?.subscriptions ?? 0

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {plan.name}
            </h3>
            {!plan.isPublic && (
              <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-medium rounded">
                Private
              </span>
            )}
            {plan.trialDays > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 text-[10px] font-medium rounded">
                {plan.trialDays}d trial
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

      {plan.description && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 line-clamp-2">{plan.description}</p>
      )}

      {/* Features preview */}
      {featuresEnabled > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(plan.features ?? []).slice(0, 4).map(f => (
            <span key={f} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] rounded">
              {f.replace(/_/g, ' ')}
            </span>
          ))}
          {featuresEnabled > 4 && (
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[10px] rounded">
              +{featuresEnabled - 4} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-gray-500 dark:text-zinc-400">
        <span>{featuresEnabled} feature{featuresEnabled !== 1 ? 's' : ''}</span>
        <span>{limitsCount} limit{limitsCount !== 1 ? 's' : ''}</span>
        <span className="ml-auto font-medium text-gray-700 dark:text-zinc-300">
          {subCount} subscriber{subCount !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  )
}

interface AppBillingPlansProps {
  appId: string
  appName: string
}

export function AppBillingPlans({ appId, appName }: AppBillingPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [drawerPlan, setDrawerPlan] = useState<SubscriptionPlan | null | undefined>(undefined)
  // undefined = closed, null = create, plan = edit

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await billingService.listPlans(appId)
      setPlans(res.plans)
    } catch (e: any) {
      setError(e.message || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => { loadPlans() }, [loadPlans])

  const filtered = plans.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.includes(search.toLowerCase())) return false
    if (statusFilter === 'active' && !p.isActive) return false
    if (statusFilter === 'inactive' && p.isActive) return false
    return true
  })

  const handleSaved = (saved: SubscriptionPlan) => {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
    setDrawerPlan(undefined)
  }

  const handleDeleted = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    setDrawerPlan(undefined)
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4 text-blue-500" />
            Subscription Plans
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Plans and prices are created in Stripe. Use this section to view synced plans and configure app-specific
            features and limits for this application.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plans…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
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

      {/* Plan grid */}
      {loading ? (
        <p className="text-xs text-gray-400 dark:text-zinc-500 py-8 text-center">Loading plans…</p>
      ) : error ? (
        <p className="text-xs text-red-600 dark:text-red-400 py-8 text-center">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
          <CreditCardIcon className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {plans.length === 0
              ? 'No plans have been synced from Stripe for this application yet.'
              : 'No plans match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(plan => (
            <PlanCard key={plan.id} plan={plan} onClick={() => setDrawerPlan(plan)} />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerPlan !== undefined && (
        <PlanDrawer
          plan={drawerPlan}
          applications={[{ id: appId, name: appName }]}
          fixedApplicationId={appId}
          onClose={() => setDrawerPlan(undefined)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
