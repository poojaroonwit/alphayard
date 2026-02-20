'use client'

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { BrandingConfig, EngagementConfig } from './types'
import { 
    ChatBubbleLeftRightIcon, 
    PaperAirplaneIcon, 
    ClockIcon, 
    UserGroupIcon, 
    DevicePhoneMobileIcon,
    BellAlertIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { toast } from '@/hooks/use-toast'
import { adminService } from '../../services/adminService'

interface EngagementSettingsProps {
    engagement: EngagementConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function EngagementSettings({ engagement, setBranding }: EngagementSettingsProps) {
    [composer, setComposer] = useState({
        title: '',
        message: '',
        deepLink: '',
        target: 'all'
    })
    [isSending, setIsSending] = useState(false)

    updateEngagement = (field: keyof EngagementConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                engagement: { ...prev.engagement, [field]: value }
            }
        })
    }

    handleSendPush = async () => {
        if (!composer.title || !composer.message) {
            toast({ title: 'Missing content', description: 'Please enter a title and message.', variant: 'destructive' })
            return
        }
        setIsSending(true)
        
        try {
            // Map frontend target to backend target
            let backendTarget: 'all' | 'active' | 'premium' = 'all';
            if (composer.target === 'active') backendTarget = 'active';
            // if (composer.target === 'ios' || composer.target === 'android') backendTarget = 'all'; // Default to all for OS specific for now

            result = await adminService.sendBroadcast({
                title: composer.title,
                message: composer.message,
                type: 'notification', // or 'both' if you want emails too
                target: backendTarget
            })

            newLog = {
                id: Date.now().toString(),
                title: composer.title,
                message: composer.message,
                date: 'Just now',
                sentTo: result.results?.successful || 0,
                status: result.results?.failed > 0 ? 'Partial' : 'Sent' as const
            }
    
            updateEngagement('history', [newLog, ...(engagement.history || [])])
            
            setComposer({ ...composer, title: '', message: '' })
            toast({ title: 'Push Sent!', description: `Notification broadcasted to ${result.results?.successful || 0} users.`, variant: 'success' })
        } catch (error) {
            console.error(error)
            toast({ title: 'Broadcast Failed', description: 'Could not send notifications.', variant: 'destructive' })
        } finally {
            setIsSending(false)
        }
    }

    // Use interaction history or empty array
    history = engagement.history || []

     = `// Send push via API:\nPOST /api/engagement/push\n{\n  "title": "${composer.title || 'Brand Name'}",\n  "message": "${composer.message || 'Hello World'}",\n  "target": "${composer.target}"\n}`

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
                <CardHeader className="border-b border-gray-100/50 pb-3">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Push Engagement Hub</CardTitle>
                                <CardDescription>Direct communication with your active users.</CardDescription>
                            </div>
                        </div>
                        
                        < 
                            title="Push Notifications"
                            idLabel="Provider"
                            idValue={engagement.oneSignalAppId ? 'OneSignal' : 'Firebase'}
                            usageExample={}
                            devNote="Ensure background remote notifications is enabled in Xcode capabilities."
                            buttonVariant="labeled"
                            buttonLabel="Dev Guide"
                        />
                    </div>
                </CardHeader>
                <CardBody className="p-5 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Composer */}
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Notification Composer</label>
                            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Display Title</label>
                                    <Input 
                                        value={composer.title} 
                                        onChange={(e) => setComposer({ ...composer, title: e.target.value })}
                                        placeholder="e.g. Breaking News!"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Push Message</label>
                                    <textarea 
                                        value={composer.message}
                                        onChange={(e) => setComposer({ ...composer, message: e.target.value })}
                                        className="content-input min-h-[100px] text-sm resize-none"
                                        placeholder="Enter the message users will see..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Target Audience</label>
                                        <select 
                                            value={composer.target}
                                            onChange={(e) => setComposer({ ...composer, target: e.target.value })}
                                            className="content-input text-xs"
                                        >
                                            <option value="all">Everywhere (All Users)</option>
                                            <option value="ios">iOS Only</option>
                                            <option value="android">Android Only</option>
                                            <option value="active">Recently Active</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 flex items-end">
                                        <Button 
                                            onClick={handleSendPush}
                                            disabled={isSending}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                                            {isSending ? 'Sending...' : 'Blast Push'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Preview */}
                        <div className="space-y-4 pt-4 lg:pt-0">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Real-time Preview</label>
                            <div className="flex justify-center py-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                {/* Device Frame */}
                                <div className="relative w-[280px] h-[580px] bg-gray-900 rounded-[3rem] shadow-[0_0_0_12px_#111827,0_20px_50px_-10px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-gray-900/5 scale-90 sm:scale-100 transition-transform">
                                    {/* Device Notch */}
                                    <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                                        <div className="h-5 w-24 bg-black rounded-b-xl"></div>
                                    </div>
                                    
                                    {/* Status Bar */}
                                    <div className="absolute top-2 inset-x-0 px-5 flex justify-between items-center text-white text-[9px] font-medium z-20">
                                        <span>9:41</span>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3.5 h-2 rounded-[2px] border border-white/40 relative">
                                                <div className="absolute inset-0.5 bg-white rounded-[1px]"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wallpaper */}
                                    <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop)' }}>
                                        <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[2px]"></div>
                                    </div>

                                    {/* Lock Screen Clock */}
                                    <div className="absolute top-14 inset-x-0 text-center z-10 space-y-0.5">
                                        <div className="text-5xl font-[200] text-white/95 font-sans">9:41</div>
                                        <div className="text-xs font-medium text-white/80">Monday, June 3</div>
                                    </div>

                                    {/* Notification Stack */}
                                    <div className="absolute top-40 inset-x-0 px-3 z-10">
                                        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 animate-in slide-in-from-bottom-8 duration-700">
                                            <div className="flex items-start gap-3">
                                                <div 
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600"
                                                >
                                                    <DevicePhoneMobileIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">APP NAME</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium">now</span>
                                                    </div>
                                                    <div className="font-semibold text-gray-900 text-xs mt-0.5 truncate">
                                                        {composer.title || 'Notification Title'}
                                                    </div>
                                                    <div className="text-[11px] text-gray-700 leading-snug mt-0.5 line-clamp-2">
                                                        {composer.message || 'Your push notification message will appear here for users to see.'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                         {/* Stack effect behind */}
                                        <div className="mx-2 mt-2 h-2 bg-white/30 backdrop-blur-md rounded-xl"></div>
                                    </div>

                                    {/* Bottom Actions */}
                                    <div className="absolute bottom-8 inset-x-12 flex justify-between z-10">
                                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white cursor-default">
                                            <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white cursor-default">
                                            <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Home Indicator */}
                                    <div className="absolute bottom-2 inset-x-0 flex justify-center z-20">
                                        <div className="w-24 h-1 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                         <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Recent Broadcasts</label>
                            <Button variant="ghost" size="sm" className="text-xs text-gray-500">View Full Log</Button>
                        </div>
                        <div className="space-y-2">
                            {history.length === 0 && (
                                <div className="text-center py-8 text-xs text-gray-400 italic">No push history yet. Send your first message!</div>
                            )}
                            {history.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <BellAlertIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">{log.title}</div>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                                <ClockIcon className="w-3 h-3" /> {log.date}
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <UserGroupIcon className="w-3 h-3" /> {log.sentTo} users
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                                        {log.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
                 <CardBody className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Push Configuration</label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Push Notifications</div>
                                        <div className="text-[10px] text-gray-500">Enable cloud messaging system.</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={engagement.pushEnabled}
                                        onChange={(e) => updateEngagement('pushEnabled', e.target.checked)}
                                        className="toggle-switch"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">OneSignal App ID</label>
                                    <Input 
                                        value={engagement.oneSignalAppId}
                                        onChange={(e) => updateEngagement('oneSignalAppId', e.target.value)}
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Direct Deep Links</label>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Default Notification Route</label>
                                <Input 
                                    value={engagement.defaultDeepLink}
                                    onChange={(e) => updateEngagement('defaultDeepLink', e.target.value)}
                                    placeholder="myapp://notifications"
                                />
                                <p className="text-[10px] text-gray-400 italic mt-1">Users will be directed here if no custom link is provided in the composer.</p>
                            </div>
                        </div>
                    </div>
                 </CardBody>
            </Card>
        </div>
    )
}


