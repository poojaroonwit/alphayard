'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { AnalyticsConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { PresentationChartLineIcon, BugAntIcon, ChartBarIcon, CpuChipIcon, ChartPieIcon } from '@heroicons/react/24/outline'

interface AnalyticsSettingsProps {
    analytics: AnalyticsConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function AnalyticsSettings({ analytics, setBranding }: AnalyticsSettingsProps) {
    
    const updateSettings = (field: keyof AnalyticsConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            analytics: { ...prev.analytics, [field]: value }
        }))
    }

    const guideUsage = `const { analytics } = useConfig();\n\nif (analytics.enableDebugLogs) {\n  logger.enableProductionLogs();\n}\nSentry.init({ dsn: analytics.sentryDsn });`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <PresentationChartLineIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Analytics & Monitoring</CardTitle>
                            <CardDescription>Centralize tracking tokens and error reporting.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Analytics Manager"
                        idLabel="Config Type"
                        idValue="Monitoring Hub"
                        usageExample={guideUsage}
                        devNote="Debug logs should always be disabled for app store submissions."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <BugAntIcon className="w-3.5 h-3.5" />
                            Sentry DSN Key
                        </label>
                        <Input 
                            value={analytics.sentryDsn}
                            onChange={(e) => updateSettings('sentryDsn', e.target.value)}
                            placeholder="https://...@sentry.io/..."
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ChartBarIcon className="w-3.5 h-3.5" />
                            Mixpanel/Amplitude Token
                        </label>
                        <Input 
                            value={analytics.mixpanelToken}
                            onChange={(e) => updateSettings('mixpanelToken', e.target.value)}
                            placeholder="Your analytics token"
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ChartPieIcon className="w-3.5 h-3.5" />
                            Google Analytics ID
                        </label>
                        <Input 
                            value={analytics.googleAnalyticsId}
                            onChange={(e) => updateSettings('googleAnalyticsId', e.target.value)}
                            placeholder="G-XXXXXXXXXX"
                            className="text-sm"
                        />
                        <p className="text-xs text-gray-400">Enter your GA4 Measurement ID for this mobile app</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/30 border border-amber-100 md:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <CpuChipIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Production Debug Logs</h4>
                                <p className="text-xs text-amber-800/60">If enabled, the app will output verbose console logs in production builds. Useful for troubleshooting.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateSettings('enableDebugLogs', !analytics.enableDebugLogs)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analytics.enableDebugLogs ? 'bg-amber-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analytics.enableDebugLogs ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
