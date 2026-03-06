'use client'

import React, { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import {
  MegaphoneIcon,
  UsersIcon,
  BellIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

type MessageType = 'notification' | 'email' | 'both'
type Target = 'all' | 'premium' | 'active'

interface Application {
  id: string
  name: string
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<MessageType>('notification')
  const [target, setTarget] = useState<Target>('all')
  const [applicationId, setApplicationId] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)

  useEffect(() => {
    adminService.getApplications().then((apps: any[]) => setApplications(apps.map(a => ({ id: a.id, name: a.name })))).catch(() => {})
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type, target, applicationId: applicationId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setResult({ success: true, message: 'Broadcast sent successfully', count: data.results?.successful })
      setTitle('')
      setMessage('')
    } catch (e: any) {
      setResult({ success: false, message: e.message || 'Failed to send broadcast' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <MegaphoneIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Broadcast Message
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">
          Send notifications or emails to users across your applications.
        </p>
      </div>

      <form onSubmit={handleSend} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">

        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message Type</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'notification', label: 'Push Notification', icon: BellIcon },
              { value: 'email', label: 'Email', icon: EnvelopeIcon },
              { value: 'both', label: 'Both', icon: MegaphoneIcon },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                  type === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Audience</label>
            <select value={target} onChange={e => setTarget(e.target.value as Target)} className={inputCls}>
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="premium">Premium Subscribers</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Application</label>
            <select value={applicationId} onChange={e => setApplicationId(e.target.value)} className={inputCls}>
              <option value="">All Applications</option>
              {applications.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Notification title…"
            maxLength={100}
            required
            className={inputCls}
          />
          <p className="text-xs text-gray-400 text-right">{title.length}/100</p>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message…"
            rows={5}
            maxLength={1000}
            required
            className={inputCls + ' resize-none'}
          />
          <p className="text-xs text-gray-400 text-right">{message.length}/1000</p>
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            {result.success
              ? <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              : <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>
              {result.message}
              {result.count != null && ` · Reached ${result.count.toLocaleString()} user${result.count !== 1 ? 's' : ''}`}
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !message.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <MegaphoneIcon className="w-4 h-4" />
            {submitting ? 'Sending…' : 'Send Broadcast'}
          </button>
        </div>
      </form>

      {/* Info card */}
      <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 p-4">
        <div className="flex gap-3">
          <UsersIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <p className="font-medium mb-1">Before you send</p>
            <ul className="list-disc list-inside space-y-0.5 text-yellow-700 dark:text-yellow-400">
              <li>Push notifications require users to have enabled notifications in their device settings.</li>
              <li>Email delivery depends on SMTP configuration under System → SMTP.</li>
              <li>Broadcasts cannot be undone once sent.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
