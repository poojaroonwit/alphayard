'use client'

import { useState } from 'react'

export function RateLimits() {
  const [perMinute, setPerMinute] = useState<number>(60)
  const [burst, setBurst] = useState<number>(100)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Rate Limits</h1>
        <p className="text-sm text-gray-600">Control API request limits.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div>
          <div className="text-sm text-gray-700 mb-1">Requests per minute</div>
          <input type="number" className="border border-gray-200 rounded-lg px-3 py-2 w-32" value={perMinute} onChange={(e) => setPerMinute(Number(e.target.value))} />
        </div>
        <div>
          <div className="text-sm text-gray-700 mb-1">Burst</div>
          <input type="number" className="border border-gray-200 rounded-lg px-3 py-2 w-32" value={burst} onChange={(e) => setBurst(Number(e.target.value))} />
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm" onClick={() => alert('Save requires backend API')}>Save</button>
      </div>
    </div>
  )
}


