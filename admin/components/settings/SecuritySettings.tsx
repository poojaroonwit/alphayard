'use client'

import { useState } from 'react'

export function SecuritySettings() {
  const [twoFA, setTwoFA] = useState(false)
  const [ipAllowlist, setIpAllowlist] = useState<string>('')
  const [sessionTimeout, setSessionTimeout] = useState<number>(30)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-sm text-gray-600">2FA, sessions, and IP allowlists.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} />
          Require two-factor authentication for admins
        </label>
        <div>
          <div className="text-sm text-gray-700 mb-1">Session timeout (minutes)</div>
          <input type="number" min={5} className="border border-gray-200 rounded-lg px-3 py-2 w-32" value={sessionTimeout} onChange={(e) => setSessionTimeout(Number(e.target.value))} />
        </div>
        <div>
          <div className="text-sm text-gray-700 mb-1">IP allowlist (comma-separated)</div>
          <textarea className="border border-gray-200 rounded-lg px-3 py-2 w-full" rows={3} value={ipAllowlist} onChange={(e) => setIpAllowlist(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm" onClick={() => alert('Save requires backend API')}>Save</button>
      </div>
    </div>
  )
}


