'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { ApiConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { CommandLineIcon, GlobeAltIcon, ClockIcon, ServerIcon } from '@heroicons/react/24/outline'

interface ApiSettingsProps {
    api: ApiConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function ApiSettings({ api, setBranding }: ApiSettingsProps) {
    
    const updateSettings = (field: keyof ApiConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            api: { ...prev.api, [field]: value }
        }))
    }

    const guideUsage = `const { api } = useConfig();\n\nconst client = axios.create({\n  baseURL: api.baseUrl,\n  timeout: api.timeout\n});`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-500/20">
                            <CommandLineIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">API Environment</CardTitle>
                            <CardDescription>Configure backend connectivity and networking behavior.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="API Manager"
                        idLabel="Config Type"
                        idValue="Environment Settings"
                        usageExample={guideUsage}
                        devNote="Base URL changes will take effect on the next app restart."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ServerIcon className="w-3.5 h-3.5" />
                            Production API Base URL
                        </label>
                        <Input 
                            value={api.baseUrl}
                            onChange={(e) => updateSettings('baseUrl', e.target.value)}
                            placeholder="https://api.myapp.com/v1"
                            className="text-sm font-mono"
                        />
                        <p className="text-[10px] text-gray-400">The primary endpoint for all mobile application requests.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Request Timeout (ms)
                        </label>
                        <Input 
                            type="number"
                            value={api.timeout}
                            onChange={(e) => updateSettings('timeout', parseInt(e.target.value))}
                            placeholder="30000"
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <GlobeAltIcon className="w-3.5 h-3.5" />
                            Cache Expiry (seconds)
                        </label>
                        <Input 
                            type="number"
                            value={api.cacheExpiry}
                            onChange={(e) => updateSettings('cacheExpiry', parseInt(e.target.value))}
                            placeholder="3600"
                            className="text-sm"
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
