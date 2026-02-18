'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { AppUpdateConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { RocketLaunchIcon, ArrowDownCircleIcon, ShieldCheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface AppUpdateSettingsProps {
    updates: AppUpdateConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function AppUpdateSettings({ updates, setBranding }: AppUpdateSettingsProps) {
    
    const updateSettings = (field: keyof AppUpdateConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            updates: { ...prev.updates, [field]: value }
        }))
    }

    const guideUsage = `const { updates } = useConfig();\n\nif (isOlder(currentVersion, updates.minVersion)) {\n  showUpdateModal(updates.storeUrl, updates.forceUpdate);\n}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <RocketLaunchIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">App Version Control</CardTitle>
                            <CardDescription>Manage mandatory updates and version compliance.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Version Manager"
                        idLabel="Config Type"
                        idValue="Force Update"
                        usageExample={guideUsage}
                        devNote="Minimum version should match your build number (e.g., 1.2.0)."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ArrowDownCircleIcon className="w-3.5 h-3.5" />
                            Minimum Allowed Version
                        </label>
                        <Input 
                            value={updates.minVersion}
                            onChange={(e) => updateSettings('minVersion', e.target.value)}
                            placeholder="e.g. 1.2.5"
                            className="text-sm font-mono"
                        />
                        <p className="text-[10px] text-gray-400">Users on versions lower than this will be prompted to update.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <GlobeAltIcon className="w-3.5 h-3.5" />
                            App Store / Play Store URL
                        </label>
                        <Input 
                            value={updates.storeUrl}
                            onChange={(e) => updateSettings('storeUrl', e.target.value)}
                            placeholder="https://apps.apple.com/..."
                            className="text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/30 border border-amber-100 md:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <ShieldCheckIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Force Update (Strict Mode)</h4>
                                <p className="text-xs text-amber-800/60">If enabled, users cannot bypass the update screen. Use only for critical security fixes.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateSettings('forceUpdate', !updates.forceUpdate)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${updates.forceUpdate ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${updates.forceUpdate ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
