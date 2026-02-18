'use client'

import React, { useEffect, useState } from 'react'
import { settingsService, BrandingSettings } from '../../../services/settingsService'
import BackgroundPicker from '../../../components/inputs/BackgroundPicker'
import { BackgroundConfig } from '@/types/settings'

import { GlobalIdentitySettings } from '../../../components/settings/GlobalIdentitySettings'
import { GlobalIdentityConfig } from '../../../components/appearance/types'
import { clsx } from 'clsx'
import { PaintBrushIcon, FingerPrintIcon } from '@heroicons/react/24/outline'

const DEFAULT_BACKGROUND: BackgroundConfig = {
    type: 'gradient',
    value: '',
    gradientDirection: 'to bottom right',
    gradientStops: [
        { id: '1', color: '#f9fafb', position: 0 }, // gray-50
        { id: '2', color: '#ffffff', position: 100 } // white
    ]
}

// Mock Global State (In a real app, fetch from settingsService.getGlobalIdentity())
const DEFAULT_GLOBAL_IDENTITY: GlobalIdentityConfig = {
    login: { requireEmailVerification: false, allowSocialLogin: true, termsAcceptedOn: 'login', passwordPolicy: 'standard' },
    signup: { requireEmailVerification: true, allowSocialLogin: true, termsAcceptedOn: 'signup', passwordPolicy: 'standard' },
    tagging: { enabled: true, tagFormat: 'active_app_{slug}', sessionDurationDays: 30, triggerEvents: ['login', 'app_open'] }
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [settings, setSettings] = useState<BrandingSettings>({})
    const [identityConfig, setIdentityConfig] = useState<GlobalIdentityConfig>(DEFAULT_GLOBAL_IDENTITY)
    const [activeTab, setActiveTab] = useState<'general' | 'identity'>('general')

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        const data = await settingsService.getBranding()
        if (data) {
            setSettings(data)
        }
        // Load identity config here if backend supported
        setLoading(false)
    }

    const handleUpload = async (file: File, target: 'login' | 'applicationList') => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('isShared', 'true')

            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

            const res = await fetch(`${apiBase}/api/v1/storage/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            })

            if (!res.ok) throw new Error('Upload failed')
            const json = await res.json()
            const url = json.file?.public_url || json.file?.url || json.data?.url || ''
            
            if (url) {
                const field = target === 'login' ? 'loginBackground' : 'applicationListBackground'
                setSettings(prev => ({
                    ...prev,
                    [field]: {
                        ...(prev[field] || DEFAULT_BACKGROUND),
                        value: url
                    }
                }))
            }
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Failed to upload file. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        await settingsService.saveBranding(settings)
        // Check if we need to save identity
        console.log('Saving Global Identity:', identityConfig)
        setSaving(false)
    }

    const updateBackground = (config: BackgroundConfig) => {
        setSettings(prev => ({ ...prev, loginBackground: config }))
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-500">Manage admin appearance and global platform rules.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50 transition-colors shadow-lg shadow-gray-200"
                >
                    {saving ? 'Saving Changes...' : 'Save Configuration'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('general')}
                    className={clsx(
                        "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                        activeTab === 'general' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <PaintBrushIcon className="w-4 h-4" />
                    Appearance
                </button>
                <button
                    onClick={() => setActiveTab('identity')}
                    className={clsx(
                        "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                        activeTab === 'identity' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <FingerPrintIcon className="w-4 h-4" />
                    Global Identity
                </button>
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Login Screen Appearance</h2>
                        {/* ... Existing Login Background Code ... */}
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600">
                                Customize the background of your admin login screen.
                            </p>

                            <BackgroundPicker 
                                label="Background Style"
                                value={settings.loginBackground || DEFAULT_BACKGROUND}
                                onChange={updateBackground}
                                onUpload={(file) => handleUpload(file, 'login')}
                                isUploading={uploading}
                            />

                            {/* Preview Area */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Live Preview (Scaled Down)</label>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-300 shadow-inner">
                                     <div 
                                        className="absolute inset-0 w-full h-full"
                                        style={{
                                            background: settings.loginBackground?.type === 'solid' ? settings.loginBackground.value :
                                                        settings.loginBackground?.type === 'gradient' ? `linear-gradient(${settings.loginBackground.gradientDirection?.replace('to-', 'to ') || 'to right'}, ${settings.loginBackground.gradientStops?.map(s => `${s.color} ${s.position}%`).join(', ')})` :
                                                        undefined
                                        }}
                                     >
                                        {/* Simplified Internal Preview Logic */}
                                         {settings.loginBackground?.type === 'texture' && (
                                             <div className={`absolute inset-0 opacity-50 bg-${settings.loginBackground.value}`} />
                                         )}
                                         {['image', 'video'].includes(settings.loginBackground?.type || '') && settings.loginBackground?.value && (
                                             <img src={settings.loginBackground.value} className="w-full h-full object-cover" />
                                         )}
                                         
                                         <div className="absolute inset-0 flex bg-black/10">
                                             <div className="flex-1 p-8 flex flex-col justify-center">
                                                 <div className="h-4 w-32 bg-gray-800/20 rounded mb-2"></div>
                                                 <div className="h-2 w-48 bg-gray-600/20 rounded"></div>
                                             </div>
                                             <div className="w-[40%] bg-white m-4 rounded-lg shadow-2xl"></div>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Application List Appearance</h2>
                        
                        <div className="space-y-6">
                            <BackgroundPicker 
                                label="Background Style"
                                value={settings.applicationListBackground || DEFAULT_BACKGROUND}
                                onChange={(config) => setSettings(prev => ({ ...prev, applicationListBackground: config }))}
                                onUpload={(file) => handleUpload(file, 'applicationList')}
                                isUploading={uploading}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GlobalIdentitySettings config={identityConfig} onChange={setIdentityConfig} />
                </div>
            )}
        </div>
    )
}
