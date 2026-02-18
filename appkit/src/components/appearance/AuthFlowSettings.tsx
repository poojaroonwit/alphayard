'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { BrandingConfig, AuthFlowConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { 
    KeyIcon, 
    ShieldCheckIcon, 
    AtSymbolIcon, 
    DocumentTextIcon, 
    LockClosedIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface AuthFlowSettingsProps {
    type: 'login' | 'signup'
    config: AuthFlowConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function AuthFlowSettings({ type, config, setBranding }: AuthFlowSettingsProps) {
    
    const updateConfig = (field: keyof AuthFlowConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                flows: {
                    ...prev.flows,
                    [type]: { ...prev.flows[type as 'login' | 'signup'], [field]: value }
                }
            }
        })
    }

    const guideUsage = `// Mobile Implementation:\nconst { flows } = useTheme();\n\nif (flows.${type}.requireEmailVerification) {\n  navigate('EmailVerification');\n}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                            type === 'login' ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                        )}>
                            <KeyIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg capitalize">{type} Journey Configuration</CardTitle>
                            <CardDescription>Logical rules for the user {type} experience.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title={`${type === 'login' ? 'Login' : 'Signup'} Logic`}
                        idLabel="Flow ID"
                        idValue={`auth_${type}`}
                        usageExample={guideUsage}
                        devNote="These rules are purely behavioral and should be enforced by both the UI and your API security layer."
                        buttonVariant="labeled"
                        buttonLabel="Logic Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Security Column */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Security & Verification</label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-900">Require Verification</div>
                                        <div className="text-[10px] text-gray-500">Must verify email to proceed.</div>
                                    </div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={config.requireEmailVerification}
                                    onChange={(e) => updateConfig('requireEmailVerification', e.target.checked)}
                                    className="toggle-switch"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <AtSymbolIcon className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-900">Allow Social Login</div>
                                        <div className="text-[10px] text-gray-500">Google, Apple, etc.</div>
                                    </div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={config.allowSocialLogin}
                                    onChange={(e) => updateConfig('allowSocialLogin', e.target.checked)}
                                    className="toggle-switch"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Policy Column */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Policy & Experience</label>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                                    Terms Acceptance
                                </label>
                                <select 
                                    value={config.termsAcceptedOn}
                                    onChange={(e) => updateConfig('termsAcceptedOn', e.target.value)}
                                    className="content-input text-xs"
                                >
                                    <option value="signup">During Signup (Recommended)</option>
                                    <option value="login">Upon Login</option>
                                    <option value="both">Both Steps</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <LockClosedIcon className="w-4 h-4 text-gray-400" />
                                    Password Strength
                                </label>
                                <select 
                                    value={config.passwordPolicy}
                                    onChange={(e) => updateConfig('passwordPolicy', e.target.value)}
                                    className="content-input text-xs"
                                >
                                    <option value="standard">Standard (6+ chars)</option>
                                    <option value="strong">Strong (Caps, Numbers, Special)</option>
                                    <option value="custom">Enterprise Custom</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                    <ExclamationCircleIcon className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                        <div className="text-xs font-bold text-amber-900">Contextual Compliance</div>
                        <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                            Changing these rules will affect how the mobile app handles {type} sessions. Ensure your backend validation matches these settings to prevent security mismatches.
                        </p>
                    </div>
                </div>

            </CardBody>
        </Card>
    )
}
