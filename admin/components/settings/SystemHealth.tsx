'use client'

import { useEffect, useState } from 'react'

export function SystemHealth() {
  const [metrics, setMetrics] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/metrics').then(r => r.json()).then(setMetrics).catch(() => setMetrics(null)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <p className="text-sm text-gray-600">Backend uptime and resource metrics.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : metrics ? (
          <pre className="text-xs text-gray-800 whitespace-pre-wrap">{JSON.stringify(metrics, null, 2)}</pre>
        ) : (
          <div className="text-sm text-gray-500">No metrics available</div>
        )}
      </div>
    </div>
  )
}


