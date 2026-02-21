'use client'

import React, { useState, useEffect, Fragment, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { useTheme } from 'next-themes'
import { LogOut } from 'lucide-react'
import { authService } from '../../services/authService'
import { PermissionProvider, usePermissions } from '../../contexts/PermissionContext'
import { AccountSettingsModal } from '../../components/settings/AccountSettingsModal'
import { AdminHeader } from '../../components/layout/AdminHeader'
import { AdminSidebarRail } from '../../components/layout/AdminSidebarRail'
import { AdminSidebarMenu } from '../../components/layout/AdminSidebarMenu'
import { AdminMobileMenu } from '../../components/layout/AdminMobileMenu'
import { navigationHubs, type NavHub, type NavItem, Icon } from '../../components/layout/AdminNavigation'

interface AdminLayoutProps {
    children: React.ReactNode
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
        // Handle settings pages specially since we removed the Settings hub
        if (pathname.startsWith('/settings')) {
            if (pathname.includes('/applications')) return 'Applications'
            if (pathname.includes('/team')) return 'Team'
            if (pathname.includes('/legal')) return 'Legal'
            return 'Settings'
        }
        
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
                <AdminHeader 
                    user={user}
                    moduleTitle={getModuleTitle()}
                    onLogout={handleLogout}
                    onOpenMobileMenu={() => setMobileMenuOpen(true)}
                    onOpenAccountSettings={() => setShowAccountSettings(true)}
                />

                <div className="flex flex-1 overflow-hidden">
                    <AdminSidebarRail 
                        hubs={filteredNavigationHubs}
                        activeHubId={activeHub.id}
                        onHubClick={handleHubClick}
                        onNavigate={(path) => router.push(path)}
                        IconComponent={Icon}
                    />

                    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 z-30 flex-shrink-0">
                        <AdminSidebarMenu 
                            activeHub={activeHub}
                            pathname={pathname}
                            onNavigate={(path) => router.push(path)}
                            IconComponent={Icon}
                        />
                    </aside>

                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50 dark:bg-zinc-950">
                        <main className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
                            <div className="p-6 w-full mx-auto">
                                {children}
                            </div>
                        </main>

                        <AdminMobileMenu 
                            isOpen={mobileMenuOpen}
                            onClose={() => setMobileMenuOpen(false)}
                            hubs={filteredNavigationHubs}
                            pathname={pathname}
                            onNavigate={(path) => router.push(path)}
                            IconComponent={Icon}
                        />
                    </div>
                </div>
            </div>
            
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
