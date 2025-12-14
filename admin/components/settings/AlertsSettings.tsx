'use client'

import { useState } from 'react'

export function AlertsSettings() {
  const [email, setEmail] = useState(true)
  const [slack, setSlack] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-600">Notify admins on critical audit events.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />Email alerts</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slack} onChange={(e) => setSlack(e.target.checked)} />Slack alerts</label>
        <div>
          <div className="text-sm text-gray-700 mb-1">Webhook URL</div>
          <input className="border border-gray-200 rounded-lg px-3 py-2 w-full" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm" onClick={() => alert('Save requires backend API')}>Save</button>
      </div>
    </div>
  )
}


