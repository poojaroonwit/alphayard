'use client'

import { useState } from 'react'

export function DataExport() {
  const [type, setType] = useState<'users' | 'families' | 'invoices'>('users')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')

  const exportNow = () => {
    const data = [{ id: '1', name: 'Example' }]
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const headers = Object.keys(data[0])
      const rows = data.map(obj => headers.map(h => `"${String((obj as any)[h]).replace(/"/g,'""')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
        <p className="text-sm text-gray-600">Export data sets for analysis or backup.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="users">Users</option>
            <option value="families">Families</option>
            <option value="invoices">Invoices</option>
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg" onClick={exportNow}>Export</button>
        </div>
      </div>
    </div>
  )
}


