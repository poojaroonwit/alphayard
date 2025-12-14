'use client'

interface ModernHeaderProps {
  activeModule: string
  onMenuClick: () => void
  isMobile: boolean
}

export function ModernHeader({ activeModule, onMenuClick, isMobile }: ModernHeaderProps) {
  const getModuleTitle = (module: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      content: 'Content Management',
      families: 'Family Management',
      storage: 'File Storage',
      calendar: 'Event Calendar',
      notes: 'Notes Management',
      safety: 'Safety Alerts',
      marketing: 'Marketing Content',
      analytics: 'Analytics',
      settings: 'Settings'
    }
    return titles[module] || 'Dashboard'
  }

  const getModuleDescription = (module: string) => {
    const descriptions: Record<string, string> = {
      dashboard: 'Overview of your Bondarys family platform',
      content: 'Manage family content and communications',
      families: 'Manage family groups and members',
      storage: 'Manage family files and documents',
      calendar: 'Manage family events and schedules',
      notes: 'Manage family notes and documentation',
      safety: 'Manage safety alerts and emergency protocols',
      marketing: 'Marketing content and campaigns',
      analytics: 'Content performance and insights',
      settings: 'Configure your Bondarys CMS settings'
    }
    return descriptions[module] || 'Overview of your Bondarys family platform'
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
                className="mr-6 p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
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
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                3
              </span>
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button className="flex items-center space-x-3 p-2 text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  A
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold">Admin User</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
