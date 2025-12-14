'use client'

import { useEffect, useState } from 'react'
import { 
  HomeIcon,
  UsersIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  ShareIcon,
  TicketIcon,
  PaintBrushIcon,
  CogIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Tooltip } from '../ui/Tooltip'

interface SidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
  familyCount?: number
  safetyCount?: number
  ticketCount?: number
}

export function Sidebar({ activeModule, setActiveModule, familyCount, safetyCount, ticketCount }: SidebarProps) {
  const [branding, setBranding] = useState<{ adminAppName?: string; logoUrl?: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const res = await fetch(`${base}/api/settings/branding`, { credentials: 'include' })
        const data = await res.json()
        setBranding(data?.branding || null)
      } catch {
        setBranding(null)
      }
    }
    load()
  }, [])

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: HomeIcon,
      badge: null,
      description: 'Overview and analytics'
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: UsersIcon,
      badge: null,
      description: 'Manage user accounts'
    },
    { 
      id: 'localization', 
      label: 'Localization', 
      icon: GlobeAltIcon,
      badge: null,
      description: 'Language settings'
    },
    { 
      id: 'families', 
      label: 'Families', 
      icon: UserGroupIcon,
      badge: familyCount?.toString() || '0',
      description: 'Family management'
    },
    { 
      id: 'safety', 
      label: 'Safety', 
      icon: ShieldExclamationIcon,
      badge: safetyCount && safetyCount > 0 ? safetyCount.toString() : null,
      description: 'Safety alerts'
    },
    { 
      id: 'social', 
      label: 'Social Media', 
      icon: ShareIcon,
      badge: null,
      description: 'Social integrations'
    },
    { 
      id: 'tickets', 
      label: 'Tickets', 
      icon: TicketIcon,
      badge: ticketCount && ticketCount > 0 ? ticketCount.toString() : null,
      description: 'Support tickets'
    },
    { 
      id: 'dynamic-content', 
      label: 'Content', 
      icon: PaintBrushIcon,
      badge: null,
      description: 'Content management'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: CogIcon,
      badge: null,
      description: 'System settings'
    }
  ]

  return (
    <aside 
      className={`frosted-glass border-r border-gray-200/50 flex flex-col h-full transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt="Logo" 
              className="w-10 h-10 rounded-xl shadow-lg object-cover flex-shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-xl">B</span>
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{branding?.adminAppName || 'Bondarys'}</h1>
              <p className="text-xs text-gray-500 truncate">Admin Console</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Navigation menu">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeModule === item.id
          
          const menuItem = (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} aria-hidden="true" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" aria-hidden="true"></div>
              )}
            </button>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.id} content={item.label} position="right">
                {menuItem}
              </Tooltip>
            )
          }

          return menuItem
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-gray-200/50">
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRightIcon className={`w-5 h-5 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
