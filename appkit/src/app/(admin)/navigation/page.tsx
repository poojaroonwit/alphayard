'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '../../../contexts/AppContext'
import { adminService } from '../../../services/adminService'
import { Button } from '../../../components/ui/Button'
import { 
    CheckIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { toast } from '@/hooks/use-toast'
import { useSearchParams } from 'next/navigation'

// Component Imports
import { ScreenManager } from '../../../components/appearance/ScreenManager'
import { NavigationSettings } from '../../../components/appearance/NavigationSettings'
import { BrandingConfig } from '../../../components/appearance/types'
import { WallpaperSettings } from '../../../components/appearance/WallpaperSettings'
import { Drawer } from '../../../components/ui/Drawer'


export default function NavigationPage() {
    const { currentApp, refreshApplications, isLoading: appLoading } = useApp()
    const [selectedCategory, setSelectedCategory] = useState('screens')
    const [branding, setBranding] = useState<BrandingConfig | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [activeScreenTab, setActiveScreenTab] = useState<string>('')
    const searchParams = useSearchParams()
    const tab = searchParams?.get('tab')

    useEffect(() => {
        if (tab && (tab === 'screens' || tab === 'navigation')) {
            setSelectedCategory(tab)
        }
    }, [tab])

    useEffect(() => {
        const sourceBranding = currentApp?.branding || currentApp?.settings?.branding
        if (sourceBranding) {
            setBranding({
                ...sourceBranding,
                screens: sourceBranding.screens || [],
                navigation: {
                    tabBar: sourceBranding.navigation?.tabBar || [],
                    drawer: sourceBranding.navigation?.drawer || []
                }
            } as BrandingConfig);
        } else if (currentApp) {
             setBranding({
                 screens: [],
                 navigation: { tabBar: [], drawer: [] }
             } as any as BrandingConfig)
        }
    }, [currentApp])

    const handleSave = async () => {
        if (!currentApp || !branding) return
        setIsSaving(true)
        try {
            await adminService.upsertApplicationSetting({
                setting_key: 'branding',
                setting_value: branding,
                setting_type: 'json',
                category: 'appearance',
                description: 'Mobile App Branding & Navigation Configuration',
                is_public: true
            })
            
            toast({ title: "Navigation Updated", description: "Screen inventory and app menus synchronized." })
            await refreshApplications()
        } catch (error) {
            console.error(error)
            toast({ title: "Save Failed", description: "Could not update navigation settings.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleBrandingUpload = async (field: keyof BrandingConfig, file: File, screenId?: string) => {
        // Implementation similar to AppearanceManager handleBrandingUpload
        // For now, mocking the logic as in the manager
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            const appId = (currentApp as any)._id || 'unknown';
            const fakeUrl = `https://cdn.bondary.com/apps/${appId}/${field}/${file.name}`
            
            if (screenId && field === 'screens') {
                setBranding(prev => {
                    if (!prev) return null
                    return {
                        ...prev,
                        screens: prev.screens.map(s => s.id === screenId ? { ...s, background: fakeUrl } : s)
                    }
                })
            } else {
                setBranding(prev => prev ? { ...prev, [field]: fakeUrl as any } : null)
            }
        } catch (err) {
            toast({ title: "Upload Failed", variant: "destructive" })
        }
    }

    if (appLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!currentApp || !branding) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                Application not found.
            </div>
        )
    }


    return (
        <div className="min-h-screen bg-transparent">
            <div className="w-full mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 lg:px-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">App Navigation</h1>
                        <p className="text-gray-500 mt-2 text-lg">Manage screens, modals, and menus for <span className="font-semibold text-gray-900">{currentApp.name}</span></p>
                    </div>
                    <div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-10 px-6 bg-gray-900 hover:bg-black text-white shadow-lg transition-all flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0 pb-20">
                        <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-1 min-h-[600px] transition-all">
                            
                            {selectedCategory === 'screens' && (
                                <div className="space-y-8">
                                    <ScreenManager 
                                        branding={branding} 
                                        setBranding={setBranding as any} 
                                        handleBrandingUpload={handleBrandingUpload}
                                        activeScreenTab={activeScreenTab}
                                        setActiveScreenTab={setActiveScreenTab}
                                    />
                                    
                                    <Drawer
                                        isOpen={!!activeScreenTab}
                                        onClose={() => setActiveScreenTab('')}
                                        title="Screen Configuration"
                                        side="right"
                                    >
                                        <div className="pt-2">
                                            <WallpaperSettings 
                                                branding={branding} 
                                                setBranding={setBranding as any} 
                                                activeScreenTab={activeScreenTab} 
                                                handleBrandingUpload={handleBrandingUpload} 
                                            />
                                        </div>
                                    </Drawer>
                                </div>
                            )}

                            {selectedCategory === 'navigation' && (
                                <NavigationSettings 
                                    navigation={branding.navigation} 
                                    branding={branding} 
                                    setBranding={setBranding as any} 
                                />
                            )}

                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
