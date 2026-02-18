'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { FeatureTogglesConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { AdjustmentsHorizontalIcon, PowerIcon, MoonIcon, ChatBubbleLeftRightIcon, GiftIcon } from '@heroicons/react/24/outline'

interface FeatureTogglesProps {
    features: FeatureTogglesConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function FeatureToggles({ features, setBranding }: FeatureTogglesProps) {
    if (!features) return null;
    
    const toggleFeature = (field: keyof Omit<FeatureTogglesConfig, 'maintenanceMessage'>) => {
        setBranding((prev: any) => ({
            ...prev,
            features: { 
                ...prev.features, 
                [field]: !prev.features[field] 
            }
        }))
    }

    const updateMessage = (value: string) => {
        setBranding((prev: any) => ({
            ...prev,
            features: { ...prev.features, maintenanceMessage: value }
        }))
    }

    const ToggleIcon = ({ enabled, activeIcon: Active, inactiveIcon: Inactive }: { enabled: boolean, activeIcon: any, inactiveIcon: any }) => (
        <div className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
            <Active className="w-5 h-5" />
        </div>
    )

    const guideUsage = `const { features } = useConfig();\n\nif (features.isMaintenanceMode) {\n  return <Maintenance message={features.maintenanceMessage} />\n}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <AdjustmentsHorizontalIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">App Toggles</CardTitle>
                            <CardDescription>Remotely control features and app status.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Remote Config"
                        idLabel="Sync Mode"
                        idValue="Real-time / Start-up"
                        usageExample={guideUsage}
                        devNote="Enable listeners to update the UI instantly when these toggles change."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-8">
                
                {/* Maintenance Mode */}
                <div className={`p-5 rounded-2xl border transition-all ${features.isMaintenanceMode ? 'bg-rose-50 border-rose-100' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${features.isMaintenanceMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-gray-200 text-gray-500'}`}>
                                <PowerIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold ${features.isMaintenanceMode ? 'text-rose-900' : 'text-gray-900'}`}>Maintenance Mode</h4>
                                <p className="text-xs text-gray-500">Locks the app and shows a message to all users.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleFeature('isMaintenanceMode')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${features.isMaintenanceMode ? 'bg-rose-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${features.isMaintenanceMode ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                    {features.isMaintenanceMode && (
                        <textarea 
                            value={features.maintenanceMessage}
                            onChange={(e) => updateMessage(e.target.value)}
                            className="w-full text-sm p-3 rounded-xl border border-rose-200 bg-white placeholder-rose-300 focus:ring-2 focus:ring-rose-500/20 outline-none resize-none h-20 text-rose-800"
                            placeholder="Maintenance Message..."
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Chat Toggle */}
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white group hover:border-indigo-200 transition-all cursor-pointer" onClick={() => toggleFeature('enableChat')}>
                        <div className="flex items-start justify-between">
                            <ToggleIcon enabled={features.enableChat} activeIcon={ChatBubbleLeftRightIcon} inactiveIcon={ChatBubbleLeftRightIcon} />
                            <button className={`w-8 h-4 rounded-full relative transition-colors ${features.enableChat ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${features.enableChat ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <h5 className="mt-3 text-sm font-semibold text-gray-900 font-sans">Chat Module</h5>
                        <p className="text-[10px] text-gray-400">Manage real-time conversations.</p>
                    </div>

                    {/* referral Toggle */}
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white group hover:border-indigo-200 transition-all cursor-pointer" onClick={() => toggleFeature('enableReferral')}>
                        <div className="flex items-start justify-between">
                            <ToggleIcon enabled={features.enableReferral} activeIcon={GiftIcon} inactiveIcon={GiftIcon} />
                            <button className={`w-8 h-4 rounded-full relative transition-colors ${features.enableReferral ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${features.enableReferral ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <h5 className="mt-3 text-sm font-semibold text-gray-900">Referral Program</h5>
                        <p className="text-[10px] text-gray-400">Incentivize user growth.</p>
                    </div>

                    {/* dark mode Toggle */}
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white group hover:border-indigo-200 transition-all cursor-pointer" onClick={() => toggleFeature('enableDarkMode')}>
                        <div className="flex items-start justify-between">
                            <ToggleIcon enabled={features.enableDarkMode} activeIcon={MoonIcon} inactiveIcon={MoonIcon} />
                            <button className={`w-8 h-4 rounded-full relative transition-colors ${features.enableDarkMode ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${features.enableDarkMode ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <h5 className="mt-3 text-sm font-semibold text-gray-900">Dark Mode</h5>
                        <p className="text-[10px] text-gray-400">System-wide dark theme support.</p>
                    </div>
                </div>

            </CardBody>
        </Card>
    )
}
