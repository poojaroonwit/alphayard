'use client'

import React from 'react'
import { AdminConsoleUsers } from '@/components/users/AdminConsoleUsers'

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage admin console users, their roles, and group permissions.</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-5">
          <AdminConsoleUsers />
        </div>
      </div>
    </div>
  )
}
