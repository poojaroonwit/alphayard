'use client'

import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import { 
  SunIcon, 
  MoonIcon, 
  Monitor as MonitorIcon,
  LogOut as LogOutIcon,
  User as UserIcon,
  Settings as SettingsIcon
} from 'lucide-react'

interface ModernHeaderProps {
  activeModule: string
  onMenuClick: () => void
  isMobile: boolean
}

export function ModernHeader({ activeModule, onMenuClick, isMobile }: ModernHeaderProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const getModuleTitle = (module: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      users: 'Users',
      families: 'Circle Management',
      'dynamic-content': 'Content Management',
      gallery: 'Gallery',
      storage: 'File Storage',
      social: 'Social Media',
      tickets: 'Support Tickets',
      marketing: 'Marketing Content',
      calendar: 'Event Calendar',
      'audit-logs': 'Audit Logs',
      tasks: 'Tasks',
      safety: 'Safety Alerts',
      localization: 'Localization',
      'roles-permissions': 'Roles & Permissions',
      settings: 'Settings',
      'page-preferences': 'Page Preferences'
    }
    return titles[module] || 'Dashboard'
  }

  const getModuleDescription = (module: string) => {
    const descriptions: Record<string, string> = {
      dashboard: 'Overview of your AppKit platform',
      users: 'Manage platform users and their profiles',
      families: 'Manage Circle groups and members',
      'dynamic-content': 'Manage Circle content and communications',
      gallery: 'Manage Circle photos and media',
      storage: 'Manage Circle files and documents',
      social: 'Social media management and insights',
      tickets: 'Support tickets and customer queries',
      marketing: 'Marketing content and campaigns',
      calendar: 'Manage Circle events and schedules',
      'audit-logs': 'Security & activity trail',
      tasks: 'Manage and track platform tasks',
      safety: 'Manage safety alerts and emergency protocols',
      localization: 'Language and regional settings',
      'roles-permissions': 'Manage user roles and access rights',
      settings: 'Configure your AppKit CMS settings',
      'page-preferences': 'Manage page-specific configurations'
    }
    return descriptions[module] || 'Overview of your AppKit platform'
  }

  return (
    <header className="header-modern">
      <div className="header-content">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={onMenuClick}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <div>
              <h1 className="page-title-modern">{getModuleTitle(activeModule)}</h1>
              <p className="page-subtitle-modern">{getModuleDescription(activeModule)}</p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search */}
            <div className="hidden lg:block relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 px-4 py-2 pl-10 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
            </button>
            
            {/* User Menu Popover */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 p-1.5 md:p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.firstName?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold truncate max-w-[120px]">
                    {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                    {user?.role || 'Administrator'}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-gray-100 dark:divide-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                  <div className="px-4 py-4 bg-gray-50/50 dark:bg-zinc-900/50">
                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.email || 'admin@example.com'}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-gray-100 dark:bg-zinc-800' : ''
                          } group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-colors`}
                        >
                          <UserIcon className="mr-3 h-4 w-4 text-gray-400" />
                          Your Profile
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-gray-100 dark:bg-zinc-800' : ''
                          } group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-colors`}
                        >
                          <SettingsIcon className="mr-3 h-4 w-4 text-gray-400" />
                          Account Settings
                        </button>
                      )}
                    </Menu.Item>
                  </div>

                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Appearance</div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
                      {[
                        { id: 'light', icon: SunIcon, label: 'Light' },
                        { id: 'dark', icon: MoonIcon, label: 'Dark' },
                        { id: 'system', icon: MonitorIcon, label: 'System' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`
                            flex flex-col items-center justify-center py-2 rounded-lg transition-all
                            ${theme === t.id 
                              ? 'bg-white dark:bg-zinc-800 text-red-500 dark:text-red-400 shadow-sm ring-1 ring-black/5' 
                              : 'text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300'
                            }
                          `}
                        >
                          <t.icon className="h-4 w-4 mb-1" />
                          <span className="text-[10px] font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${
                            active ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'
                          } group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors`}
                        >
                          <LogOutIcon className={`mr-3 h-4 w-4 ${active ? 'text-red-500' : 'text-gray-400'}`} />
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  )
}


