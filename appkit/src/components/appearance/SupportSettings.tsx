'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { BrandingConfig, SupportConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { 
    LifebuoyIcon, 
    ExclamationTriangleIcon, 
    ChatBubbleOvalLeftEllipsisIcon,
    LightBulbIcon,
    InboxIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface SupportSettingsProps {
    support: SupportConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function SupportSettings({ support, setBranding }: SupportSettingsProps) {
    
    const updateSupport = (field: keyof SupportConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                support: { ...prev.support, [field]: value }
            }
        })
    }

    const mockInbox = [
        { id: 1, type: 'Bug', user: 'James Wilson', content: 'The login button is flickering on iOS 17.', status: 'Open', date: '30m ago', severity: 'high' },
        { id: 2, type: 'Request', user: 'Sarah Chen', content: 'Would love to see a dark mode option in the profile.', status: 'Open', date: '4h ago', severity: 'low' },
        { id: 3, type: 'Feedback', user: 'Mike Ross', content: 'The onboarding flow is very smooth. Great job!', status: 'Resolved', date: 'Yesterday', severity: 'low' },
    ]

    const guideUsage = `const { support } = useTheme();\n\n// Toggle screens:\n{support.bugReportingEnabled && <BugReportScreen />}\n\n// Contact:\nLinking.openURL(\`mailto:\${support.supportEmail}\`);`

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
                <CardHeader className="border-b border-gray-100/50 pb-3">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <LifebuoyIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Support & Feedback Center</CardTitle>
                                <CardDescription>Manage user issues and feature requests.</CardDescription>
                            </div>
                        </div>
                        
                        <MobileGuide 
                            title="In-App Support"
                            idLabel="Routing"
                            idValue="Direct Email"
                            usageExample={guideUsage}
                            devNote="Auto-attaches device logs and OS version to every bug report."
                            buttonVariant="labeled"
                            buttonLabel="Dev Guide"
                        />
                    </div>
                </CardHeader>
                <CardBody className="p-5 space-y-8">
                    
                    {/* Operational Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className={clsx(
                            "p-5 rounded-2xl border transition-all",
                            support.bugReportingEnabled ? "bg-red-50/50 border-red-100" : "bg-gray-50 border-gray-100 opacity-60"
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <ExclamationTriangleIcon className={clsx("w-6 h-6", support.bugReportingEnabled ? "text-red-600" : "text-gray-400")} />
                                <input 
                                    type="checkbox" checked={support.bugReportingEnabled} 
                                    onChange={(e) => updateSupport('bugReportingEnabled', e.target.checked)}
                                    className="toggle-switch-red"
                                />
                            </div>
                            <div className="font-bold text-sm text-gray-900">Bug Reporting</div>
                            <p className="text-[10px] text-gray-500 mt-1">Allow users to capture screenshots and logs.</p>
                        </div>

                        <div className={clsx(
                            "p-5 rounded-2xl border transition-all",
                            support.feedbackEnabled ? "bg-amber-50/50 border-amber-100" : "bg-gray-50 border-gray-100 opacity-60"
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <ChatBubbleOvalLeftEllipsisIcon className={clsx("w-6 h-6", support.feedbackEnabled ? "text-amber-600" : "text-gray-400")} />
                                <input 
                                    type="checkbox" checked={support.feedbackEnabled} 
                                    onChange={(e) => updateSupport('feedbackEnabled', e.target.checked)}
                                    className="toggle-switch-amber"
                                />
                            </div>
                            <div className="font-bold text-sm text-gray-900">User Feedback</div>
                            <p className="text-[10px] text-gray-500 mt-1">Standard satisfaction ratings and comments.</p>
                        </div>

                        <div className={clsx(
                            "p-5 rounded-2xl border transition-all",
                            support.featureRequestsEnabled ? "bg-blue-50/50 border-blue-100" : "bg-gray-50 border-gray-100 opacity-60"
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <LightBulbIcon className={clsx("w-6 h-6", support.featureRequestsEnabled ? "text-blue-600" : "text-gray-400")} />
                                <input 
                                    type="checkbox" checked={support.featureRequestsEnabled} 
                                    onChange={(e) => updateSupport('featureRequestsEnabled', e.target.checked)}
                                    className="toggle-switch-blue"
                                />
                            </div>
                            <div className="font-bold text-sm text-gray-900">Feature Requests</div>
                            <p className="text-[10px] text-gray-500 mt-1">Community-driven roadmap and voting.</p>
                        </div>
                    </div>

                    {/* Feedback Inbox Preview */}
                    <div className="pt-4">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <InboxIcon className="w-5 h-5 text-gray-400" />
                                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Feedback Inbox Preview</label>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs h-8 group">
                                Open Full Dashboard
                                <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {mockInbox.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                            item.severity === 'high' ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                                        )} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-900">{item.user}</span>
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                                                    item.type === 'Bug' ? 'bg-red-50 text-red-600' : 
                                                    item.type === 'Request' ? 'bg-blue-50 text-blue-600' : 
                                                    'bg-gray-100 text-gray-600'
                                                )}>{item.type}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-1">{item.content}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 md:mt-0 flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                                        <span className="text-[10px] font-medium text-gray-400">{item.date}</span>
                                        <div className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-bold border",
                                            item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                        )}>
                                            {item.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Channels */}
                    <div className="pt-8 border-t border-gray-100">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Primary Support Email</label>
                                <Input 
                                    value={support.supportEmail}
                                    onChange={(e) => updateSupport('supportEmail', e.target.value)}
                                    placeholder="support@bondary.com"
                                />
                                <p className="text-[10px] text-gray-400">All bug reports will be CC'd to this address automatically.</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Help Desk / FAQ URL</label>
                                <Input 
                                    value={support.helpDeskUrl}
                                    onChange={(e) => updateSupport('helpDeskUrl', e.target.value)}
                                    placeholder="https://help.bondary.com"
                                />
                            </div>
                         </div>
                    </div>

                </CardBody>
            </Card>
        </div>
    )
}
