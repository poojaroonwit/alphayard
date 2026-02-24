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
        <aside className="hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 z-40 flex-shrink-0 w-[68px]">
            {/* Brand Mark */}
            <div className="h-16 flex items-center justify-center border-b border-white/5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap className="w-5 h-5 text-white" />
                </div>
            </div>

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
                                        ? 'bg-white/15 text-white shadow-lg shadow-blue-500/10'
                                        : 'text-slate-400 hover:text-white hover:bg-white/8'
                                }`}
                            >
                                {/* Active indicator bar */}
                                {isHubActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full shadow-sm shadow-blue-400/50" />
                                )}
                                <Icon 
                                    name={hub.icon} 
                                    className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                                        isHubActive ? 'text-white drop-shadow-sm' : 'group-hover:scale-105'
                                    }`} 
                                />
                            </button>
                        </Tooltip>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="py-4 flex flex-col items-center space-y-1.5 border-t border-white/5">
                <Tooltip content="Settings" position="right">
                    <button 
                        onClick={() => onHubClick('/system')}
                        className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all duration-200 rounded-xl"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </Tooltip>
            </div>
        </aside>
    )
}
