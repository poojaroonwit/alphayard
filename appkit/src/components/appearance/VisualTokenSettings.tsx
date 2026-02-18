'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { BrandingConfig, DesignTokensConfig, GradientConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { FireIcon, CubeTransparentIcon, Squares2X2Icon, SwatchIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface VisualTokenSettingsProps {
    tokens: DesignTokensConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function VisualTokenSettings({ tokens, setBranding }: VisualTokenSettingsProps) {
    
    const updateToken = (field: keyof DesignTokensConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                tokens: { ...prev.tokens, [field]: value }
            }
        })
    }

    const updateGradient = (key: 'primaryGradient' | 'secondaryGradient', field: keyof GradientConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                tokens: {
                    ...prev.tokens,
                    [key]: { ...prev.tokens[key], [field]: value }
                }
            }
        })
    }

    const GradientEditor = ({ label, config, type }: { label: string, config: GradientConfig, type: 'primaryGradient' | 'secondaryGradient' }) => (
        <div className="space-y-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">{label}</span>
                <input 
                    type="checkbox" 
                    checked={config.enabled} 
                    onChange={(e) => updateGradient(type, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Start Color</label>
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={config.start} 
                            onChange={(e) => updateGradient(type, 'start', e.target.value)}
                            className="h-8 w-12 rounded bg-white border border-gray-200 p-0.5"
                        />
                        <input 
                            type="text" 
                            value={config.start} 
                            onChange={(e) => updateGradient(type, 'start', e.target.value)}
                            className="flex-1 h-8 text-[10px] font-mono px-2 rounded bg-white border border-gray-200"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">End Color</label>
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={config.end} 
                            onChange={(e) => updateGradient(type, 'end', e.target.value)}
                            className="h-8 w-12 rounded bg-white border border-gray-200 p-0.5"
                        />
                        <input 
                            type="text" 
                            value={config.end} 
                            onChange={(e) => updateGradient(type, 'end', e.target.value)}
                            className="flex-1 h-8 text-[10px] font-mono px-2 rounded bg-white border border-gray-200"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Angle (deg)</label>
                    <input 
                        type="number" 
                        value={config.angle} 
                        onChange={(e) => updateGradient(type, 'angle', parseInt(e.target.value))}
                        className="w-full h-8 text-[10px] px-2 rounded bg-white border border-gray-200"
                    />
                </div>
            </div>

            {/* Preview */}
            <div 
                className="h-12 w-full rounded-xl shadow-inner-sm border border-gray-100" 
                style={{ background: config.enabled ? `linear-gradient(${config.angle}deg, ${config.start}, ${config.end})` : '#E5E7EB' }}
            />
        </div>
    )

    const guideUsage = `const { tokens } = useTheme();\n\n<View style={{\n  borderRadius: tokens.borderRadius === 'squircle' ? 24 : 12,\n  opacity: tokens.glassmorphism.enabled ? 0.8 : 1\n}} />`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <SwatchIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Visual Design Tokens</CardTitle>
                            <CardDescription>Advanced textures, gradients, and curvatures.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Design Tokens"
                        idLabel="Consumption"
                        idValue="StyleSheet"
                        usageExample={guideUsage}
                        devNote="Gradients are implemented via React Native Linear Gradient for smooth transitions."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                
                {/* Gradients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <GradientEditor label="Primary App Gradient" config={tokens.primaryGradient} type="primaryGradient" />
                    <GradientEditor label="Secondary Gradient" config={tokens.secondaryGradient} type="secondaryGradient" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                    {/* Glassmorphism */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Glassmorphism Texture</label>
                             <input 
                                type="checkbox" 
                                checked={tokens.glassmorphism.enabled} 
                                onChange={(e) => updateToken('glassmorphism', { ...tokens.glassmorphism, enabled: e.target.checked })}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-gray-500">Blur Intensity</span>
                                    <span className="text-indigo-600 font-mono">{tokens.glassmorphism.blur}px</span>
                                </div>
                                <input 
                                    type="range" min="0" max="40" 
                                    value={tokens.glassmorphism.blur}
                                    onChange={(e) => updateToken('glassmorphism', { ...tokens.glassmorphism, blur: parseInt(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-gray-500">Overall Opacity</span>
                                    <span className="text-indigo-600 font-mono">{Math.round(tokens.glassmorphism.opacity * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={tokens.glassmorphism.opacity}
                                    onChange={(e) => updateToken('glassmorphism', { ...tokens.glassmorphism, opacity: parseFloat(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Borders */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Global Border Curvature</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'sharp', label: 'Sharp', radius: '0px' },
                                { id: 'standard', label: 'Standard', radius: '8px' },
                                { id: 'organic', label: 'Organic', radius: '24px' },
                                { id: 'squircle', label: 'Squircle', radius: '40% / 40%' },
                            ].map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => updateToken('borderRadius', style.id)}
                                    className={clsx(
                                        "p-3 rounded-xl border transition-all text-left group",
                                        tokens.borderRadius === style.id 
                                            ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                                            : "bg-white border-gray-100 hover:border-gray-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 border border-gray-200" style={{ borderRadius: style.radius }}></div>
                                        <span className={clsx("text-xs font-bold", tokens.borderRadius === style.id ? "text-indigo-700" : "text-gray-600")}>
                                            {style.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 italic">This affects buttons, cards, and input fields across the whole app.</p>
                    </div>
                </div>

            </CardBody>
        </Card>
    )
}
