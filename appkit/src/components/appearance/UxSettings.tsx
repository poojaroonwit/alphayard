'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { BrandingConfig, UxConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { SegmentedControl } from '../ui/SegmentedControl'
import { SparklesIcon, FireIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface UxSettingsProps {
    ux: UxConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function UxSettings({ ux = { animations: 'standard', haptics: 'light', loadingStyle: 'spinner' }, setBranding }: UxSettingsProps) {
    
    const updateUx = (field: keyof UxConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                ux: { ...prev.ux, [field]: value }
            }
        })
    }

    const AnimationOption = ({ id, label, description, icon: Icon }: any) => (
        <button
            onClick={() => updateUx('animations', id)}
            className={clsx(
                "p-4 rounded-2xl border text-left transition-all duration-300 group",
                ux.animations === id 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/30"
            )}
        >
            <div className={clsx("w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors", 
                ux.animations === id ? "bg-white/20" : "bg-gray-50 group-hover:bg-indigo-100")}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm mb-1">{label}</div>
            <div className={clsx("text-[10px] leading-tight opacity-70", ux.animations === id ? "text-indigo-50" : "text-gray-400")}>
                {description}
            </div>
        </button>
    )

    const guideUsage = `const { ux } = useTheme();\n\n// Transitions:\n<AnimatedScreen animationType={ux.animations} />\n\n// Haptics:\nTriggerHaptic(ux.haptics);`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">UX & Motion</CardTitle>
                            <CardDescription>Control how your application feels and moves.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Motion & Haptics"
                        idLabel="Hooks"
                        idValue="useTheme"
                        usageExample={guideUsage}
                        devNote="Animations are implemented using Reanimated 3 for native performance."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-8">
                
                {/* Animation Presets */}
                <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Animation Presets</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <AnimationOption id="none" label="None" description="Instant state changes" icon={ArrowPathIcon} />
                        <AnimationOption id="standard" label="Standard" description="Fluid ease-in-out" icon={SparklesIcon} />
                        <AnimationOption id="slow" label="Slow" description="Cinematic transitions" icon={SparklesIcon} />
                        <AnimationOption id="spring" label="Spring" description="Organic bounciness" icon={FireIcon} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Haptics */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Haptic Feedback</label>
                        <SegmentedControl
                            options={[
                                { label: 'None', value: 'none' },
                                { label: 'Light', value: 'light' },
                                { label: 'Medium', value: 'medium' },
                                { label: 'Heavy', value: 'heavy' },
                            ]}
                            value={ux.haptics}
                            onChange={(value) => updateUx('haptics', value)}
                        />
                        <p className="text-[10px] text-gray-400 italic">Vibrates whenever users interact with primary action buttons.</p>
                    </div>

                    {/* Loading Style */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">System Loading Hub</label>
                        <select
                            value={ux.loadingStyle}
                            onChange={(e) => updateUx('loadingStyle', e.target.value)}
                            className="content-input w-full"
                        >
                            <option value="spinner">Circular Spinner</option>
                            <option value="skeleton">Skeleton Screens (Premium Layouts)</option>
                            <option value="logo">Animated Brand Logo</option>
                            <option value="bar">Top Progress Bar</option>
                        </select>
                        <p className="text-[10px] text-gray-400 italic">Global placeholder style for initial data fetches.</p>
                    </div>
                </div>

            </CardBody>
        </Card>
    )
}
