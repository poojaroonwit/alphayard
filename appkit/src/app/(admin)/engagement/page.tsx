'use client'

import React, { useState, useEffect } from 'react'
import { EngagementSettings } from '../../../components/appearance/EngagementSettings'
import { useApp } from '../../../contexts/AppContext'
import { Button } from '../../../components/ui/Button'
import { adminService } from '../../../services/adminService'
import { toast } from '@/hooks/use-toast'
import { BrandingConfig } from '../../../components/appearance/types'
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export default function EngagementPage() {
    const { currentApp, refreshApplications } = useApp()
    const [branding, setBranding] = useState<BrandingConfig | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (currentApp?.branding) {
             const sourceBranding = currentApp.branding
             // Initialize with defaults if needed, similar to AppearanceManager
             const safeBranding = {
                ...sourceBranding,
                engagement: sourceBranding.engagement || { pushEnabled: true, oneSignalAppId: '', firebaseConfig: '', defaultDeepLink: '' }
             }
             setBranding(safeBranding as BrandingConfig)
        }
    }, [currentApp])

    const handleSave = async () => {
        if (!currentApp || !branding) return
        setIsSaving(true)
        try {
             // We only need to save the engagement part really, but the API might expect full branding
             // or we can upsert just the engagement part if the API supports partial updates on 'branding' key?
             // AppearanceManager sends "brandingPayload" which is full branding.
             // adminService.upsertApplicationSetting updates 'branding' key.
             
             // To be safe and consistent with AppearanceManager, we save the updated branding object.
             // However, strictly speaking, we might overwrite other appearance changes if this page has stale branding data?
             // But since we load from currentApp which is refreshed, it should be fine as long as we don't have concurrent editing.
             
             await adminService.upsertApplicationSetting({ 
                setting_key: 'branding', 
                setting_value: branding 
            })
            
            toast({ title: "Settings Saved", description: "Engagement configuration updated." })
            await refreshApplications()
        } catch (error) {
            console.error('Failed to save engagement settings:', error)
            toast({ title: "Save failed", description: "Could not save settings.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    if (!currentApp) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                    <DevicePhoneMobileIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">No App Selected</h2>
                <p className="text-gray-500 mt-2">Please select an application to manage engagement.</p>
            </div>
        )
    }

    if (!branding) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-2xl font-bold text-gray-900">Push Engagement</h1>
                     <p className="text-gray-500">Manage push notifications and user engagement.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            <EngagementSettings 
                engagement={branding.engagement} 
                setBranding={setBranding as any} 
            />
        </div>
    )
}
