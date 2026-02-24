'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { LinkIcon } from 'lucide-react'

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure webhook endpoints to receive real-time events.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
        <div className="space-y-3">
          {[
            { url: 'https://api.example.com/webhooks/appkit', events: 'user.created, user.deleted', status: 'Active' },
            { url: 'https://hooks.slack.com/services/T00/B00/abc', events: 'application.deployed', status: 'Active' },
          ].map((webhook, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{webhook.url}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Events: {webhook.events}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {webhook.status}
                </span>
                <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="text-sm">
          <LinkIcon className="w-4 h-4 mr-2" />
          Add Webhook Endpoint
        </Button>
      </div>
    </div>
  )
}
