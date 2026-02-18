'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { SocialLinksConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { ShareIcon, EnvelopeIcon, GlobeAltIcon, ChatBubbleLeftIcon, DevicePhoneMobileIcon, AtSymbolIcon, LinkIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface SocialSettingsProps {
    social: SocialLinksConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function SocialSettings({ social, setBranding }: SocialSettingsProps) {
    
    const updateSocial = (field: keyof SocialLinksConfig, value: string) => {
        setBranding((prev: any) => ({
            ...prev,
            social: { ...prev.social, [field]: value }
        }))
    }

    const SocialItem = ({ label, field, placeholder, icon: Icon, colorClass = "text-gray-400" }: { label: string, field: keyof SocialLinksConfig, placeholder: string, icon: any, colorClass?: string }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-50 group-focus-within:bg-blue-50 transition-colors">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <Input 
                    value={social?.[field] || ''} 
                    onChange={(e) => updateSocial(field, e.target.value)}
                    placeholder={placeholder}
                    className="text-sm pl-12 transition-all group-focus-within:pl-12 group-focus-within:ring-2 group-focus-within:ring-blue-500/20"
                />
            </div>
        </div>
    )

    const guideUsage = `const { social } = useConfig();\n\nLinking.openURL(social.helpDeskUrl);`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <ShareIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Links & Support</CardTitle>
                            <CardDescription>External connection points for your users.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Links Manager"
                        idLabel="Consumption"
                        idValue="Linking API"
                        usageExample={guideUsage}
                        devNote="Use React Native's Linking module to open these URLs safely."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-8">
                {/* Support Section */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Support Channels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SocialItem label="Support Email" field="supportEmail" placeholder="support@example.com" icon={EnvelopeIcon} colorClass="text-red-500" />
                        <SocialItem label="Help Desk URL" field="helpDeskUrl" placeholder="https://help.example.com" icon={GlobeAltIcon} colorClass="text-blue-500" />
                        <SocialItem label="WhatsApp Number" field="whatsapp" placeholder="+1234567890" icon={ChatBubbleLeftIcon} colorClass="text-green-500" />
                        <SocialItem label="Line ID / URL" field="line" placeholder="https://line.me/..." icon={ChatBubbleLeftIcon} colorClass="text-green-600" />
                    </div>
                </div>

                {/* Social Profiles */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Social Profiles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-4">
                        <SocialItem label="Facebook URL" field="facebook" placeholder="https://facebook.com/..." icon={GlobeAltIcon} colorClass="text-blue-600" />
                        <SocialItem label="Instagram Handle" field="instagram" placeholder="@username" icon={AtSymbolIcon} colorClass="text-pink-600" />
                        <SocialItem label="Twitter (X) Handle" field="twitter" placeholder="@username" icon={AtSymbolIcon} colorClass="text-zinc-800" />
                        <SocialItem label="LinkedIn URL" field="linkedin" placeholder="https://linkedin.com/..." icon={LinkIcon} colorClass="text-blue-700" />
                        <SocialItem label="Discord Invite" field="discord" placeholder="https://discord.gg/..." icon={UserGroupIcon} colorClass="text-indigo-500" />
                    </div>
                </div>

                {/* Store IDs */}
                <div className="space-y-4 p-4 rounded-2xl bg-orange-50/30 border border-orange-100/50">
                    <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">App Store Integration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SocialItem label="Apple App Store ID" field="appStoreId" placeholder="123456789" icon={GlobeAltIcon} />
                        <SocialItem label="Google Play Package" field="playStoreId" placeholder="com.example.app" icon={GlobeAltIcon} />
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
