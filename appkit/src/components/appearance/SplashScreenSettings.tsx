'use client'

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { BrandingConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { BottomSheet } from '../ui/BottomSheet'
import { SegmentedControl } from '../ui/SegmentedControl'
import { ColorPickerPopover, toColorValue, colorValueToCss } from '../ui/ColorPickerPopover'
import { PhotoIcon, Cog6ToothIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface SplashScreenSettingsProps {
    branding: BrandingConfig | null
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function SplashScreenSettings({ branding, setBranding }: SplashScreenSettingsProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    const splashUsage = `// Splash Screen Usage
import { SplashScreen } from '../components/ui/SplashScreen';

if (isLoading) {
  return <SplashScreen />;
}`

    const safeBranding = {
        appName: '',
        logoUrl: '',
        splash: {
            backgroundColor: '#ffffff',
            spinnerColor: '#000000',
            spinnerType: 'circle' as const,
            showAppName: true,
            showLogo: true,
            logoAnimation: 'none',
            resizeMode: 'cover' as const,
            ...branding?.splash
        },
        ...branding
    }

    const updateSplash = (key: string, value: any) => {
        setBranding(prev => prev ? ({
            ...prev,
            splash: {
                ...safeBranding.splash,
                [key]: value
            } as any
        } as BrandingConfig) : null)
    }

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Splash Screen</CardTitle>
                            <CardDescription>Customize the app launch experience.</CardDescription>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAdvancedOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Cog6ToothIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Advanced</span>
                        </Button>
                        <MobileGuide 
                            title="Splash Screen"
                            idLabel="Component"
                            idValue="SplashScreen"
                            usageExample={splashUsage}
                            devNote="The splash screen is the first thing users see. Make it fast and branded."
                            buttonVariant="labeled"
                            buttonLabel="Mobile Guide"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8">
                         {/* Splash Screen Config */}
                        <div className="space-y-6">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <ColorPickerPopover
                                        label="Background"
                                        value={toColorValue(safeBranding.splash.backgroundColor)}
                                        onChange={(v) => updateSplash('backgroundColor', v)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <ColorPickerPopover
                                        label="Spinner Color"
                                        value={toColorValue(safeBranding.splash.spinnerColor)}
                                        onChange={(v) => updateSplash('spinnerColor', v)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-700">Resize Mode</label>
                                <SegmentedControl
                                    options={[
                                        { label: 'Cover', value: 'cover' },
                                        { label: 'Contain', value: 'contain' },
                                        { label: 'Stretch', value: 'stretch' },
                                        { label: 'Center', value: 'center' },
                                    ]}
                                    value={safeBranding.splash.resizeMode || 'cover'}
                                    onChange={(value) => updateSplash('resizeMode', value)}
                                />
                                <p className="text-[10px] text-gray-400">Controls how the background image fills the screen.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-700">Loading Animation</label>
                                <SegmentedControl
                                    options={[
                                        { label: 'Circle', value: 'circle' },
                                        { label: 'Dots', value: 'dots' },
                                        { label: 'Pulse', value: 'pulse' },
                                        { label: 'None', value: 'none' },
                                    ]}
                                    value={safeBranding.splash.spinnerType}
                                    onChange={(value) => updateSplash('spinnerType', value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-700">Logo Animation</label>
                                <SegmentedControl
                                    options={[
                                        { label: 'None', value: 'none' },
                                        { label: 'Zoom', value: 'zoom' },
                                        { label: 'Rotate', value: 'rotate' },
                                        { label: 'Bounce', value: 'bounce' },
                                        { label: 'Pulse', value: 'pulse' },
                                    ]}
                                    value={safeBranding.splash.logoAnimation || 'none'}
                                    onChange={(value) => updateSplash('logoAnimation', value as any)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Sheet for Advanced Settings */}
                    <BottomSheet
                        isOpen={isAdvancedOpen}
                        onClose={() => setIsAdvancedOpen(false)}
                        title="Advanced Splash Settings"
                    >
                        <div className="space-y-6 pb-6">
                            <div className="space-y-4">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">Splash Visibility</h5>
                                <div className="flex flex-col gap-4">
                                    <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800 cursor-pointer">
                                        <span className="text-sm text-gray-700 dark:text-slate-300">Show Logo on Splash</span>
                                        <input 
                                            type="checkbox" 
                                            checked={safeBranding.splash.showLogo} 
                                            onChange={(e) => updateSplash('showLogo', e.target.checked)}
                                            className="w-5 h-5 rounded text-pink-600 border-gray-300 focus:ring-pink-500" 
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800 cursor-pointer">
                                        <span className="text-sm text-gray-700 dark:text-slate-300">Show App Name on Splash</span>
                                        <input 
                                            type="checkbox" 
                                            checked={safeBranding.splash.showAppName} 
                                            onChange={(e) => updateSplash('showAppName', e.target.checked)}
                                            className="w-5 h-5 rounded text-pink-600 border-gray-300 focus:ring-pink-500" 
                                        />
                                    </label>
                                </div>
                            </div>
                            
                            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                    <strong>Note:</strong> These settings are specifically optimized for mobile devices and will affect how the native splash screen is generated.
                                </p>
                            </div>

                            <Button onClick={() => setIsAdvancedOpen(false)} className="w-full">
                                Done
                            </Button>
                        </div>
                    </BottomSheet>

                    {/* Splash Screen Preview */}
                    <div className="hidden lg:block space-y-4">
                         <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Splash Screen Preview</label>
                         <div className="flex justify-center py-8 bg-gray-50/50 rounded-3xl border border-gray-100 sticky top-4">
                            {/* Device Frame */}
                            <div className="relative w-[280px] h-[580px] bg-white rounded-[3rem] shadow-[0_0_0_12px_#111827,0_20px_50px_-10px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-gray-900/5">
                                {/* Device Notch */}
                                <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                                    <div className="h-5 w-24 bg-black rounded-b-xl"></div>
                                </div>
                                
                                {/* Status Bar - Hidden/Light on splash usually, but keeping subtle for realism */}
                                <div className="absolute top-2 inset-x-0 px-5 flex justify-between items-center text-black/20 text-[9px] font-medium z-20">
                                    <span>9:41</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3.5 h-2 rounded-[2px] border border-black/10 relative">
                                            <div className="absolute inset-0.5 bg-black/20 rounded-[1px]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Splash Content */}
                                <div 
                                    className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-colors duration-500"
                                    style={{ 
                                        background: colorValueToCss(toColorValue(safeBranding.splash.backgroundColor)),
                                        backgroundSize: safeBranding.splash.resizeMode === 'stretch' ? '100% 100%' : safeBranding.splash.resizeMode || 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                    // Using background property to support gradients/images
                                >
                                    <div className="animate-in zoom-in-50 duration-700 fade-in-0 flex flex-col items-center gap-8">
                                        <style dangerouslySetInnerHTML={{__html: `
                                            @keyframes zoom-in-out {
                                                0% { transform: scale(1); }
                                                50% { transform: scale(1.1); }
                                                100% { transform: scale(1); }
                                            }
                                        `}} />
                                        {safeBranding.splash.showLogo && (
                                            safeBranding.logoUrl ? (
                                                <img 
                                                    src={safeBranding.logoUrl} 
                                                    className={`w-32 h-32 object-contain ${
                                                        safeBranding.splash.logoAnimation === 'rotate' ? 'animate-spin' : 
                                                        safeBranding.splash.logoAnimation === 'bounce' ? 'animate-bounce' : 
                                                        safeBranding.splash.logoAnimation === 'pulse' ? 'animate-pulse' : ''
                                                    }`}
                                                    style={{
                                                        animation: safeBranding.splash.logoAnimation === 'zoom' ? 'zoom-in-out 2s ease-in-out infinite' : undefined
                                                    }}
                                                />
                                            ) : (
                                                <div className={`w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center ring-1 ring-white/20 ${
                                                    safeBranding.splash.logoAnimation === 'rotate' ? 'animate-spin' : 
                                                    safeBranding.splash.logoAnimation === 'bounce' ? 'animate-bounce' : 
                                                    safeBranding.splash.logoAnimation === 'pulse' ? 'animate-pulse' : ''
                                                }`}
                                                style={{
                                                    animation: safeBranding.splash.logoAnimation === 'zoom' ? 'zoom-in-out 2s ease-in-out infinite' : undefined
                                                }}>
                                                    <PhotoIcon className="w-12 h-12 text-white/50" />
                                                </div>
                                            )
                                        )}

                                        {/* Loading Spinner Simulation */}
                                        {safeBranding.splash.spinnerType === 'circle' && (
                                            <div 
                                                className="w-8 h-8 border-4 border-transparent rounded-full animate-spin"
                                                style={{ borderTopColor: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)), borderRightColor: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)) + '40' }}
                                            ></div>
                                        )}
                                        {safeBranding.splash.spinnerType === 'dots' && (
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)), animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)), animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)), animationDelay: '300ms' }}></div>
                                            </div>
                                        )}
                                        {safeBranding.splash.spinnerType === 'pulse' && (
                                            <div 
                                                className="w-12 h-12 rounded-full animate-ping opacity-20"
                                                style={{ backgroundColor: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)) }}
                                            ></div>
                                        )}
                                    </div>
                                    
                                    {safeBranding.splash.showAppName && (
                                        <div className="absolute bottom-16 inset-x-0 text-center">
                                             <p 
                                                className="text-sm font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both"
                                                style={{ color: colorValueToCss(toColorValue(safeBranding.splash.spinnerColor)) }} // Heuristic: text usually matches spinner/brand color
                                             >
                                                {safeBranding.appName || 'Your App'}
                                             </p>
                                        </div>
                                    )}
                                </div>

                                {/* Home Indicator */}
                                <div className="absolute bottom-2 inset-x-0 flex justify-center z-20">
                                    <div className="w-24 h-1 bg-black/10 rounded-full"></div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
