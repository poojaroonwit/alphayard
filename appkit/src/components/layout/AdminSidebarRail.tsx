'use client'

import React from 'react'
import { Settings } from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'
import { type NavHub } from './AdminNavigation'

interface AdminSidebarRailProps {
    hubs: NavHub[]
    activeHubId: string
    onHubClick: (href: string) => void
    onNavigate: (path: string) => void
    IconComponent: React.ComponentType<{ name: string; className?: string }>
}

export function AdminSidebarRail({ 
    hubs, 
    activeHubId, 
    onHubClick, 
    onNavigate,
    IconComponent: Icon 
}: AdminSidebarRailProps) {
    // Separate system hub from the rest so it can be pinned to the bottom
    const mainHubs = hubs.filter((hub) => hub.id !== 'system')
    const systemHub = hubs.find((hub) => hub.id === 'system')

    return (
        <aside className="hidden lg:flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 z-30 flex-shrink-0 w-[68px]">
            {/* Hub Navigation */}
            <nav className="flex-1 pt-4 pb-4 flex flex-col items-center space-y-1.5">
                {mainHubs.map((hub) => {
                    const isHubActive = activeHubId === hub.id
                    return (
                        <Tooltip key={hub.id} content={hub.label} position="right">
                            <button
                                onClick={() => onHubClick(hub.href)}
                                className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-250 ${
                                    isHubActive
                                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-white shadow-sm'
                                        : 'text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'
                                }`}
                            >
                                {/* Active indicator bar */}
                                {isHubActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                                )}
                                <Icon 
                                    name={hub.icon} 
                                    className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                                        isHubActive ? 'text-blue-600 dark:text-white' : 'group-hover:scale-105'
                                    }`} 
                                />
                            </button>
                        </Tooltip>
                    )
                })}
            </nav>

            {/* Settings always pinned at the bottom */}
            <div className="py-4 flex flex-col items-center space-y-1.5 border-t border-gray-100 dark:border-zinc-800">
                <Tooltip content={systemHub?.label || 'Settings'} position="right">
                    <button 
                        onClick={() => onHubClick(systemHub?.href || '/system')}
                        title="Open system settings"
                        className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${
                            activeHubId === 'system'
                                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-white shadow-sm'
                                : 'text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'
                        }`}
                    >
                        {activeHubId === 'system' && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                        )}
                        <Settings className="w-5 h-5" />
                    </button>
                </Tooltip>
            </div>
        </aside>
    )
}
