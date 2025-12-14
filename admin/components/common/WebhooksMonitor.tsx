'use client'

import { useEffect, useState } from 'react'

interface Delivery { id: string; event: string; status: string; timestamp: string; attempts: number }

export function WebhooksMonitor() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setDeliveries([
        { id: 'wh_1', event: 'invoice.payment_failed', status: 'failed', timestamp: new Date().toISOString(), attempts: 3 },
        { id: 'wh_2', event: 'customer.subscription.created', status: 'delivered', timestamp: new Date().toISOString(), attempts: 1 },
      ])
      setLoading(false)
    }, 300)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <p className="text-sm text-gray-600">Recent deliveries and retries.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Event</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Attempts</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td className="px-6 py-3 text-sm">{d.event}</td>
                  <td className="px-6 py-3 text-sm">{d.status}</td>
                  <td className="px-6 py-3 text-sm">{d.attempts}</td>
                  <td className="px-6 py-3 text-sm">{new Date(d.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm"><button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => alert('Retry requires backend API')}>Retry</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


