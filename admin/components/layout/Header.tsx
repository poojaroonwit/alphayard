'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  MagnifyingGlassIcon,
  BellIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Tooltip } from '../ui/Tooltip'

interface HeaderProps {
  onGlobalSearch?: (query: string) => void
  onFilterClick?: () => void
  onLogout?: () => void
}

export function Header({ onGlobalSearch, onFilterClick, onLogout }: HeaderProps) {
  const [notifications, setNotifications] = useState(3)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const id = localStorage.getItem('impersonate_user_id')
      setImpersonating(id)
      const handler = () => setImpersonating(localStorage.getItem('impersonate_user_id'))
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    } catch {
      return undefined
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
    if (notifications > 0) {
      setNotifications(0)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onGlobalSearch?.(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    onGlobalSearch?.('')
  }

  return (
    <header className="frosted-glass border-b border-gray-200/50 px-6 py-3 sticky top-0 z-40" role="banner">
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar - macOS style */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <div className={`relative transition-all duration-200 ${
              isSearchFocused ? 'scale-[1.02]' : ''
            }`}>
              <MagnifyingGlassIcon 
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                  isSearchFocused ? 'text-blue-500' : 'text-gray-400'
                }`}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search families, users, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-10 py-2.5 macos-input text-sm focus:ring-2 focus:ring-blue-500/20"
                aria-label="Global search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center gap-2">
          {impersonating && (
            <div className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 text-xs font-semibold border border-yellow-200">
              Impersonating: {impersonating}
            </div>
          )}
          
          {/* Global Filters */}
          <Tooltip content="Global Filters">
            <button
              onClick={onFilterClick}
              className="p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              title="Global Filters"
              aria-label="Global Filters"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </Tooltip>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Tooltip content="Notifications">
              <button
                onClick={handleNotificationClick}
                className="p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 relative focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <BellIcon className="w-5 h-5" aria-hidden="true" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-lg animate-scale-in">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* Notification Dropdown - macOS style */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 frosted-glass-strong rounded-2xl shadow-macos-xl border border-gray-200/50 z-50 animate-slide-down">
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      aria-label="Close notifications"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[
                    { type: 'error', title: 'New family registered', desc: 'Johnson Family just joined the platform', time: '2 minutes ago' },
                    { type: 'info', title: 'System update available', desc: 'Version 2.1.0 is ready for deployment', time: '1 hour ago' },
                    { type: 'success', title: 'Backup completed', desc: 'Daily backup completed successfully', time: '3 hours ago' },
                  ].map((notification, idx) => (
                    <div
                      key={idx}
                      className="p-4 border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${notification.title} - ${notification.desc}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'info' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} aria-hidden="true"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.desc}</p>
                          <p className="text-xs text-gray-400 mt-1.5">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200/50">
                  <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@bondarys.com</p>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {/* User Dropdown - macOS style */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 frosted-glass-strong rounded-2xl shadow-macos-xl border border-gray-200/50 z-50 animate-slide-down">
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold">A</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                      <p className="text-xs text-gray-500 truncate">admin@bondarys.com</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    aria-label="Profile Settings"
                  >
                    <UserCircleIcon className="w-4 h-4" aria-hidden="true" />
                    Profile Settings
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    aria-label="Preferences"
                  >
                    <Cog6ToothIcon className="w-4 h-4" aria-hidden="true" />
                    Preferences
                  </button>
                  <hr className="my-2 border-gray-200/50" />
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    aria-label="Sign Out"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
