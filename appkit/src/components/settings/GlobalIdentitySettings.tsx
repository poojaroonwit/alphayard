'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { GlobalIdentityConfig, AuthFlowConfig } from '../appearance/types'
import { MobileGuide } from '../ui/MobileGuide'
import { 
    FingerPrintIcon, 
    TagIcon, 
    ShieldCheckIcon, 
    UserIcon,
    GlobeAltIcon,
    ClockIcon,
    HashtagIcon
} from '@heroicons/react/24/outline'

interface GlobalIdentitySettingsProps {
    config: GlobalIdentityConfig
    onChange: (config: GlobalIdentityConfig) => void
}

export function GlobalIdentitySettings({ config, onChange }: GlobalIdentitySettingsProps) {
    
    // Helper to update nested auth flow configs
    const updateAuthFlow = (type: 'login' | 'signup', field: keyof AuthFlowConfig, value: any) => {
        onChange({
            ...config,
            [type]: { ...config[type], [field]: value }
        })
    }

    // Helper to update tagging config
    const updateTagging = (field: any, value: any) => {
        onChange({
            ...config,
            tagging: { ...config.tagging, [field]: value }
        })
    }

    const guideUsage = `// Global Auth Check
if (GlobalIdentity.login.requireEmailVerification) {
  await verifyEmail();
}

// Activity Tagging
if (GlobalIdentity.tagging.enabled) {
  User.addTag(GlobalIdentity.tagging.tagFormat.replace('{app_id}', currentApp.id));
}`

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <GlobeAltIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Global IdentityScope</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Authentication rules defined here apply to <strong>all applications</strong> in your organization. 
                        User accounts are shared across the platform.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Login & Signup Column */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                        <CardHeader className="border-b border-gray-100/50 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Authentication Rules</CardTitle>
                                    <CardDescription>Unified Login & Signup policies.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="p-5 space-y-6">
                            {/* Login Rules */}
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Login Experience</label>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-xs font-medium text-gray-700">Require Email Verification</span>
                                    <input 
                                        type="checkbox" 
                                        checked={config.login.requireEmailVerification}
                                        onChange={(e) => updateAuthFlow('login', 'requireEmailVerification', e.target.checked)}
                                        className="toggle-switch"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-xs font-medium text-gray-700">Social Login (Google/Apple)</span>
                                    <input 
                                        type="checkbox" 
                                        checked={config.login.allowSocialLogin}
                                        onChange={(e) => updateAuthFlow('login', 'allowSocialLogin', e.target.checked)}
                                        className="toggle-switch"
                                    />
                                </div>
                            </div>

                            {/* Signup Rules */}
                             <div className="space-y-3 pt-3 border-t border-gray-100">
                                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Signup Experience</label>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-xs font-medium text-gray-700">Terms Acceptance</span>
                                    <select 
                                        value={config.signup.termsAcceptedOn}
                                        onChange={(e) => updateAuthFlow('signup', 'termsAcceptedOn', e.target.value)}
                                        className="text-xs bg-transparent border-none font-bold text-gray-900 focus:ring-0 text-right cursor-pointer"
                                    >
                                        <option value="signup">On Signup</option>
                                        <option value="login">On Login</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-xs font-medium text-gray-700">Password Policy</span>
                                    <select 
                                        value={config.signup.passwordPolicy}
                                        onChange={(e) => updateAuthFlow('signup', 'passwordPolicy', e.target.value)}
                                        className="text-xs bg-transparent border-none font-bold text-gray-900 focus:ring-0 text-right cursor-pointer"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="strong">Strong (Recommended)</option>
                                    </select>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* User Tagging Column */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                        <CardHeader className="border-b border-gray-100/50 pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <TagIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">User Activity Tagging</CardTitle>
                                        <CardDescription>Track cross-app engagement.</CardDescription>
                                    </div>
                                </div>
                                <MobileGuide 
                                    title="Activity Tagging"
                                    idLabel="Scope"
                                    idValue="Global"
                                    usageExample={guideUsage}
                                    devNote="Tags are applied asynchronously on the backend."
                                    buttonVariant="icon"
                                    buttonLabel="Tagging Guide"
                                />
                            </div>
                        </CardHeader>
                        <CardBody className="p-5 space-y-6">
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">Enable Auto-Tagging</div>
                                    <div className="text-xs text-gray-500">Automatically tag users based on activity.</div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={config.tagging.enabled}
                                    onChange={(e) => updateTagging('enabled', e.target.checked)}
                                    className="toggle-switch-emerald"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                        <HashtagIcon className="w-3.5 h-3.5 text-emerald-500" />
                                        Tag Format Pattern
                                    </label>
                                    <input 
                                        value={config.tagging.tagFormat}
                                        onChange={(e) => updateTagging('tagFormat', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono text-emerald-700 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-gray-300"
                                        placeholder="active_app_{id}"
                                    />
                                    <p className="text-[10px] text-gray-400">Available variables: {'{app_id}'}, {'{app_name}'}, {'{date}'}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                        <ClockIcon className="w-3.5 h-3.5 text-emerald-500" />
                                        Tag Expiration (Days)
                                    </label>
                                    <input 
                                        type="number"
                                        value={config.tagging.sessionDurationDays}
                                        onChange={(e) => updateTagging('sessionDurationDays', parseInt(e.target.value))}
                                        className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono text-gray-900 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
                                    />
                                    <p className="text-[10px] text-gray-400">0 for no expiration (permanent tags).</p>
                                </div>
                            </div>

                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}
