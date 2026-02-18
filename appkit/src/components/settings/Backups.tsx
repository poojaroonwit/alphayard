'use client'

import { useState } from 'react'

export function Backups() {
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Backups</h1>
        <p className="text-sm text-gray-600">Schedule exports and restore backups.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div>
          <div className="text-sm text-gray-700 mb-1">Schedule</div>
          <select value={schedule} onChange={(e) => setSchedule(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg" onClick={() => alert('Trigger backup requires backend API')}>Run backup now</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg" onClick={() => alert('Restore requires backend API')}>Restore from file</button>
        </div>
      </div>
    </div>
  )
}


