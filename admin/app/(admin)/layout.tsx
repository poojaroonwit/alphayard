'use client'

import React, { useState, useEffect, Fragment } from 'react'
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

interface AdminLayoutProps {
    children: React.ReactNode
}

// Global Hub Navigation
const navigationHubs = [
    {
        id: 'you',
        label: 'You',
        icon: 'user',
        href: '/dashboard',
        items: [
            { id: 'profile', label: 'My Profile', href: '/profile', icon: 'user' },
            { id: 'activity', label: 'Activity', href: '/activity', icon: 'activity' },
            { id: 'preferences', label: 'Preferences', href: '/preferences', icon: 'settings' }
        ]
    },
    {
        id: 'overview',
        label: 'App Overview',
        icon: 'chart-bar',
        href: '/dashboard',
        items: [
            { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'chart-bar' }
        ]
    },
    {
        id: 'content',
        label: 'App Content',
        icon: 'layout',
        href: '/appearance',
        items: [
            { id: 'config', label: 'App Config', href: '/appearance', icon: 'paint' },
            { id: 'screens', label: 'Global Screens', href: '/navigation?tab=screens', icon: 'screens' },
            { id: 'navigation', label: 'App Menu', href: '/navigation?tab=navigation', icon: 'layout' },
            { id: 'flows', label: 'User Flows', href: '/flows', icon: 'circle' },
            { id: 'pages', label: 'Page Builder', href: '/pages', icon: 'layout' },
            { id: 'collections', label: 'Collections', href: '/collections', icon: 'collection' },
            { id: 'localization', label: 'Localization', href: '/localization', icon: 'globe' },
            { id: 'engagement', label: 'Push Engagement', href: '/engagement', icon: 'chat' },
            { id: 'styles', label: 'Component Styles', href: '/styles', icon: 'swatch' },
            { id: 'marketing', label: 'Marketing Page', href: '/marketing', icon: 'megaphone' },
            { id: 'billing', label: 'Billing & Plans', href: '/billing', icon: 'payment' }
        ]
    },
    {
        id: 'identity',
        label: 'Identity',
        icon: 'users',
        href: '/identity',
        items: [
            { id: 'users', label: 'All Users', href: '/identity/users', icon: 'users' },
            { id: 'auth', label: 'Authentication', href: '/identity/authentication', icon: 'lock' }
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'cog',
        href: '/settings',
        items: [
            { id: 'admin-users', label: 'Admin Users', href: '/settings/admin-users', icon: 'shield' },
            { id: 'applications', label: 'Applications', href: '/settings/applications', icon: 'collection' },
            { id: 'settings', label: 'System Settings', href: '/settings', icon: 'cog' }
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
        'payment': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    }
    return icons[name] || <span className={className}>•</span>
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter()
    const pathname = usePathname() || ''
    const { theme, setTheme } = useTheme()
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

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
        setIsExpanded(false) // Collapse on selection
    }

    // Determine active hub based on pathname
    const activeHub = navigationHubs.find(hub => {
        if (hub.id === 'you') {
            return pathname === '/dashboard' || pathname === '/profile' || pathname === '/activity' || pathname === '/preferences'
        }
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
        return pathname.startsWith(hub.href)
    }) || navigationHubs[0]

    const getModuleTitle = () => {
        const item = activeHub.items.find(i => pathname.startsWith(i.href))
        return item?.label || activeHub.label
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            <div className={`relative z-50 transition-all duration-500 ${activeHub.id === 'you' ? 'h-28' : 'h-16'}`}>
                {/* 1. SELECTION TABS (Sub-menu) - Slides up from behind the header to sit ABOVE it */}
                <Transition
                    show={activeHub.id === 'you'}
                    as={Fragment}
                    enter="transition ease-out duration-500 transform"
                    enterFrom="translate-y-16 opacity-0"
                    enterTo="translate-y-0 opacity-100"
                    leave="transition ease-in duration-300 transform"
                    leaveFrom="translate-y-0 opacity-100"
                    leaveTo="translate-y-16 opacity-0"
                >
                    <div className="absolute top-0 left-0 right-0 h-12 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 flex items-center px-6 gap-6 z-40 overflow-x-auto no-scrollbar">
                        {activeHub.items.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => router.push(item.href)}
                                    className={`flex items-center gap-2 h-full px-1 border-b-2 transition-all relative ${
                                        isActive 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <Icon name={item.icon || 'circle'} className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                                    {isActive && <div className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-blue-600 rounded-full" />}
                                </button>
                            )
                        })}
                    </div>
                </Transition>

                {/* Top Header Bar (Full Width) - Slid down when sub-menu active */}
                <header className={`h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-6 absolute left-0 right-0 z-50 shrink-0 transition-all duration-500 ${activeHub.id === 'you' ? 'top-12' : 'top-0'}`}>
                <div className="flex items-center space-x-4">
                    {/* Brand Logo - Moved to Header */}
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-sm shadow-md mr-3">
                            A
                        </div>
                        <div className="hidden md:block overflow-hidden whitespace-nowrap">
                            <h1 className="font-bold text-gray-900 dark:text-white tracking-tight text-lg leading-none">Appkit</h1>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest leading-normal">Platform</p>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ml-2"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    
                    {/* Vertical Divider */}
                    <div className="hidden lg:block h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-4" />

                    {/* Page Title */}
                    <h2 className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-200">{getModuleTitle()}</h2>
                </div>

                <div className="flex items-center space-x-3 md:space-x-6">
                    {/* Search field */}
                    <div className="hidden md:flex items-center relative">
                        <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search..."
                            className="pl-10 pr-4 py-1.5 bg-gray-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-blue-500 rounded-lg text-sm w-48 lg:w-64 transition-all"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
                    </button>

                    {/* User Profile Popover */}
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                {user?.firstName?.[0] || 'A'}
                            </div>
                            <div className="hidden sm:block text-left pr-2">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none capitalize">{user?.firstName}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase mt-0.5 tracking-wider">{user?.role || 'Admin'}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
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
                            <Menu.Items className="absolute right-0 mt-3 w-64 origin-top-right divide-y divide-gray-100 dark:divide-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="px-4 py-4">
                                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-widest">Signed in as</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-0.5">{user?.email}</p>
                                </div>

                                <div className="p-2 space-y-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button className={`${active ? 'bg-gray-50 dark:bg-zinc-800' : ''} flex w-full items-center px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 rounded-xl transition-colors`}>
                                                <User className="w-4 h-4 mr-3 text-gray-400" />
                                                Your Profile
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button className={`${active ? 'bg-gray-50 dark:bg-zinc-800' : ''} flex w-full items-center px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 rounded-xl transition-colors`}>
                                                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                                                Account Settings
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>

                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2">Appearance</p>
                                    <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl">
                                        {[
                                            { id: 'light', icon: Sun, label: 'Light' },
                                            { id: 'dark', icon: Moon, label: 'Dark' },
                                            { id: 'system', icon: Monitor, label: 'System' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`
                                                    flex flex-col items-center justify-center py-2 rounded-lg transition-all
                                                    ${theme === t.id 
                                                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5' 
                                                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                                    }
                                                `}
                                            >
                                                <t.icon className="w-4 h-4 mb-1" />
                                                <span className="text-[9px] font-bold">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-2">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button 
                                                onClick={handleLogout}
                                                className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'} flex w-full items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors`}
                                            >
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
            </div>

            {/* Layout Body (Sidebars + Main Content) */}
            <div className="flex flex-1 overflow-hidden">
                {/* 1. Primary Sidebar */}
                <aside 
                    onMouseEnter={() => setIsExpanded(true)}
                    onMouseLeave={() => setIsExpanded(false)}
                    className={`hidden lg:flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-40 flex-shrink-0 transition-all duration-300 ease-in-out ${
                        isExpanded ? 'w-56' : 'w-[60px]'
                    }`}
                >
                    {/* System Navigation Hubs */}
                    <nav className={`flex-1 space-y-1 ${isExpanded ? 'px-3 pt-4' : 'px-0 pt-4 flex flex-col items-center'}`}>
                        {navigationHubs.map((hub) => {
                            const isHubActive = activeHub.id === hub.id
                            return (
                                <Tooltip key={hub.id} content={isExpanded ? '' : hub.label} position="right" delay={100}>
                                    <button
                                        onClick={() => handleHubClick(hub.href)}
                                        className={`group transition-all duration-200 rounded-xl ${
                                            isExpanded 
                                                ? 'w-full flex items-center px-2 py-2 gap-3' 
                                                : 'w-10 h-10 flex items-center justify-center'
                                        } ${
                                            isHubActive
                                                ? 'bg-gray-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-zinc-700 shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon name={hub.icon} className={`w-6 h-6 flex-shrink-0 ${isHubActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        {isExpanded && (
                                            <span className="font-medium overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                                                {hub.label}
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>
                            )
                        })}
                    </nav>

                    <div className="pb-8 flex flex-col items-center">
                        <div className="h-px w-8 bg-gray-200 dark:bg-zinc-800 mb-6" />
                        <Tooltip content="Settings" position="right">
                            <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <Settings className="w-6 h-6" />
                            </button>
                        </Tooltip>
                    </div>
                </aside>

                {/* 2. Secondary Sidebar */}
                <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 z-30 flex-shrink-0 animate-in slide-in-from-left duration-300">
                    <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                        {activeHub.id === 'content' ? (
                            <div className="w-full">
                                <AppSwitcher />
                            </div>
                        ) : (
                            <h2 className="px-2 font-semibold text-gray-900 dark:text-white truncate">{activeHub.label}</h2>
                        )}
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {activeHub.items.map((item) => {
                            const currentSearch = typeof window !== 'undefined' ? window.location.search : ''
                            const fullPath = pathname + currentSearch
                            
                            let isActive = false
                            if (item.href.includes('?')) {
                                isActive = fullPath === item.href
                                // Default tab highlight (screens) if on /navigation with no query
                                if (!currentSearch && pathname === '/navigation' && item.id === 'screens') {
                                    isActive = true
                                }
                            } else {
                                isActive = pathname.startsWith(item.href)
                            }
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                        isActive
                                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white border border-transparent'
                                    }`}
                                >
                                    <Icon 
                                        name={(item as any).icon} 
                                        className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} 
                                    />
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* 3. Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50 dark:bg-zinc-950">
                    {/* Render page content */}
                    <main className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
                        <div className="p-4 w-full mx-auto">
                            {children}
                        </div>
                    </main>

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div 
                                className="fixed inset-0 bg-black/80 transition-opacity" 
                                onClick={() => setMobileMenuOpen(false)}
                            />
                            <div className="relative flex flex-col w-72 bg-white dark:bg-zinc-900 h-full animate-in slide-in-from-left border-r border-gray-200 dark:border-zinc-800">
                                <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                                    <AppSwitcher />
                                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <nav className="flex-1 overflow-y-auto p-4">
                                    {navigationHubs.map(hub => (
                                        <div key={hub.id} className="mb-6">
                                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-4 mb-2">{hub.label}</div>
                                            {hub.items.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => { router.push(item.href); setMobileMenuOpen(false) }}
                                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-colors ${
                                                        pathname.startsWith(item.href) ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                                >
                                                    <Icon 
                                                        name={(item as any).icon} 
                                                        className={`w-5 h-5 mr-3 ${pathname.startsWith(item.href) ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} 
                                                    />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


