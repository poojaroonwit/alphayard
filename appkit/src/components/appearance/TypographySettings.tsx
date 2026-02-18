'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { TypographyConfig, FontConfig, BrandingConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface TypographySettingsProps {
    typography: TypographyConfig
    branding: BrandingConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig>>
}

export function TypographySettings({ typography, branding, setBranding }: TypographySettingsProps) {
    
    const updateFont = (key: keyof TypographyConfig, field: keyof FontConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            typography: {
                ...prev.typography,
                [key]: { ...prev.typography[key], [field]: value }
            }
        }))
    }

    const TypographyItem = ({ label, config, type }: { label: string, config: FontConfig, type: keyof TypographyConfig }) => (
        <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{label}</span>
                <select 
                    value={config.family}
                    onChange={(e) => updateFont(type, 'family', e.target.value)}
                    className="text-[10px] font-mono text-indigo-600 bg-gray-50/50 border border-gray-200 rounded px-1 focus:ring-1 focus:ring-indigo-500/20 outline-none cursor-pointer hover:bg-white transition-all"
                >
                    <option value={branding.primaryFont}>Primary ({branding.primaryFont})</option>
                    <option value={branding.secondaryFont}>Secondary ({branding.secondaryFont})</option>
                    <option value="system">System Default</option>
                </select>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Size</label>
                    <Input 
                        type="number" 
                        value={config.size} 
                        onChange={(e) => updateFont(type, 'size', parseInt(e.target.value))}
                        className="h-8 text-xs px-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Weight</label>
                    <select 
                        value={config.weight}
                        onChange={(e) => updateFont(type, 'weight', e.target.value)}
                        className="h-8 w-full rounded-lg border border-gray-200 bg-white text-xs px-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">SemiBold</option>
                        <option value="700">Bold</option>
                        <option value="800">ExtraBold</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Height</label>
                    <Input 
                        type="number" 
                        value={config.lineHeight} 
                        onChange={(e) => updateFont(type, 'lineHeight', parseInt(e.target.value))}
                        className="h-8 text-xs px-2"
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-center min-h-[80px]">
                <span style={{ 
                    fontSize: `${config.size}px`, 
                    fontWeight: config.weight,
                    lineHeight: `${config.lineHeight}px`,
                    fontFamily: config.family === branding.primaryFont || config.family === branding.secondaryFont ? 'sans-serif' : config.family
                }} className="text-gray-900">
                    Sample Text Preview
                </span>
            </div>
        </div>
    )

    const guideUsage = `const { typography } = useTheme();\n\n<Text style={typography.h1}>Hello World</Text>`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Bars3Icon className="w-6 h-6 rotate-90" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Typography System</CardTitle>
                            <CardDescription>Manage global font styles and hierarchy.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Typography Manager"
                        idLabel="Consumption"
                        idValue="Theme Context"
                        usageExample={guideUsage}
                        devNote="FontSize and LineHeight are automatically scaled for different device densities."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5">
                <div className="mb-6 pb-6 border-b border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Global Primary Font</label>
                    <select
                        value={branding.primaryFont}
                        onChange={(e) => setBranding(prev => ({ ...prev, primaryFont: e.target.value }))}
                        className="content-input w-full"
                    >
                        <option value="Inter">Inter (Default)</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Outfit">Outfit</option>
                        <option value="SF Pro">SF Pro</option>
                    </select>
                </div>

                <div className="flex flex-col gap-5">
                    <TypographyItem label="Heading 1" config={typography.h1} type="h1" />
                    <TypographyItem label="Heading 2" config={typography.h2} type="h2" />
                    <TypographyItem label="Body Text" config={typography.body} type="body" />
                    <TypographyItem label="Caption" config={typography.caption} type="caption" />
                </div>
            </CardBody>
        </Card>
    )
}
