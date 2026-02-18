'use client'

import { useState } from 'react'

export function FeatureFlags() {
  const [flags, setFlags] = useState<{ key: string; enabled: boolean; plan?: string }[]>([
    { key: 'dynamic_content', enabled: true, plan: 'premium' },
    { key: 'audit_logs', enabled: true, plan: 'premium' },
    { key: 'webhooks', enabled: false, plan: 'elite' }
  ])

  const toggle = (i: number) => {
    setFlags(prev => prev.map((f, idx) => idx === i ? { ...f, enabled: !f.enabled } : f))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-sm text-gray-600">Toggle modules by plan or tenant.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Key</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Enabled</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {flags.map((f, i) => (
              <tr key={f.key}>
                <td className="px-6 py-3 text-sm">{f.key}</td>
                <td className="px-6 py-3 text-sm">{f.plan || '-'}</td>
                <td className="px-6 py-3 text-sm"><input type="checkbox" checked={f.enabled} onChange={() => toggle(i)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


