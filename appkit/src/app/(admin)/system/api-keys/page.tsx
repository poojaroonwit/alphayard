'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { KeyIcon } from 'lucide-react'

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys & Access Tokens</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage API keys for programmatic access to AppKit.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
        <div className="space-y-3">
          {[
            { name: 'Production API Key', key: 'ak_live_••••••••••••3f8a', created: '2024-01-15', status: 'Active' },
            { name: 'Development API Key', key: 'ak_test_••••••••••••9b2c', created: '2024-02-01', status: 'Active' },
            { name: 'CI/CD Token', key: 'ak_ci_••••••••••••1d5e', created: '2024-02-10', status: 'Active' },
          ].map((apiKey) => (
            <div key={apiKey.name} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{apiKey.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono mt-0.5">{apiKey.key}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {apiKey.status}
                </span>
                <Button variant="ghost" size="sm" className="text-xs">Rotate</Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="text-sm">
          <KeyIcon className="w-4 h-4 mr-2" />
          Generate New API Key
        </Button>
      </div>
    </div>
  )
}
