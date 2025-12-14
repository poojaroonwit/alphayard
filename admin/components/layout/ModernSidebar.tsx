'use client'

import { useEffect, useRef, useState } from 'react'

interface ModernSidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
  isOpen: boolean
  onToggle: () => void
  isMobile: boolean
}

function svg(name: string, cls = 'h-5 w-5') {
  const attrs = `class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"`;
  const paths: Record<string, string> = {
    'chart-bar': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18" /><path stroke-linecap="round" d="M7 15v-6m6 6V9m6 6v-9" />',
    'users': '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 20v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    'globe': '<circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
    'server': '<rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><path d="M6 6h.01" /><path d="M6 18h.01" />',
    'calendar': '<path stroke-linecap="round" stroke-linejoin="round" d="M8 3v2m8-2v2M4 9h16M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />',
    'exclamation-triangle': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86l-8.3 14.34A1.5 1.5 0 0 0 3.29 21h17.42a1.5 1.5 0 0 0 1.3-2.8L13.71 3.86a1.5 1.5 0 0 0-2.42 0z" />',
    'check-circle': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />',
    'photo': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />',
    'share': '<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z" />',
    'ticket': '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />',
    'megaphone': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 11l18-5v12L3 13v8" />',
    'paint-brush': '<path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3z" />',
    'chart-pie': '<path d="M11 2v10l-8.66 5A10 10 0 1 0 11 2z" /><path d="M13 12h9A10 10 0 0 1 13 2z" />',
    'cog': '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />'
  };
  const path = paths[name] || '';
  return `<svg ${attrs}>${path}</svg>`;
}

export function ModernSidebar({ activeModule, setActiveModule, isOpen, onToggle, isMobile }: ModernSidebarProps) {
  const navRef = useRef<HTMLElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)
  const [branding, setBranding] = useState<{ adminAppName?: string; logoUrl?: string } | null>(null)

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!navRef.current) return

      const menuItems = Array.from(navRef.current.querySelectorAll('button[role="menuitem"]')) as HTMLButtonElement[]
      const currentIndex = menuItems.findIndex(item => item === document.activeElement)

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
          menuItems[nextIndex]?.focus()
          break
        case 'ArrowUp':
          event.preventDefault()
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
          menuItems[prevIndex]?.focus()
          break
        case 'Home':
          event.preventDefault()
          menuItems[0]?.focus()
          break
        case 'End':
          event.preventDefault()
          menuItems[menuItems.length - 1]?.focus()
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (document.activeElement instanceof HTMLButtonElement) {
            document.activeElement.click()
          }
          break
        case 'Escape':
          if (isMobile && isOpen) {
            onToggle()
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [isOpen, isMobile, onToggle])

  // Focus active item when sidebar opens
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.focus()
    }
  }, [isOpen, activeModule])
  const menuGroups = [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'chart-bar',
          description: 'Overview and insights'
        }
      ]
    },
    {
      title: 'User Management',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: 'users',
          description: 'User management'
        },
        {
          id: 'families',
          label: 'Families',
          icon: 'users',
          description: 'Family management'
        }
      ]
    },
    {
      title: 'Content & Media',
      items: [
        {
          id: 'dynamic-content',
          label: 'Dynamic Content',
          icon: 'paint-brush',
          description: 'Content management'
        },
        {
          id: 'gallery',
          label: 'Gallery',
          icon: 'photo',
          description: 'Photo management'
        },
        {
          id: 'storage',
          label: 'Storage',
          icon: 'server',
          description: 'File management'
        }
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          id: 'social',
          label: 'Social Media',
          icon: 'share',
          description: 'Social media management'
        },
        {
          id: 'tickets',
          label: 'Tickets',
          icon: 'ticket',
          description: 'Support tickets'
        },
        {
          id: 'marketing',
          label: 'Marketing',
          icon: 'megaphone',
          description: 'Marketing content'
        }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'calendar',
          label: 'Calendar',
          icon: 'calendar',
          description: 'Event management'
        },
        {
          id: 'audit-logs',
          label: 'Audit Logs',
          icon: 'inbox',
          description: 'Security & activity trail'
        },
        {
          id: 'tasks',
          label: 'Tasks',
          icon: 'check-circle',
          description: 'Task management'
        },
        {
          id: 'safety',
          label: 'Safety',
          icon: 'exclamation-triangle',
          description: 'Safety alerts'
        }
      ]
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'localization',
          label: 'Localization',
          icon: 'globe',
          description: 'Language settings'
        },
        {
          id: 'roles-permissions',
          label: 'Roles & Permissions',
          icon: 'cog',
          description: 'Access control'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'cog',
          description: 'System configuration'
        },
        {
          id: 'page-preferences',
          label: 'Page Preferences',
          icon: 'cog',
          description: 'Page settings'
        }
      ]
    }
  ]

  const sidebarClasses = `sidebar-modern ${isMobile ? (isOpen ? 'mobile-open' : '') : ''}`

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Modern Sidebar */}
      <div className={sidebarClasses}>
        {/* Header Section */}
        <div className="sidebar-header">
          <div className="header-content">
            <div className="logo-section">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="logo-icon object-cover" />
              ) : (
                <div className="logo-icon">B</div>
              )}
              <div className="logo-text">
                <h1 className="logo-title">{branding?.adminAppName || 'Bondarys'}</h1>
                <p className="logo-subtitle">Family CMS</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="header-toggle-btn"
                onClick={onToggle}
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Modern Navigation */}
        <nav 
          ref={navRef}
          className="nav-modern" 
          role="navigation" 
          aria-label="Main navigation"
          tabIndex={-1}
        >
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title} className="nav-group">
              <div className="nav-group-title" role="heading" aria-level={2}>{group.title}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  ref={activeModule === item.id ? activeItemRef : null}
                  onClick={() => {
                    setActiveModule(item.id)
                    if (isMobile) {
                      onToggle()
                    }
                  }}
                  className={`nav-item-modern ${
                    activeModule === item.id ? 'active' : ''
                  }`}
                  role="menuitem"
                  aria-label={`Navigate to ${item.label}`}
                  aria-describedby={`${item.id}-description`}
                  aria-current={activeModule === item.id ? 'page' : undefined}
                  tabIndex={0}
                >
                  <span className="nav-icon" dangerouslySetInnerHTML={{__html: svg(item.icon)}} />
                  <div className="flex-1 text-left">
                    <div className="nav-label">{item.label}</div>
                    <div className="nav-description" id={`${item.id}-description`}>{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </nav>
        
        {/* User Profile Section removed: profile selection moved out of sidebar */}
      </div>
    </>
  )
}
