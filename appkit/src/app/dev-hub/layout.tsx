'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChevronRight, 
  Search, 
  BookOpen, 
  Code2, 
  Terminal, 
  Layout, 
  Shield, 
  Zap, 
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Globe,
  Smartphone,
  Users,
  Lock,
  Settings,
  Paintbrush,
  Webhook,
  Activity,
  CreditCard,
  MessageSquare,
  Scale,
  ClipboardList,
  LogIn
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'

interface DocNavItem {
  title: string
  href: string
  icon?: React.ReactNode
}

interface DocNavGroup {
  title: string
  items: DocNavItem[]
}

const DOC_NAV: DocNavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/dev-hub', icon: <BookOpen className="h-4 w-4" /> },
      { title: 'Quick Start', href: '/dev-hub/quick-start', icon: <Zap className="h-4 w-4" /> },
      { title: 'Installation', href: '/dev-hub/installation', icon: <Terminal className="h-4 w-4" /> },
    ]
  },
  {
    title: 'Integration Guides',
    items: [
      { title: 'Web Application', href: '/dev-hub/guide/web-app', icon: <Globe className="h-4 w-4" /> },
      { title: 'Mobile Web / PWA', href: '/dev-hub/guide/mobile-web', icon: <Smartphone className="h-4 w-4" /> },
      { title: 'Native Mobile App', href: '/dev-hub/guide/mobile-app', icon: <Layout className="h-4 w-4" /> },
    ]
  },
  {
    title: 'Core Modules',
    items: [
      { title: 'Login & Auth', href: '/dev-hub/modules/login', icon: <Shield className="h-4 w-4" /> },
      { title: 'Identity & Profiles', href: '/dev-hub/modules/identity', icon: <Code2 className="h-4 w-4" /> },
      { title: 'Security & MFA', href: '/dev-hub/modules/security', icon: <Lock className="h-4 w-4" /> },
      { title: 'Session Management', href: '/dev-hub/modules/sessions', icon: <Layout className="h-4 w-4" /> },
      { title: 'Webhooks', href: '/dev-hub/modules/webhooks', icon: <Webhook className="h-4 w-4" /> },
      { title: 'Communication', href: '/dev-hub/modules/communication', icon: <MessageSquare className="h-4 w-4" /> },
      { title: 'Surveys', href: '/dev-hub/modules/surveys', icon: <ClipboardList className="h-4 w-4" /> },
      { title: 'Legal & Compliance', href: '/dev-hub/modules/legal', icon: <Scale className="h-4 w-4" /> },
      { title: 'Billing & Subscriptions', href: '/dev-hub/modules/billing', icon: <CreditCard className="h-4 w-4" /> },
      { title: 'Groups & Organizations', href: '/dev-hub/modules/groups', icon: <Users className="h-4 w-4" /> },
      { title: 'Content Management (CMS)', href: '/dev-hub/modules/cms', icon: <BookOpen className="h-4 w-4" /> },
      { title: 'Localization & i18n', href: '/dev-hub/modules/localization', icon: <Globe className="h-4 w-4" /> },
    ]
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Authentication API', href: '/dev-hub/api/auth' },
      { title: 'Users API', href: '/dev-hub/api/users' },
      { title: 'Webhooks API', href: '/dev-hub/api/webhooks' },
      { title: 'Activity Log API', href: '/dev-hub/api/activity' },
      { title: 'Communication API', href: '/dev-hub/api/communication' },
      { title: 'CMS & Content API', href: '/dev-hub/api/cms' },
      { title: 'Circles & Groups API', href: '/dev-hub/api/circles' },
      { title: 'Audit & Analytics API', href: '/dev-hub/api/audit' },
      { title: 'Management API', href: '/dev-hub/api/management' },
    ]
  },
  {
    title: 'Admin Console',
    items: [
      { title: 'Application Config', href: '/dev-hub/admin/app-config', icon: <Settings className="h-4 w-4" /> },
      { title: 'Appearance & Branding', href: '/dev-hub/admin/appearance', icon: <Paintbrush className="h-4 w-4" /> },
      { title: 'Auth Page Style', href: '/dev-hub/admin/auth-style', icon: <LogIn className="h-4 w-4" /> },
      { title: 'Activity Log', href: '/dev-hub/admin/activity', icon: <Activity className="h-4 w-4" /> },
    ]
  }
]

export default function DevHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/dev-hub" className="flex items-center gap-2 transition-colors hover:text-blue-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/25">
                A
              </div>
              <span className="hidden font-bold sm:inline-block text-lg tracking-tight">AlphaYard Docs</span>
            </Link>
            <nav className="flex items-center gap-6 hidden md:flex">
              <Link href="/identity/login-config" className="text-slate-500 hover:text-slate-900 transition-colors">Configuration</Link>
              <Link href="/identity/oauth-clients" className="text-slate-500 hover:text-slate-900 transition-colors">Clients</Link>
              <Link href="#" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
                Support <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="w-full max-w-sm hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="search" 
                  placeholder="Search documentation..." 
                  className="pl-10 h-10 w-full bg-slate-50 dark:bg-slate-900 rounded-full border-slate-200"
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex-1 flex flex-col md:flex-row px-0 sm:px-8 max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-transform md:translate-x-0 md:static md:z-auto md:w-64 md:pt-8 md:pr-4
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full overflow-y-auto px-4 pb-12 sm:px-0">
            <nav className="space-y-8">
              {DOC_NAV.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h4 className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group
                            ${isActive 
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                            }
                          `}
                        >
                          {item.icon && (
                            <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                              {item.icon}
                            </span>
                          )}
                          {item.title}
                          {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 md:pt-8 md:pl-12 pb-24 px-4 sm:px-0">
          <div className="max-w-3xl">
            {children}
          </div>
        </main>

        {/* On This Page (Right Sidebar) */}
        <aside className="hidden xl:block w-64 py-8 pl-8">
          <div className="sticky top-24 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">On This Page</h4>
            <nav className="space-y-2">
              <a href="#overview" className="block text-sm text-slate-500 hover:text-blue-600 transition-colors">Overview</a>
              <a href="#key-features" className="block text-sm text-slate-500 hover:text-blue-600 transition-colors">Key Features</a>
              <a href="#next-steps" className="block text-sm text-slate-500 hover:text-blue-600 transition-colors">Next Steps</a>
            </nav>
            
            <div className="mt-12 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
              <h5 className="font-bold text-sm mb-2">Need help?</h5>
              <p className="text-xs text-blue-100 mb-3 opacity-90 leading-relaxed">
                Connect with our team for personalized integration support.
              </p>
              <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-bold">
                Contact Support
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
