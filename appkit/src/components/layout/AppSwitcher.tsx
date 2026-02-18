'use client'

import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'

export function AppSwitcher() {
    const { currentApp, setCurrentApp, applications, isLoading } = useApp()
    const [isOpen, setIsOpen] = useState(false)

    if (isLoading) {
        return <div className="h-10 w-full bg-gray-800 animate-pulse rounded-lg"></div>
    }

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 flex items-center justify-between px-3 hover:bg-gray-100/50 rounded-xl transition-all duration-200 group"
            >
                <div className="flex items-center min-w-0">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-gray-50 border border-gray-100 overflow-hidden shadow-sm">
                        {currentApp?.branding?.logo ? (
                            <img src={currentApp.branding.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                {currentApp?.name?.[0] || 'B'}
                            </div>
                        )}
                    </div>
                    <div className="ml-3 text-left overflow-hidden">
                        <span className="block text-sm font-semibold text-gray-900 truncate">
                            {currentApp?.name || 'Select App'}
                        </span>
                    </div>
                </div>
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1 max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch Application</span>
                        </div>
                        {applications.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => {
                                    setCurrentApp(app)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${
                                    currentApp?.id === app.id ? 'bg-blue-50/50' : ''
                                }`}
                            >
                                <div className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center bg-gray-100 border border-gray-200 overflow-hidden">
                                     {app.branding?.logo ? (
                                        <img src={app.branding.logo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-500">{app.name?.[0]}</span>
                                    )}
                                </div>
                                <span className={`flex-1 truncate ${currentApp?.id === app.id ? 'text-blue-600 font-semibold' : 'text-gray-700 font-medium'}`}>
                                    {app.name}
                                </span>
                                {currentApp?.id === app.id && (
                                    <CheckIcon className="w-4 h-4 text-blue-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
