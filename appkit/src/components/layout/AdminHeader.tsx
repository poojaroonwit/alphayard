'use client'

import React, { Fragment, useState, useEffect, useRef } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { 
    Sun, 
    Moon, 
    Monitor, 
    LogOut, 
    Menu as MenuIcon, 
    Search,
    Bell,
    ChevronDown,
    User,
    Settings,
    Loader2,
    AppWindow,
    Circle,
    UserCircle
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { adminService } from '../../services/adminService'
import { NotificationPopover } from './NotificationPopover'

interface AdminHeaderProps {
    user: any
    moduleTitle: string
    onLogout: () => void
    onOpenMobileMenu: () => void
    onOpenAccountSettings: () => void
}

export function AdminHeader({ 
    user, 
    moduleTitle, 
    onLogout, 
    onOpenMobileMenu, 
    onOpenAccountSettings 
}: AdminHeaderProps) {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<{ applications: any[], circles: any[], users: any[] } | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Handle debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true)
                try {
                    const data = await adminService.globalSearch(searchQuery)
                    setSearchResults(data.results)
                    setIsSearchOpen(true)
                } catch (error) {
                    console.error('Search failed:', error)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults(null)
                setIsSearchOpen(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleResultClick = (type: 'app' | 'circle' | 'user', id: string, extra?: any) => {
        setIsSearchOpen(false)
        setSearchQuery('')
        if (type === 'app') router.push(`/applications/${id}`)
        if (type === 'circle') router.push(`/applications/${extra.applicationId}?tab=circles&circleId=${id}`)
        if (type === 'user') router.push(`/system?userId=${id}`)
    }

    return (
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-8 relative z-50 shrink-0 shadow-sm shadow-gray-200/20 dark:shadow-none">
            <div className="flex items-center space-x-6">
                {/* Brand Logo */}
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
                    onClick={onOpenMobileMenu}
                    aria-label="Open mobile menu"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
                
                {/* Vertical Divider */}
                <div className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-zinc-800 mx-6" />

                {/* Page Title */}
                <div className="hidden sm:block">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{moduleTitle}</h2>
                </div>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
                {/* Search field */}
                <div className="hidden md:flex items-center relative group" ref={searchRef}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </div>
                    <form onSubmit={(e) => e.preventDefault()} className="relative">
                        <input 
                            type="text" 
                            placeholder="Search apps, circles, users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                            className="pl-10 pr-12 py-2 bg-gray-100/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm w-48 lg:w-80 transition-all duration-200 placeholder-gray-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 border border-gray-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-[10px] font-medium text-gray-400 pointer-events-none">
                            <span className="text-xs">⌘</span>K
                        </div>
                    </form>

                    {/* Search Results Dropdown */}
                    <Transition
                        show={isSearchOpen}
                        as={Fragment}
                        enter="transition ease-out duration-150"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <div className="absolute top-full left-0 mt-2 w-full lg:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-[60]">
                            <div className="max-h-[80vh] overflow-y-auto">
                                {searchResults && (
                                    <div className="p-2 space-y-4">
                                        {/* Applications */}
                                        {searchResults.applications.length > 0 && (
                                            <div>
                                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Applications</p>
                                                {searchResults.applications.map(app => (
                                                    <button key={app.id} onClick={() => handleResultClick('app', app.id)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-left transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <AppWindow className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono">{app.slug}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Circles */}
                                        {searchResults.circles.length > 0 && (
                                            <div>
                                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Circles</p>
                                                {searchResults.circles.map(circle => (
                                                    <button key={circle.id} onClick={() => handleResultClick('circle', circle.id, circle)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-left transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                            <Circle className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{circle.name}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono">{circle.circleCode || 'NO-CODE'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Users */}
                                        {searchResults.users.length > 0 && (
                                            <div>
                                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Users</p>
                                                {searchResults.users.map(user => (
                                                    <button key={user.id} onClick={() => handleResultClick('user', user.id)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-left transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                            <UserCircle className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-zinc-500">{user.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {searchResults.applications.length === 0 && searchResults.circles.length === 0 && searchResults.users.length === 0 && (
                                            <div className="p-8 text-center">
                                                <p className="text-sm text-gray-500 dark:text-zinc-500">No results found for &quot;{searchQuery}&quot;</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Transition>
                </div>

                <div className="hidden xl:flex items-center gap-2">
                    <a 
                        href="/dev-hub" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors bg-gray-100/50 dark:bg-zinc-800/50 rounded-lg border border-gray-200/50 dark:border-zinc-700/50"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Full Docs
                    </a>
                </div>

                {/* Notifications */}
                <NotificationPopover user={user} />

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
                        <Menu.Items className="absolute right-0 mt-4 w-72 origin-top-right divide-y divide-gray-100 dark:divide-zinc-800 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-50 border border-gray-200 dark:border-zinc-800">
                            <div className="px-5 py-4">
                                <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">{user?.email}</p>
                            </div>

                            <div className="p-3 space-y-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button 
                                            onClick={onOpenAccountSettings}
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
                                            onClick={onLogout}
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
    )
}
