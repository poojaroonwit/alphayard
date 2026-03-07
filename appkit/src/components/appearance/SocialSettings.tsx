'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { SocialLinksConfig } from './types'
import { BrandIcons } from './BrandIcons'

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

    const SocialItem = ({ label, field, placeholder, iconKey, colorClass = "text-gray-400" }: { label: string, field: keyof SocialLinksConfig, placeholder: string, iconKey: keyof typeof BrandIcons, colorClass?: string }) => {
        const Icon = BrandIcons[iconKey] || BrandIcons.genericStore;

        return (
            <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-4 items-center p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm shrink-0">
                        <Icon className={`w-4.5 h-4.5 ${colorClass}`} />
                    </div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300 truncate">
                        {label}
                    </label>
                </div>
                <div className="relative group">
                    <Input 
                        value={social?.[field] || ''} 
                        onChange={(e) => updateSocial(field, e.target.value)}
                        placeholder={placeholder}
                        className="text-sm bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus:ring-blue-500/20"
                    />
                </div>
            </div>
        )
    }

    return (
        <Card className="border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-none">
            <CardHeader className="border-b border-gray-100/50 dark:border-zinc-800/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div>
                        <CardTitle className="text-lg">Links & Support</CardTitle>
                        <CardDescription>External connection points for your users.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                {/* Support Section */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Support Channels</p>
                    <div className="space-y-3">
                        <SocialItem label="Support Email" field="supportEmail" placeholder="support@example.com" iconKey="supportEmail" colorClass="text-red-500" />
                        <SocialItem label="Help Desk URL" field="helpDeskUrl" placeholder="https://help.example.com" iconKey="helpDeskUrl" colorClass="text-blue-500" />
                        <SocialItem label="GitHub Repository" field="githubRepo" placeholder="https://github.com/owner/repo" iconKey="githubRepo" colorClass="text-gray-900 dark:text-zinc-100" />
                        <SocialItem label="GitLab Repository" field="gitlabRepo" placeholder="https://gitlab.com/group/project" iconKey="gitlabRepo" colorClass="text-orange-600" />
                        <SocialItem label="Reference Docs URL" field="docsUrl" placeholder="https://docs.example.com" iconKey="docsUrl" colorClass="text-purple-600" />
                        <SocialItem label="WhatsApp Number" field="whatsapp" placeholder="+1234567890" iconKey="whatsapp" colorClass="text-green-500" />
                        <SocialItem label="Line ID / URL" field="line" placeholder="https://line.me/..." iconKey="line" colorClass="text-green-600" />
                    </div>
                </div>

                {/* Social Profiles */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Social Profiles</p>
                    <div className="space-y-3">
                        <SocialItem label="Facebook URL" field="facebook" placeholder="https://facebook.com/..." iconKey="facebook" colorClass="text-blue-600" />
                        <SocialItem label="Instagram Handle" field="instagram" placeholder="@username" iconKey="instagram" colorClass="text-pink-600" />
                        <SocialItem label="Twitter (X) Handle" field="twitter" placeholder="@username" iconKey="twitter" colorClass="text-zinc-800 dark:text-zinc-100" />
                        <SocialItem label="LinkedIn URL" field="linkedin" placeholder="https://linkedin.com/..." iconKey="linkedin" colorClass="text-blue-700" />
                        <SocialItem label="Discord Invite" field="discord" placeholder="https://discord.gg/..." iconKey="discord" colorClass="text-indigo-500" />
                    </div>
                </div>

                {/* Store IDs */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">App Store Integration</p>
                    <div className="space-y-3">
                        <SocialItem label="Apple App Store ID" field="appStoreId" placeholder="123456789" iconKey="genericStore" />
                        <SocialItem label="Google Play Package" field="playStoreId" placeholder="com.example.app" iconKey="genericStore" />
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}



