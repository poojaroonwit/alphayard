'use client'

import React from 'react'
import { type NavHub, type NavItem } from './AdminNavigation'

interface AdminSidebarMenuProps {
    activeHub: NavHub
    pathname: string
    onNavigate: (path: string) => void
    IconComponent: React.ComponentType<{ name: string; className?: string }>
}

export function AdminSidebarMenu({ 
    activeHub, 
    pathname, 
    onNavigate,
    IconComponent: Icon 
}: AdminSidebarMenuProps) {
    // Group items by group name
    const groupedItems = React.useMemo(() => {
        return activeHub.items.reduce((acc: Record<string, NavItem[]>, item: NavItem) => {
            const group = item.group || 'General'
            if (!acc[group]) acc[group] = []
            acc[group].push(item)
            return acc
        }, {} as Record<string, NavItem[]>)
    }, [activeHub.items])

    return (
        <aside className="hidden lg:flex flex-col w-[260px] bg-white dark:bg-zinc-950 border-r border-gray-200/80 dark:border-zinc-800/80 z-30 flex-shrink-0">
            {/* Hub Label */}
            <div className="px-5 pt-7 pb-2 border-b border-gray-100 dark:border-zinc-800/80 mb-3">
                <h2 className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.08em]">
                    {activeHub.label}
                </h2>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
                {Object.entries(groupedItems).map(([groupName, items]) => (
                    <div key={groupName}>
                        {activeHub.items.some(i => i.group) && (
                            <h3 className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-[0.1em]">
                                {groupName}
                            </h3>
                        )}
                        <div className="space-y-0.5">
                            {items.map((item: NavItem) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavigate(item.href)}
                                        className={`w-full flex items-center px-3 py-2 text-[13px] font-medium transition-all duration-150 rounded-lg group ${
                                            isActive
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 mr-3 flex items-center justify-center transition-colors ${
                                            isActive 
                                                ? 'text-blue-500 dark:text-blue-400' 
                                                : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300'
                                        }`}>
                                            <Icon 
                                                name={item.icon}
                                                className="w-[18px] h-[18px]"
                                            />
                                        </span>
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    )
}
