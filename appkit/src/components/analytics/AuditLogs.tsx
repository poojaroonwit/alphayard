'use client'

import { useEffect, useMemo, useState } from 'react'
import { auditService, AuditLogItem } from '../../services/auditService'

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || l.description.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
      const matchesLevel = !level || l.level === level
      const matchesCategory = !category || l.category === category
      return matchesQuery && matchesLevel && matchesCategory
    })
  }, [logs, query, level, category])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await auditService.list({ limit: 200 })
        setLogs(res.logs || [])
      } catch (e) {
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleExport = async () => {
    try {
      const res = await auditService.export('csv', {})
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename || 'audit.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600">Track important admin and user activities.</p>
          </div>
          <button onClick={handleExport} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm">Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description/action/category" className="border border-gray-200 rounded-lg px-3 py-2" />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All categories</option>
            <option value="authentication">Authentication</option>
            <option value="user_management">User Management</option>
            <option value="Circle_management">Circle Management</option>
            <option value="safety">Safety</option>
            <option value="billing">Billing</option>
            <option value="system">System</option>
            <option value="security">Security</option>
            <option value="data">Data</option>
            <option value="api">API</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit events</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Level</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        log.level === 'critical' ? 'bg-red-100 text-red-800' :
                        log.level === 'error' ? 'bg-rose-100 text-rose-800' :
                        log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{log.level}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{log.category}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{log.action}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{log.description}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{log.userId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}



