'use client'

import React from 'react'
import { AppSwitcher } from './AppSwitcher'
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
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 z-30 flex-shrink-0">
            <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
                <div className="w-full">
                    <AppSwitcher />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-6">
                {Object.entries(groupedItems).map(([groupName, items]) => (
                    <div key={groupName}>
                        {activeHub.items.some(i => i.group) && (
                            <h3 className="px-6 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {groupName}
                            </h3>
                        )}
                        <div className="px-3 space-y-1">
                            {items.map((item: NavItem) => {
                                const isActive = pathname === item.href
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavigate(item.href)}
                                        className={`w-full flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl ${
                                            isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                        }`}
                                    >
                                        <Icon 
                                            name={item.icon}
                                            className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} 
                                        />
                                        {item.label}
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
