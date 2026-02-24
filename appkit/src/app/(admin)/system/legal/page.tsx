'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { ScaleIcon } from 'lucide-react'

export default function LegalCompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal & Compliance</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage legal documents and compliance settings.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-3">
        {[
          { title: 'Terms of Service', lastUpdated: '2024-02-15', status: 'Published' },
          { title: 'Privacy Policy', lastUpdated: '2024-02-10', status: 'Published' },
          { title: 'Cookie Policy', lastUpdated: '2024-01-20', status: 'Draft' },
          { title: 'Data Processing Agreement', lastUpdated: '2024-01-15', status: 'Published' },
        ].map((doc) => (
          <div key={doc.title} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <ScaleIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Updated: {doc.lastUpdated}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                doc.status === 'Published'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {doc.status}
              </span>
              <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
