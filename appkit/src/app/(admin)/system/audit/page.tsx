'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/authService'
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

interface AuditLog {
  id: string
  userId: string | null
  action: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  metadata?: Record<string, any>
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

function actionColor(action: string): string {
  if (action.includes('delete') || action.includes('ban') || action.includes('revoke')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (action.includes('create') || action.includes('register') || action.includes('signup')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (action.includes('update') || action.includes('edit') || action.includes('change')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (action.includes('login') || action.includes('logout') || action.includes('auth')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  return 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = authService.getToken()
      const qs = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      })
      const res = await fetch(`/api/v1/admin/audit?${qs}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const data = await res.json()
      setLogs(data.logs ?? [])
      setPagination(data.pagination ?? { page, limit: 50, total: 0, pages: 0 })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleExport = async () => {
    const token = authService.getToken()
    const res = await fetch('/api/v1/admin/audit/export', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search
    ? logs.filter(l => l.action.toLowerCase().includes(search.toLowerCase()) || (l.userId ?? '').includes(search) || (l.ipAddress ?? '').includes(search))
    : logs

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Audit Trail
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            Complete history of admin actions and system events.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, user, IP…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            placeholder="Filter by action"
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-zinc-400">Loading audit logs…</div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-zinc-400">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  {['Action', 'User ID', 'IP Address', 'User Agent', 'Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 font-mono">
                      {log.userId ? log.userId.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-500 max-w-[200px] truncate" title={log.userAgent ?? ''}>
                      {log.userAgent ? log.userAgent.split(' ')[0] : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} entries</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-zinc-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm">Page {pagination.page} of {pagination.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-zinc-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
