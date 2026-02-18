'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { AnnouncementConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { MegaphoneIcon, LinkIcon, InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface AnnouncementSettingsProps {
    announcements: AnnouncementConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function AnnouncementSettings({ announcements, setBranding }: AnnouncementSettingsProps) {
    
    const updateAnnouncement = (field: keyof AnnouncementConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            announcements: { ...prev.announcements, [field]: value }
        }))
    }

    const typeIcons = {
        info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
        success: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
        warning: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
        error: <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />
    }

    const guideUsage = `const { announcements } = useConfig();\n\nif (announcements.enabled) {\n  return <Banner text={announcements.text} color={announcements.type} />;\n}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <MegaphoneIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Announcement Banners</CardTitle>
                            <CardDescription>Broadcase messages and marketing banners to all users.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Announcement Manager"
                        idLabel="Config Type"
                        idValue="Marketing Banner"
                        usageExample={guideUsage}
                        devNote="The banner automatically appears at the top of the Home screen when enabled."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Enable Banner</h4>
                                <p className="text-xs text-gray-500">Toggle whether the banner is visible in the mobile app.</p>
                            </div>
                            <button 
                                onClick={() => updateAnnouncement('enabled', !announcements.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${announcements.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${announcements.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500">Banner Message</label>
                                <textarea 
                                    value={announcements.text}
                                    onChange={(e) => updateAnnouncement('text', e.target.value)}
                                    className="content-input min-h-[80px] text-sm resize-none"
                                    placeholder="Enter your announcement text here..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    Action URL (Optional)
                                </label>
                                <Input 
                                    value={announcements.linkUrl}
                                    onChange={(e) => updateAnnouncement('linkUrl', e.target.value)}
                                    placeholder="https://example.com/promo"
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500">Banner Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['info', 'success', 'warning', 'error'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => updateAnnouncement('type', type)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                                                announcements.type === type 
                                                    ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/10' 
                                                    : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'
                                            }`}
                                        >
                                            {typeIcons[type]}
                                            <span className="capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Allow Dismiss</h4>
                                    <p className="text-xs text-gray-500">Let users close the banner until the next app launch.</p>
                                </div>
                                <button 
                                    onClick={() => updateAnnouncement('isDismissible', !announcements.isDismissible)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${announcements.isDismissible ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${announcements.isDismissible ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Preview */}
                    <div className="hidden lg:block space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Real-time Preview</label>
                        <div className="flex justify-center py-8 bg-gray-50/50 rounded-3xl border border-gray-100 sticky top-4">
                            {/* Device Frame */}
                            <div className="relative w-[300px] h-[600px] bg-white rounded-[3rem] shadow-[0_0_0_12px_#111827,0_20px_50px_-10px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-gray-900/5">
                                {/* Device Notch */}
                                <div className="absolute top-0 inset-x-0 h-7 bg-black z-20 flex justify-center">
                                    <div className="h-6 w-32 bg-black rounded-b-2xl"></div>
                                </div>
                                
                                {/* Status Bar */}
                                <div className="absolute top-2 inset-x-0 px-6 flex justify-between items-center text-black text-[10px] font-medium z-20">
                                    <span>9:41</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-2.5 rounded-[3px] border border-black/40 relative">
                                            <div className="absolute inset-0.5 bg-black rounded-[1px]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* App Header */}
                                <div className="pt-14 pb-4 px-6 border-b border-gray-100 flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                                    <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
                                    <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                                </div>

                                {/* Announcement Banner Simulation */}
                                {announcements.enabled && (
                                    <div className={clsx(
                                        "px-4 py-3 flex items-start gap-3 border-b animate-in slide-in-from-top-4 relative",
                                        announcements.type === 'info' && "bg-blue-50/50 border-blue-100 text-blue-700",
                                        announcements.type === 'success' && "bg-emerald-50/50 border-emerald-100 text-emerald-700",
                                        announcements.type === 'warning' && "bg-amber-50/50 border-amber-100 text-amber-700",
                                        announcements.type === 'error' && "bg-rose-50/50 border-rose-100 text-rose-700",
                                    )}>
                                        <div className="shrink-0 mt-0.5">
                                            {typeIcons[announcements.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium leading-relaxed">
                                                {announcements.text || "Your announcement text will appear here."}
                                            </p>
                                            {announcements.linkUrl && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold underline opacity-80">
                                                    Learn More <span aria-hidden="true">&rarr;</span>
                                                </div>
                                            )}
                                        </div>
                                        {announcements.isDismissible && (
                                            <button className="shrink-0 p-1 -mr-1 opacity-60 hover:opacity-100">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* App Content Simulation */}
                                <div className="p-4 space-y-4 opacity-50">
                                    <div className="h-32 rounded-2xl bg-gray-100"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                                        <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                                    </div>
                                    <div className="h-24 rounded-2xl bg-gray-100"></div>
                                    <div className="h-24 rounded-2xl bg-gray-100"></div>
                                </div>

                                {/* Home Indicator */}
                                <div className="absolute bottom-2 inset-x-0 flex justify-center z-20">
                                    <div className="w-32 h-1 bg-black/20 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
