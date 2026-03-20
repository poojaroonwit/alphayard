'use client'

import React, { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Bell, Check, Clock, Activity, ExternalLink } from 'lucide-react'
import { adminService } from '@/services/adminService'
import { formatDistanceToNow } from 'date-fns'
import { formatNotificationAction, formatNotificationMessage } from '@/utils/notificationUtils'
import { NotificationDetailDrawer } from './NotificationDetailDrawer'

interface NotificationPopoverProps {
  user: any;
}

export function NotificationPopover({ user }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Poll every 60 seconds
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      // Instead of an empty generic notifications API, we use audit logs to surface system activity to admins
      const response = await adminService.getAuditLogs({ limit: 5 })
      const logs = response.logs || []
      setNotifications(logs)
      
      // Calculate a mock unread count based on recent logs (last 24h)
      const recent = logs.filter(log => {
        const date = new Date(log.createdAt)
        return (new Date().getTime() - date.getTime()) < 24 * 60 * 60 * 1000
      })
      setUnreadCount(recent.length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const markAllRead = () => {
    setUnreadCount(0)
  }

  const handleNotificationClick = (notif: any) => {
    setSelectedNotification(notif)
    setIsDrawerOpen(true)
  }

  return (
    <>
      <Menu as="div" className="relative">
        <Menu.Button className="relative p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl group" aria-label="Notifications" title="Notifications">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
          )}
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-4 w-80 sm:w-96 origin-top-right rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-[100] border border-gray-200/50 dark:border-zinc-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Recent Activity</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <Bell className="w-8 h-8 text-gray-300 dark:text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/50 dark:divide-zinc-800/50">
                  {notifications.map((notif, index) => (
                    <Menu.Item key={index}>
                      {({ active }) => (
                        <button 
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left p-4 transition-colors ${active ? 'bg-gray-50/80 dark:bg-zinc-800/80' : ''} ${index < unreadCount ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index < unreadCount ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                              <Activity className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {formatNotificationAction(notif.action || 'system_event')}
                                </p>
                                {active && <ExternalLink className="w-3 h-3 text-blue-500 shrink-0 mt-1" />}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                                {formatNotificationMessage(notif)}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-400">
                                  {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
              <button className="w-full py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                View All Activity
              </button>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <NotificationDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        notification={selectedNotification} 
      />
    </>
  )
}
