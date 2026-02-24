'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure your AppKit platform settings.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Platform Name</label>
            <input type="text" defaultValue="AppKit" className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Support Email</label>
            <input type="email" defaultValue="support@appkit.io" className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Default Timezone</label>
            <select className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>UTC</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Bangkok</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Default Language</label>
            <select className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>English</option>
              <option>Thai</option>
              <option>Japanese</option>
              <option>Chinese (Simplified)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
