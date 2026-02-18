'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { SecurityConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { OTPInput } from '../ui/OTPInput'
import { ShieldCheckIcon, ClockIcon, NoSymbolIcon, FingerPrintIcon } from '@heroicons/react/24/outline'

interface SecuritySettingsProps {
    security: SecurityConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function SecuritySettings({ security, setBranding }: SecuritySettingsProps) {
    
    const updateSettings = (field: keyof SecurityConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            security: { ...prev.security, [field]: value }
        }))
    }

    const guideUsage = `const { security } = useConfig();\n\nif (security.disableScreenshots) {\n  ScreenGuard.preventScreenshot();\n}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Security & Access</CardTitle>
                            <CardDescription>Manage user session safety and data protection.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Security Manager"
                        idLabel="Config Type"
                        idValue="Access Control"
                        usageExample={guideUsage}
                        devNote="Session timeout is measured in minutes of inactivity."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Session Timeout (Minutes)
                        </label>
                        <Input 
                            type="number"
                            value={security.sessionTimeout}
                            onChange={(e) => updateSettings('sessionTimeout', parseInt(e.target.value))}
                            placeholder="60"
                            className="text-sm"
                        />
                    </div>

                    <div className="flex flex-col justify-center">
                         <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 h-full">
                            <div className="flex gap-3">
                                <NoSymbolIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Prevent Screenshots</h4>
                                    <p className="text-[10px] text-gray-500">Block screen capture on Android/iOS.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => updateSettings('disableScreenshots', !security.disableScreenshots)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${security.disableScreenshots ? 'bg-red-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${security.disableScreenshots ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-4 p-4 rounded-2xl bg-rose-50/30 border border-rose-100 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                    <FingerPrintIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-rose-900">Mandatory Biometric MFA</h4>
                                    <p className="text-xs text-rose-800/60">Require FaceID or Fingerprint before accessing the application dashboard.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => updateSettings('mandatoryMFA', !security.mandatoryMFA)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${security.mandatoryMFA ? 'bg-rose-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${security.mandatoryMFA ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        
                        {security.mandatoryMFA && (
                            <div className="mt-4 pt-4 border-t border-rose-100/50">
                                <label className="text-[10px] uppercase font-black text-rose-400 tracking-widest mb-3 block">MFA OTP Component Preview</label>
                                <div className="flex justify-center">
                                    <OTPInput length={4} onComplete={(code) => console.log('MFA Preview Code:', code)} />
                                </div>
                                <p className="text-[10px] text-rose-400 italic mt-3 text-center">This component will be used for secondary fallback verification.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
