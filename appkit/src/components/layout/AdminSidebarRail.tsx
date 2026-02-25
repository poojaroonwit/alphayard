'use client'

import React from 'react'
import { Settings, Zap } from 'lucide-react'
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
    return (
        <aside className="hidden lg:flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200/80 dark:border-zinc-800/80 z-40 flex-shrink-0 w-[68px]">
            {/* Spacer */}
            <div className="h-16 flex items-center justify-center border-b border-gray-100 dark:border-zinc-800/80" />

            {/* Hub Navigation */}
            <nav className="flex-1 py-4 flex flex-col items-center space-y-1.5">
                {hubs.map((hub) => {
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

            {/* Bottom Actions */}
            <div className="py-4 flex flex-col items-center space-y-1.5 border-t border-gray-100 dark:border-zinc-800/80">
                <Tooltip content="Settings" position="right">
                    <button 
                        onClick={() => onHubClick('/system')}
                        className="w-11 h-11 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-all duration-200 rounded-xl"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </Tooltip>
            </div>
        </aside>
    )
}
