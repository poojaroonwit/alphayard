'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { BrandingConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { ColorPickerPopover, toColorValue, colorValueToCss } from '../ui/ColorPickerPopover'
import { SwatchIcon, PaintBrushIcon } from '@heroicons/react/24/outline'

interface QuickSettingsProps {
    branding: BrandingConfig | null
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function QuickSettings({ branding, setBranding }: QuickSettingsProps) {
    const quickUsage = `// Global Colors Usage
const { colors } = useTheme();
<View style={{ backgroundColor: colors.primary }} />
<Button color={colors.secondary} />`

    const updateColor = (key: 'primaryColor' | 'secondaryColor', value: any) => {
        setBranding(prev => prev ? ({
            ...prev,
            [key]: value
        }) : null)
    }

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                            <PaintBrushIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Quick Settings</CardTitle>
                            <CardDescription>Primary application colors.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="General Branding"
                        idLabel="Theme"
                        idValue="Colors"
                        usageExample={quickUsage}
                        devNote="These colors define the core palette of your application."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <ColorPickerPopover
                            label="Primary Color"
                            value={toColorValue(branding?.primaryColor || { mode: 'solid', solid: '#000' })}
                            onChange={(v) => updateColor('primaryColor', v)}
                        />
                        <p className="text-xs text-gray-500">
                            Used for primary buttons, active states, and key brand elements.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <ColorPickerPopover
                            label="Secondary Color"
                            value={toColorValue(branding?.secondaryColor || { mode: 'solid', solid: '#fff' })}
                            onChange={(v) => updateColor('secondaryColor', v)}
                        />
                        <p className="text-xs text-gray-500">
                            Used for backgrounds, cards, and secondary surfaces.
                        </p>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
