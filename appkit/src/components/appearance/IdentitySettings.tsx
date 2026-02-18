'use client'

import React, { useRef } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { BrandingConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { DevicePhoneMobileIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface IdentitySettingsProps {
    branding: BrandingConfig | null
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
    handleBrandingUpload: (field: keyof BrandingConfig, file: File) => Promise<void>
    uploading: boolean
}

export function IdentitySettings({ branding, setBranding, handleBrandingUpload, uploading }: IdentitySettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const brandingUsage = `// App Identity Usage
const { appName, logoUrl } = useTheme();
<AppLogo source={{ uri: logoUrl }} />
<Text>{appName}</Text>`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <DevicePhoneMobileIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">App Identity</CardTitle>
                            <CardDescription>Configure your app's name and logo.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="App Identity"
                        idLabel="Config Type"
                        idValue="Global Theme"
                        usageExample={brandingUsage}
                        devNote="App Name and Logo are shared resources across the entire mobile application."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-8">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">App Name</label>
                        <Input
                            value={branding?.appName || ''}
                            onChange={(e) => setBranding(prev => prev ? ({ ...prev, appName: e.target.value }) : null)}
                            placeholder="e.g. Acme Corp"
                        />
                        <p className="text-[10px] text-gray-500">Displayed on splash screen and in system dialogs.</p>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">App Logo</label>
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 flex items-center justify-center bg-gray-50 cursor-pointer transition-all overflow-hidden relative group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {branding?.logoUrl ? (
                                    <img src={branding.logoUrl} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <PhotoIcon className="w-8 h-8 text-gray-400 group-hover:scale-110 transition-transform" />
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowPathIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleBrandingUpload('logoUrl', e.target.files[0])} />
                                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full sm:w-auto">
                                    {uploading ? 'Uploading...' : 'Upload Logo'}
                                </Button>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Upload a high-res PNG (min 512x512).<br/>
                                    This will be used for your app icon and splash screen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
