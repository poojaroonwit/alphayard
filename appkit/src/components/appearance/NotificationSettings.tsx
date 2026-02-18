'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { NotificationConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { BellSnoozeIcon, PaintBrushIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { ColorPickerPopover } from '../ui/ColorPickerPopover'

interface NotificationSettingsProps {
    notifications: NotificationConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function NotificationSettings({ notifications, setBranding }: NotificationSettingsProps) {
    
    const updateColor = (color: any) => {
        setBranding((prev: any) => ({
            ...prev,
            notifications: { ...prev.notifications, primaryColor: color }
        }))
    }

    const guideUsage = `const { notifications } = useConfig();\n\n// Android uses primaryColor for accents\nPushNotifications.setAccentColor(notifications.primaryColor.solid);`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                            <BellSnoozeIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Notifications</CardTitle>
                            <CardDescription>Customize push notification appearance.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Notification Manager"
                        idLabel="Consumption"
                        idValue="Push Bundle"
                        usageExample={guideUsage}
                        devNote="On iOS, the icon is strictly managed by the app bundle, but colors can be used in Rich Notifications."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8">
                        {/* Accent Color */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                    <PaintBrushIcon className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900">Accent Color</h4>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed"> Used for notification icons and small elements on Android devices. Highly recommended to match your brand colors.</p>
                            <div className="pt-2">
                                 <ColorPickerPopover 
                                    value={notifications.primaryColor} 
                                    onChange={updateColor}
                                    label="Notification Color"
                                 />
                            </div>
                        </div>

                        {/* Notification Icon */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                    <PhotoIcon className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900">Default Icon</h4>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">The fallback large icon used when no image is attached to a push notification.</p>
                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-300">
                                 <PhotoIcon className="w-8 h-8" />
                                 <span className="text-[10px] mt-1 font-bold">256x256</span>
                            </div>
                        </div>
                    </div>

                    {/* High-Fidelity Hub Preview */}
                    <div className="hidden lg:block space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Mobile Lock Screen Preview</label>
                        <div className="flex justify-center py-8 bg-gray-50/50 rounded-3xl border border-gray-100 sticky top-4">
                            {/* Device Frame */}
                            <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] shadow-[0_0_0_12px_#111827,0_20px_50px_-10px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-gray-900/5">
                                {/* Device Notch/Dynamic Island */}
                                <div className="absolute top-0 inset-x-0 h-7 bg-black z-20 flex justify-center">
                                    <div className="h-6 w-32 bg-black rounded-b-2xl"></div>
                                </div>
                                
                                {/* Status Bar */}
                                <div className="absolute top-2 inset-x-0 px-6 flex justify-between items-center text-white text-[10px] font-medium z-20">
                                    <span>9:41</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-2.5 rounded-[3px] border border-white/40 relative">
                                            <div className="absolute inset-0.5 bg-white rounded-[1px]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallpaper */}
                                <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop)' }}>
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                                </div>

                                {/* Lock Screen Clock */}
                                <div className="absolute top-16 inset-x-0 text-center z-10 space-y-1">
                                    <div className="text-6xl font-[200] text-white/90 font-sans">9:41</div>
                                    <div className="text-sm font-medium text-white/80">Monday, June 3</div>
                                </div>

                                {/* Notification Stack */}
                                <div className="absolute top-44 inset-x-0 px-3 z-10">
                                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 animate-in slide-in-from-bottom-8 duration-700">
                                        <div className="flex items-start gap-3">
                                            <div 
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                                                style={{ backgroundColor: notifications.primaryColor.mode === 'solid' ? (notifications.primaryColor.solid as string) : '#FFB6C1' }}
                                            >
                                                <BellSnoozeIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">APP NAME</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-medium">now</span>
                                                </div>
                                                <div className="font-semibold text-gray-900 text-xs mt-0.5">
                                                    Special Offer Revealed!
                                                </div>
                                                <div className="text-[11px] text-gray-700 leading-snug mt-0.5">
                                                    Explore our brand new collection with styles tailored just for you.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stack effect behind */}
                                    <div className="mx-2 mt-2 h-2 bg-white/30 backdrop-blur-md rounded-xl"></div>
                                </div>

                                {/* Bottom Actions */}
                                <div className="absolute bottom-8 inset-x-12 flex justify-between z-10">
                                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                                        <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                                        <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Home Indicator */}
                                <div className="absolute bottom-2 inset-x-0 flex justify-center z-20">
                                    <div className="w-28 h-1 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
