'use client'

import { useState } from 'react'

export function SSOSettings() {
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">SSO</h1>
        <p className="text-sm text-gray-600">Configure Google and Microsoft SSO.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={googleEnabled} onChange={(e) => setGoogleEnabled(e.target.checked)} />Enable Google SSO</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={microsoftEnabled} onChange={(e) => setMicrosoftEnabled(e.target.checked)} />Enable Microsoft SSO</label>
        <div>
          <div className="text-sm text-gray-700 mb-1">Redirect URL</div>
          <input className="border border-gray-200 rounded-lg px-3 py-2 w-full" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm" onClick={() => alert('Save requires backend API')}>Save</button>
      </div>
    </div>
  )
}


