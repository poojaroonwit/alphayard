'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '../../../contexts/AppContext'
import { Button } from '../../../components/ui/Button'
import { 
    PresentationChartLineIcon,
    Bars3Icon,
    KeyIcon,
    RocketLaunchIcon,
    UserCircleIcon,
    ClipboardDocumentCheckIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

// Component Imports
import { OnboardingSettings } from '../../../components/appearance/OnboardingSettings'
import { SurveySettings } from '../../../components/appearance/SurveySettings'
import { BrandingConfig } from '../../../components/appearance/types'

const CategoryIcons: Record<string, React.ReactNode> = {
  onboarding: <PresentationChartLineIcon className="w-5 h-5" />,
  survey: <SparklesIcon className="w-5 h-5" />,
}

export default function FlowsPage() {
    const { currentApp, refreshApplications, isLoading: appLoading } = useApp()
    const [selectedCategory, setSelectedCategory] = useState('onboarding')
    const [branding, setBranding] = useState<BrandingConfig | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (currentApp?.settings?.branding) {
            setBranding(currentApp.settings.branding)
        } else if (currentApp) {
             setBranding({} as BrandingConfig)
        }
    }, [currentApp])

    const handleSave = async () => {
        // ...
        setIsSaving(true)
        try {
            const updatedSettings = {
                ...(currentApp?.settings || {}),
                branding: branding
            }
            console.log('Saving Flows Config:', updatedSettings)
            await new Promise(resolve => setTimeout(resolve, 800))
            await refreshApplications()
        } finally {
            setIsSaving(false)
        }
    }

    if (appLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!currentApp) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                Application not found.
            </div>
        )
    }

    const sidebarCategories = [
        { id: 'group-welcome', name: 'Discovery & Intro', isHeader: true },
        { id: 'onboarding', name: 'App Onboarding', icon: 'onboarding' },
        
        { id: 'group-conversion', name: 'Data & Growth', isHeader: true },
        { id: 'survey', name: 'User Surveys', icon: 'survey' },
    ]

    return (
        <div className="min-h-screen bg-transparent">
            <div className="w-full mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 lg:px-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Journey Flows</h1>
                        <p className="text-gray-500 mt-2 text-lg">Logic and behavioral paths for <span className="font-semibold text-gray-900">{currentApp.name}</span></p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <div className="sticky top-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden text-sm">
                            <nav className="p-3 space-y-1">
                                {sidebarCategories.map((cat) => (
                                    cat.isHeader ? (
                                        <div key={cat.id} className="px-3 py-2 mt-4 first:mt-0">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.name}</span>
                                        </div>
                                    ) : (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={clsx(
                                                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group',
                                                selectedCategory === cat.id
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    'transition-colors duration-200',
                                                    selectedCategory === cat.id ? 'text-purple-100' : 'text-gray-400 group-hover:text-purple-600'
                                                )}>
                                                    {CategoryIcons[cat.id]}
                                                </div>
                                                <span className="font-medium">{cat.name}</span>
                                            </div>
                                        </button>
                                    )
                                ))}
                            </nav>

                             {/* Global Auth Link */}
                             <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl mx-3">
                                <div className="text-[10px] font-bold text-blue-900 uppercase">Authentication</div>
                                <p className="text-xs text-blue-800 mt-1 mb-2">Login & Signup rules are now managed globally.</p>
                                <a href="/identity/authentication" className="block text-center text-xs font-bold text-white bg-blue-600 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                                    Go to Global Auth
                                </a>
                             </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0 pb-20">
                        <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-1 min-h-[600px] transition-all">
                            
                            {selectedCategory === 'onboarding' && <OnboardingSettings onboarding={branding?.flows?.onboarding || { enabled: true, slides: [], isSkippable: true }} setBranding={setBranding} />}
                            {selectedCategory === 'survey' && <SurveySettings survey={branding?.flows?.survey || { enabled: false, trigger: 'after_onboarding', slides: [] }} setBranding={setBranding} />}

                            <div className="mt-8 flex justify-end px-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-11 px-10 bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200 transition-all hover:scale-[1.02]"
                                >
                                    {isSaving ? 'Deploying Flow...' : 'Synchronize User Journey'}
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
