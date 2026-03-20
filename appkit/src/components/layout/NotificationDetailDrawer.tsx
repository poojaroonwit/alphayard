'use client'

import React from 'react'
import { Drawer } from '../ui/Drawer'
import { formatNotificationAction, formatNotificationMessage } from '@/utils/notificationUtils'
import { format } from 'date-fns'
import { Activity, Clock, Shield, User, Globe, Info } from 'lucide-react'

interface NotificationDetailDrawerProps {
  notification: any | null
  isOpen: boolean
  onClose: () => void
}

export function NotificationDetailDrawer({ notification, isOpen, onClose }: NotificationDetailDrawerProps) {
  if (!notification) return null

  const details = notification.details || {}
  
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Details"
      className="max-w-lg"
    >
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {formatNotificationAction(notification.action || 'system_event')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {formatNotificationMessage(notification)}
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 gap-4">
          <DetailItem 
            icon={<Clock className="w-4 h-4" />} 
            label="Timestamp" 
            value={notification.createdAt ? format(new Date(notification.createdAt), 'PPpp') : 'N/A'} 
          />
          <DetailItem 
            icon={<Shield className="w-4 h-4" />} 
            label="Category" 
            value={notification.category ? notification.category.toUpperCase() : 'SYSTEM'} 
          />
          <DetailItem 
            icon={<User className="w-4 h-4" />} 
            label="User ID" 
            value={notification.userId || 'System'} 
          />
          <DetailItem 
            icon={<Globe className="w-4 h-4" />} 
            label="IP Address" 
            value={notification.ipAddress || 'Internal'} 
          />
          {notification.resource && (
            <DetailItem 
              icon={<Info className="w-4 h-4" />} 
              label="Resource" 
              value={`${notification.resource}${notification.resourceId ? ` (${notification.resourceId})` : ''}`} 
            />
          )}
        </div>

        {/* Raw Details JSON */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-1">Raw Payload</h4>
          <div className="p-4 bg-gray-950 rounded-2xl border border-zinc-800 overflow-x-auto shadow-inner">
            <pre className="text-[11px] font-mono text-blue-300/90 leading-relaxed">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="text-gray-400 dark:text-zinc-500">{icon}</div>
      <div className="flex-1 border-b border-gray-100 dark:border-zinc-800/50 pb-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
