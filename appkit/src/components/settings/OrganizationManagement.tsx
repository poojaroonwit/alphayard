'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { 
    BuildingOfficeIcon, 
    GlobeAltIcon,
    ShieldCheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'

interface OrganizationConfig {
    name: string
    domain: string
    supportEmail: string
    website: string
    status: 'active' | 'suspended' | 'pending'
}

export function OrganizationManagement() {
    const [config, setConfig] = useState<OrganizationConfig>({
        name: 'AppKit',
        domain: 'appkit.io',
        supportEmail: 'support@appkit.io',
        website: 'https://appkit.io',
        status: 'active'
    })
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSaving(false)
        console.log('Saved organization config:', config)
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Organization Settings</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Global settings for your organization. Changes here may affect billing, support, and default branding across all applications.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 dark:ring-zinc-800">
                        <CardHeader className="border-b border-gray-100/50 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <BuildingOfficeIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">General Information</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-zinc-400">Basic organizational details.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="p-5 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="w-full md:w-1/3 pt-1.5">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Organization Name</Label>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Visible name of your entity.</p>
                                </div>
                                <div className="w-full md:w-2/3">
                                    <Input 
                                        value={config.name}
                                        onChange={(e) => setConfig({...config, name: e.target.value})}
                                        placeholder="Enter organization name"
                                        className="bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-start gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                                <div className="w-full md:w-1/3 pt-1.5">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Primary Domain</Label>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Used for SSO and discovery.</p>
                                </div>
                                <div className="w-full md:w-2/3">
                                    <div className="relative">
                                        <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            value={config.domain}
                                            onChange={(e) => setConfig({...config, domain: e.target.value})}
                                            placeholder="domain.com"
                                            className="pl-10 bg-white dark:bg-zinc-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 dark:ring-zinc-800">
                        <CardHeader className="border-b border-gray-100/50 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">Contact & Support</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-zinc-400">Where users reach out for help.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="p-5 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="w-full md:w-1/3 pt-1.5">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Support Email</Label>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Main contact for technical help.</p>
                                </div>
                                <div className="w-full md:w-2/3">
                                    <Input 
                                        type="email"
                                        value={config.supportEmail}
                                        onChange={(e) => setConfig({...config, supportEmail: e.target.value})}
                                        placeholder="support@org.com"
                                        className="bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-start gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                                <div className="w-full md:w-1/3 pt-1.5">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Website URL</Label>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Official public website.</p>
                                </div>
                                <div className="w-full md:w-2/3">
                                    <Input 
                                        value={config.website}
                                        onChange={(e) => setConfig({...config, website: e.target.value})}
                                        placeholder="https://org.com"
                                        className="bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 dark:ring-zinc-800">
                        <CardHeader className="border-b border-gray-100/50 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                                    <ArrowPathIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">Status & Lifecycle</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-zinc-400">Manage account standing.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="p-5">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
                                <div>
                                    <div className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight">Active Standing</div>
                                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your organization is in good health and all features are accessible.</div>
                                </div>
                                <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                <Button variant="outline" className="dark:bg-zinc-800 dark:border-zinc-700">Cancel</Button>
                <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}
