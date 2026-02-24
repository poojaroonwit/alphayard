'use client'

import React from 'react'

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Global security policies for the platform.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-4">
        {[
          { label: 'Enforce MFA for all admin users', desc: 'Require multi-factor authentication for admin console access', checked: true },
          { label: 'IP Whitelist', desc: 'Restrict admin access to specific IP addresses', checked: false },
          { label: 'Audit Logging', desc: 'Log all admin actions for security auditing', checked: true },
          { label: 'Session Timeout', desc: 'Automatically log out inactive admin sessions after 30 minutes', checked: true },
          { label: 'CORS Protection', desc: 'Restrict cross-origin requests to approved domains only', checked: true },
        ].map((setting) => (
          <div key={setting.label} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{setting.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={setting.checked} />
              <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
