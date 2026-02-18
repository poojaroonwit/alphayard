'use client'

import React, { useState, useEffect, Fragment, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { useTheme } from 'next-themes'
import { 
    Sun, 
    Moon, 
    Monitor, 
    LogOut, 
    Menu as MenuIcon, 
    X,
    Search,
    Bell,
    ChevronDown,
    User,
    Settings
} from 'lucide-react'
import { authService } from '../../services/authService'
import { AppSwitcher } from '../../components/layout/AppSwitcher'
import { Tooltip } from '../../components/ui/Tooltip'
import { PermissionProvider, usePermissions } from '../../contexts/PermissionContext'
import { AccountSettingsModal } from '../../components/settings/AccountSettingsModal'

interface AdminLayoutProps {
    children: React.ReactNode
}

// Navigation item with permissions
interface NavItem {
    id: string
    label: string
    href: string
    icon: string
    group?: string
    permissions?: [string, string][] // [module, action] pairs - user needs ANY of these
}

interface NavHub {
    id: string
    label: string
    icon: string
    href: string
    items: NavItem[]
    permissions?: [string, string][] // Hub-level permission requirement
}

// Global Hub Navigation with permission requirements
const navigationHubs: NavHub[] = [
    {
        id: 'overview',
        label: 'App Overview',
        icon: 'chart-bar',
        href: '/dashboard',
        permissions: [['dashboard', 'view']],
        items: [
            { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'chart-bar', permissions: [['dashboard', 'view']] }
        ]
    },
    {
        id: 'content',
        label: 'App Content',
        icon: 'layout',
        href: '/appearance',
        items: [
            { id: 'config', label: 'App Config', href: '/appearance', icon: 'paint', group: 'Configuration', permissions: [['settings', 'view']] },
            { id: 'screens', label: 'Global Screens', href: '/navigation?tab=screens', icon: 'screens', group: 'Structure', permissions: [['pages', 'view']] },
            { id: 'navigation', label: 'App Menu', href: '/navigation?tab=navigation', icon: 'layout', group: 'Structure', permissions: [['pages', 'view']] },
            { id: 'flows', label: 'User Flows', href: '/flows', icon: 'circle', group: 'Structure', permissions: [['pages', 'view']] },
            { id: 'pages', label: 'Page Builder', href: '/pages', icon: 'layout', group: 'Structure', permissions: [['pages', 'view']] },
            { id: 'collections', label: 'Collections', href: '/collections', icon: 'collection', group: 'Content', permissions: [['collections', 'view'], ['content', 'view']] },
            { id: 'localization', label: 'Localization', href: '/localization', icon: 'globe', group: 'Content', permissions: [['localization', 'view']] },
            { id: 'engagement', label: 'Push Engagement', href: '/engagement', icon: 'chat', group: 'Content', permissions: [['notifications', 'send']] },
            { id: 'styles', label: 'Component Styles', href: '/styles', icon: 'swatch', group: 'Design', permissions: [['components', 'view']] },
            { id: 'marketing', label: 'Marketing Page', href: '/marketing', icon: 'megaphone', group: 'Design', permissions: [['marketing', 'view']] },
            { id: 'billing', label: 'Billing & Plans', href: '/billing', icon: 'payment', group: 'Business', permissions: [['subscriptions', 'view']] }
        ]
    },
    {
        id: 'identity',
        label: 'Identity',
        icon: 'users',
        href: '/identity',
        permissions: [['users', 'view']],
        items: [
            { id: 'users', label: 'All Users', href: '/identity/users', icon: 'users', permissions: [['users', 'view']] },
            { id: 'auth', label: 'Authentication', href: '/identity/authentication', icon: 'lock', permissions: [['settings', 'view']] },
            { id: 'providers', label: 'SSO Providers', href: '/identity/providers', icon: 'key', permissions: [['settings', 'manage']] },
            { id: 'oauth-clients', label: 'OAuth Clients', href: '/identity/oauth-clients', icon: 'key', permissions: [['settings', 'manage']] },
            { id: 'login-config', label: 'Login Configuration', href: '/identity/login-config', icon: 'cog', permissions: [['settings', 'write']] },
            { id: 'communication', label: 'Communication', href: '/identity/communication', icon: 'chat', permissions: [['settings', 'edit']] }
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'cog',
        href: '/settings',
        items: [
            { id: 'admin-users', label: 'Admin Users', href: '/settings/admin-users', icon: 'shield', permissions: [['admin-users', 'view']] },
            { id: 'roles', label: 'Roles & Permissions', href: '/settings/roles', icon: 'key', permissions: [['roles', 'view']] },
            { id: 'applications', label: 'Applications', href: '/settings/applications', icon: 'collection', permissions: [['applications', 'view']] },
            { id: 'email-templates', label: 'Email Templates', href: '/settings/email-templates', icon: 'mail', permissions: [['settings', 'edit']] },
            { id: 'settings', label: 'System Settings', href: '/settings', icon: 'cog', permissions: [['settings', 'view']] }
        ]
    },
    {
        id: 'database',
        label: 'Database',
        icon: 'database',
        href: '/database',
        permissions: [['database', 'view']],
        items: [
            { id: 'database', label: 'Database Explorer', href: '/database', icon: 'database', permissions: [['database', 'view']] }
        ]
    }
]

// Simple icon component
const Icon = ({ name, className = 'w-5 h-5' }: { name: string; className?: string }) => {
    const icons: Record<string, JSX.Element> = {
        'chart-bar': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        'shield': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
        'layout': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
        'cog': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        'screens': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>,
        'logout': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
        'menu': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
        'x': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
        'paint': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
        'collection': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
        'users': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        'circle': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><circle cx="12" cy="12" r="3" strokeWidth={2} /></svg>,
        'chat': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
        'globe': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a13.8 13.8 0 00-3.6 9 13.8 13.8 0 003.6 9 13.8 13.8 0 003.6-9A13.8 13.8 0 0012 3z" /></svg>,
        'document-text': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        'megaphone': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A2.419 2.419 0 013 11.267V8.733a2.419 2.419 0 012.436-2.417" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882l7.597 1.583A2 2 0 0120 9.417v3.166a2 2 0 01-1.403 1.917L11 16.082M11 5.882V16.082" /></svg>,
        'user': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        'activity': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        'settings': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        'payment': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
        'lock': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        'key': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
        'swatch': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
        'database': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
        'server': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
        'mail': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    }
    return icons[name] || <span className={className}>•</span>
}

// Inner layout component that uses permissions
function AdminLayoutInner({ children }: AdminLayoutProps) {
    const router = useRouter()
    const pathname = usePathname() || ''
    const currentSearch = '' // Simplified for minimal design
    const { theme, setTheme } = useTheme()
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showAccountSettings, setShowAccountSettings] = useState(false)
    
    // Get permission context
    const { hasAnyPermission, isSuperAdmin, isLoading: permissionsLoading } = usePermissions()

    // Filter navigation based on permissions
    const filteredNavigationHubs = useMemo(() => {
        return navigationHubs
            .map(hub => {
                // Filter items within the hub
                const filteredItems = hub.items.filter(item => {
                    if (isSuperAdmin) return true
                    if (!item.permissions || item.permissions.length === 0) return true
                    return hasAnyPermission(item.permissions)
                })
                
                return { ...hub, items: filteredItems }
            })
            .filter(hub => {
                // Hide hub if it has no accessible items
                if (hub.items.length === 0) return false
                // Check hub-level permissions
                if (isSuperAdmin) return true
                if (!hub.permissions || hub.permissions.length === 0) return true
                return hasAnyPermission(hub.permissions)
            })
    }, [hasAnyPermission, isSuperAdmin])

    // Check auth on mount
    useEffect(() => {
        const storedUser = authService.getUser()
        if (!authService.isAuthenticated()) {
            router.push('/login')
        } else {
            setUser(storedUser)
        }
        setIsLoading(false)
    }, [router])

    const handleLogout = async () => {
        await authService.logout()
        router.push('/login')
    }

    const handleHubClick = (href: string) => {
        router.push(href)
    }

    // Determine active hub based on pathname
    const activeHub = filteredNavigationHubs.find(hub => {
        if (hub.id === 'content') {
            return pathname.startsWith('/collections') || 
                   pathname.startsWith('/appearance') || 
                   pathname.startsWith('/navigation') ||
                   pathname.startsWith('/pages') ||
                   pathname.startsWith('/flows') ||
                   pathname.startsWith('/styles') ||
                   pathname.startsWith('/localization') ||
                   pathname.startsWith('/engagement') ||
                   pathname.startsWith('/billing') ||
                   pathname.startsWith('/marketing')
        }
        if (hub.id === 'identity') {
            return pathname.startsWith('/identity')
        }
        if (hub.id === 'database') {
            return pathname.startsWith('/database')
        }
        return pathname.startsWith(hub.href)
    }) || filteredNavigationHubs[0]

    const getModuleTitle = () => {
        if (!activeHub) return 'Dashboard'
        const item = activeHub.items.find(i => pathname.startsWith(i.href))
        return item?.label || activeHub.label
    }

    if (isLoading || permissionsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // Handle case where no navigation hubs are available (no permissions)
    if (!activeHub) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have permission to access any modules.</p>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        aria-label="Sign Out"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            </div>
        )
    }

    return (
        <Fragment>
            <div className="h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col overflow-hidden">
            {/* Top Header Bar (Full Width) */}
            <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between px-4 lg:px-8 relative z-50 shrink-0 shadow-sm shadow-gray-200/20 dark:shadow-zinc-900/20">
                <div className="flex items-center space-x-6">
                    {/* Brand Logo - Moved to Header */}
                    <div className="flex items-center group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-600/25 mr-4 group-hover:shadow-blue-600/40 transition-all duration-300">
                            A
                        </div>
                        <div className="hidden md:block overflow-hidden whitespace-nowrap">
                            <h1 className="font-bold text-gray-900 dark:text-white tracking-tight text-xl leading-none mb-0.5">AppKit</h1>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest leading-none">Platform</p>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        className="lg:hidden p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 hover:scale-105"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open mobile menu"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Vertical Divider */}
                    <div className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-zinc-800 mx-6" />

                    {/* Page Title */}
                    <div className="hidden sm:block">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{getModuleTitle()}</h2>
                    </div>
                </div>

                <div className="flex items-center space-x-4 md:space-x-6">
                    {/* Search field */}
                    <div className="hidden md:flex items-center relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                            <Search className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 bg-gray-100/50 dark:bg-zinc-800/50 border border-gray-200/50 dark:border-zinc-700/50 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm w-48 lg:w-64 transition-all duration-200 placeholder-gray-400"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl group" aria-label="Notifications" title="Notifications">
                        <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                    </button>

                    {/* User Profile Popover */}
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200 group">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/25 group-hover:shadow-blue-600/40 transition-all duration-300">
                                {user?.firstName?.[0] || 'A'}
                            </div>
                            <div className="hidden sm:block text-left pr-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none capitalize">{user?.firstName}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase mt-0.5 tracking-wider">{user?.role || 'Admin'}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" />
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
                            <Menu.Items className="absolute right-0 mt-4 w-72 origin-top-right divide-y divide-gray-100/50 dark:divide-zinc-800/50 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-50 border border-gray-200/50 dark:border-zinc-800/50">
                                <div className="px-5 py-4">
                                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-1">Signed in as</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">{user?.email}</p>
                                </div>

                                <div className="p-3 space-y-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button className={`${active ? 'bg-gray-50/80 dark:bg-zinc-800/80' : ''} flex w-full items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 rounded-xl transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-zinc-800/80`}>
                                                <User className="w-4 h-4 mr-3 text-gray-400" />
                                                Your Profile
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button 
                                                onClick={() => setShowAccountSettings(true)}
                                                className={`${active ? 'bg-gray-50/80 dark:bg-zinc-800/80' : ''} flex w-full items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 rounded-xl transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-zinc-800/80`}>
                                                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                                                Account Settings
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>

                                <div className="p-4">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-3">Appearance</p>
                                    <div className="grid grid-cols-3 gap-1.5 bg-gray-50/50 dark:bg-zinc-950/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-zinc-800/50">
                                        {[
                                            { id: 'light', icon: Sun, label: 'Light' },
                                            { id: 'dark', icon: Moon, label: 'Dark' },
                                            { id: 'system', icon: Monitor, label: 'System' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`
                                                    flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-200
                                                    ${theme === t.id 
                                                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20' 
                                                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                                                    }
                                                `}
                                            >
                                                <t.icon className="w-4 h-4 mb-1" />
                                                <span className="text-[9px] font-bold">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button 
                                                onClick={handleLogout}
                                                className={`${active ? 'bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'} flex w-full items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:bg-red-50/80 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400`}>
                                                <LogOut className="w-4 h-4 mr-3 text-red-500" />
                                                Sign Out
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </header>

            {/* Layout Body (Sidebars + Main Content) */}
            <div className="flex flex-1 overflow-hidden">
                {/* 1. Primary Sidebar */}
                <aside 
                    className="hidden lg:flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 z-40 flex-shrink-0 w-16 rounded-r-xl"
                >
                    {/* System Navigation Hubs */}
                    <nav className="flex-1 space-y-1 py-2 flex flex-col items-center">
                        {filteredNavigationHubs.map((hub) => {
                            const isHubActive = activeHub.id === hub.id
                            return (
                                <Tooltip key={hub.id} content={hub.label} position="right">
                                    <button
                                        onClick={() => handleHubClick(hub.href)}
                                        className={`group transition-all duration-200 w-10 h-10 flex items-center justify-center rounded-sm ${
                                            isHubActive
                                                ? 'bg-black text-white'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                                        }`}
                                    >
                                        <Icon name={hub.icon} className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${isHubActive ? 'text-white' : ''}`} />
                                    </button>
                                </Tooltip>
                            )
                        })}
                    </nav>

                    <div className="py-2 flex flex-col items-center space-y-1">
                        <Tooltip content="Sandbox" position="right">
                            <button 
                                onClick={() => router.push('/sandbox')}
                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-gray-800 transition-all duration-200 rounded-xl"
                                aria-label="Open Sandbox"
                                title="Open Sandbox"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </button>
                        </Tooltip>
                        <Tooltip content="Developer Hub" position="right">
                            <button 
                                onClick={() => router.push('/dev-hub')}
                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all duration-200 rounded-xl"
                                aria-label="Developer Hub"
                                title="Developer Hub"
                            >
                                <Icon name="server" className="w-4 h-4" />
                            </button>
                        </Tooltip>
                        <Tooltip content="Settings" position="right">
                            <button 
                                onClick={() => router.push('/settings')}
                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all duration-200 rounded-xl"
                                aria-label="Settings"
                                title="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    </div>
                </aside>

                {/* 2. Secondary Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 z-30 flex-shrink-0">
                    <div className="h-12 flex items-center px-3 border-b border-gray-200 dark:border-gray-800">
                        {activeHub.id === 'content' ? (
                            <div className="w-full">
                                <AppSwitcher />
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{activeHub.label}</h2>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 overflow-y-auto py-2">
                        {(() => {
                            // Group items by group name for all hubs that have groups
                            if (activeHub.items.some(item => item.group)) {
                                const groupedItems = activeHub.items.reduce((acc: Record<string, NavItem[]>, item: NavItem) => {
                                    const group = item.group || 'General'
                                    if (!acc[group]) acc[group] = []
                                    acc[group].push(item)
                                    return acc
                                }, {} as Record<string, NavItem[]>)

                                return Object.entries(groupedItems).map(([groupName, items]) => (
                                    <div key={groupName} className="mb-2">
                                        <h3 className="px-3 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">
                                            {groupName}
                                        </h3>
                                        {items.map((item: NavItem) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <div key={item.id} className="mx-2">
                                                    <button
                                                        onClick={() => router.push(item.href)}
                                                        className={`w-full flex items-center px-5 py-2 text-sm font-mono transition-all duration-200 rounded-sm ${
                                                            isActive
                                                                ? 'bg-black text-white'
                                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                        }`}
                                                    >
                                                    <Icon 
                                                        name={item.icon}
                                                        className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} 
                                                    />
                                                    {item.label}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))
                            } else {
                                // Simple list for hubs without groups
                                return activeHub.items.map((item) => {
                                    const isActive = pathname === item.href
                                    
                                    return (
                                        <div key={item.id} className="mx-2">
                                            <button
                                                onClick={() => router.push(item.href)}
                                                className={`w-full flex items-center px-5 py-2 text-sm font-mono transition-all duration-200 rounded-sm ${
                                                    isActive
                                                        ? 'bg-black text-white'
                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                }`}
                                            >
                                                <Icon 
                                                    name={item.icon}
                                                    className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} 
                                                />
                                                {item.label}
                                            </button>
                                        </div>
                                    )
                                })
                            } 
                        })()}
                    </nav>
                </aside>

                {/* 3. Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50 dark:bg-zinc-950">
                    {/* Render page content */}
                    <main className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
                        <div className="p-6 w-full mx-auto">
                            {children}
                        </div>
                    </main>

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div 
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                                onClick={() => setMobileMenuOpen(false)}
                            />
                            <div className="relative flex flex-col w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl h-full animate-in slide-in-from-left border-r border-gray-200/50 dark:border-zinc-800/50">
                                <div className="p-6 border-b border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                                    <AppSwitcher />
                                    <button onClick={() => setMobileMenuOpen(false)} className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200" aria-label="Close mobile menu" title="Close menu">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <nav className="flex-1 overflow-y-auto p-5">
                                    {filteredNavigationHubs.map(hub => (
                                        <div key={hub.id} className="mb-8">
                                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-4 mb-4">{hub.label}</div>
                                            {hub.items.map(item => {
                                                // Check if this item has child routes
                                                const hasChildRoutes = hub.items.some(
                                                    other => other.id !== item.id && other.href.startsWith(item.href + '/')
                                                )
                                                const isActive = hasChildRoutes 
                                                    ? pathname === item.href 
                                                    : pathname.startsWith(item.href)
                                                
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => { router.push(item.href); setMobileMenuOpen(false) }}
                                                        className={`w-full flex items-center px-8 py-3 text-sm font-medium rounded-xl mb-2 transition-all duration-200 ${
                                                            isActive ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white border border-transparent'
                                                        }`}
                                                    >
                                                        <Icon 
                                                            name={(item as any).icon} 
                                                            className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} 
                                                        />
                                                        {item.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
            
            {/* Account Settings Modal */}
            <AccountSettingsModal 
                isOpen={showAccountSettings} 
                onClose={() => setShowAccountSettings(false)} 
            />
        </Fragment>
    )
}

// Export wrapped component with PermissionProvider
export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <PermissionProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </PermissionProvider>
    )
}
