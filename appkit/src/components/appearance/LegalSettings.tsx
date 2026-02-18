'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { LegalConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { ScaleIcon, ShieldCheckIcon, DocumentTextIcon, EnvelopeIcon, LinkIcon } from '@heroicons/react/24/outline'

interface LegalSettingsProps {
    legal: LegalConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function LegalSettings({ legal, setBranding }: LegalSettingsProps) {
    
    const updateSettings = (field: keyof LegalConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            legal: { ...prev.legal, [field]: value }
        }))
    }

    const guideUsage = `const { legal } = useConfig();\n\nconst openPrivacy = () => Linking.openURL(legal.privacyPolicyUrl);`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <ScaleIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Legal & Compliance</CardTitle>
                            <CardDescription>Manage mandatory legal documents and regulatory info.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Legal Manager"
                        idLabel="Config Type"
                        idValue="Compliance Hub"
                        usageExample={guideUsage}
                        devNote="Legal links are typically displayed in the 'About' or 'Settings' screen of the mobile app."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <DocumentTextIcon className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-sm font-bold text-gray-900">Mandatory Documents</h4>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Privacy Policy URL
                        </label>
                        <Input 
                            value={legal.privacyPolicyUrl}
                            onChange={(e) => updateSettings('privacyPolicyUrl', e.target.value)}
                            placeholder="https://example.com/privacy"
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Terms of Service URL
                        </label>
                        <Input 
                            value={legal.termsOfServiceUrl}
                            onChange={(e) => updateSettings('termsOfServiceUrl', e.target.value)}
                            placeholder="https://example.com/terms"
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Cookie Policy URL
                        </label>
                        <Input 
                            value={legal.cookiePolicyUrl}
                            onChange={(e) => updateSettings('cookiePolicyUrl', e.target.value)}
                            placeholder="https://example.com/cookies"
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <EnvelopeIcon className="w-3.5 h-3.5" />
                            Data Request/Support Email
                        </label>
                        <Input 
                            value={legal.dataRequestEmail}
                            onChange={(e) => updateSettings('dataRequestEmail', e.target.value)}
                            placeholder="legal@example.com"
                            className="text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 md:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <ShieldCheckIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-indigo-900">Store Compliance Status</h4>
                                <p className="text-xs text-indigo-800/60">Having these URLs configured is mandatory for App Store and Google Play Review.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
