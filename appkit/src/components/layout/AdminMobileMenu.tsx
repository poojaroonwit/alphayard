'use client'

import React from 'react'
import { X } from 'lucide-react'
import { AppSwitcher } from './AppSwitcher'
import { type NavHub } from './AdminNavigation'

interface AdminMobileMenuProps {
    isOpen: boolean
    onClose: () => void
    hubs: NavHub[]
    pathname: string
    onNavigate: (path: string) => void
    IconComponent: React.ComponentType<{ name: string; className?: string }>
}

export function AdminMobileMenu({ 
    isOpen, 
    onClose, 
    hubs, 
    pathname, 
    onNavigate,
    IconComponent: Icon 
}: AdminMobileMenuProps) {
    if (!isOpen) return null

    return (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            <div className="relative flex flex-col w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl h-full animate-in slide-in-from-left border-r border-gray-200/50 dark:border-zinc-800/50">
                <div className="p-6 border-b border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                    <AppSwitcher />
                    <button onClick={onClose} className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200" aria-label="Close mobile menu" title="Close menu">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-5">
                    {hubs.map(hub => (
                        <div key={hub.id} className="mb-8">
                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-4">{hub.label}</div>
                            <div className="space-y-1">
                                {hub.items.map(item => {
                                    // Check if this item has child routes
                                    const hasChildRoutes = hub.items.some(
                                        other => other.id !== item.id && other.href.startsWith(item.href + '/')
                                    )
                                    const isSystemRootItem = hub.id === 'system' && item.href === '/system'
                                    const isActive = isSystemRootItem
                                        ? pathname === '/system'
                                        : hasChildRoutes
                                            ? pathname === item.href
                                            : pathname.startsWith(item.href)
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { onNavigate(item.href); onClose() }}
                                            className={`w-full flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                                isActive 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50' 
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Icon 
                                                name={item.icon} 
                                                className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} 
                                            />
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    )
}
