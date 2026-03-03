'use client'

import React, { useRef } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { BrandingConfig } from './types'
import { SegmentedControl } from '../ui/SegmentedControl'
import { PaintBrushIcon, PhotoIcon, ArrowPathIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { ColorPickerPopover, toColorValue, colorValueToCss } from '../ui/ColorPickerPopover'

interface BrandingSettingsProps {
    branding: BrandingConfig | null
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
    handleBrandingUpload: (field: keyof BrandingConfig, file: File) => Promise<void>
    uploading: boolean
}

export function BrandingSettings({ branding, setBranding, handleBrandingUpload, uploading }: BrandingSettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
    const [activeSubTab, setActiveSubTab] = React.useState('identity')

    const brandingUsage = `// 1. App Identity
{ appName } = useTheme();
<AppLogo className="w-10 h-10" />

// 2. Splash / Loading Screen
import { SplashScreen } from '../components/ui/SplashScreen';

if (isLoading) {
  return <SplashScreen />;
}`

    const safeBranding = branding || {
        appName: '',
        logoUrl: '',
        splash: {
            backgroundColor: '#ffffff',
            spinnerColor: '#000000',
            resizeMode: 'cover',
            spinnerType: 'pulse',
            logoAnimation: 'none',
            showLogo: true,
            showAppName: true
        }
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
        <Card className="border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-none">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div>
                        <CardTitle className="text-lg">Identity & Brand</CardTitle>
                        <CardDescription>Core visual elements and splash settings.</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdvancedOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Cog6ToothIcon className="w-4 h-4" />
                        <span>Advanced</span>
                    </Button>
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-5">
                <div className="space-y-6">
                    <div className="mb-4">
                        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800 w-fit">
                            {[
                                { id: 'identity', label: 'App Identity' },
                                { id: 'splash', label: 'Splash Screen' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        activeSubTab === tab.id
                                            ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-zinc-700'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* App Identity Tab */}
                        {activeSubTab === 'identity' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">App Identity</p>
                                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-400 pt-2">App Name</label>
                                    <div>
                                        <Input
                                            value={safeBranding.appName}
                                            onChange={(e) => setBranding(prev => prev ? ({ ...prev, appName: e.target.value }) : null)}
                                            placeholder="e.g. Acme Corp"
                                            className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                                        />
                                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1">Displayed on splash screen and in system dialogs.</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-400 pt-2">App Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/30 flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 cursor-pointer transition-all overflow-hidden relative group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {safeBranding.logoUrl ? (
                                                <img src={safeBranding.logoUrl} className="w-full h-full object-contain p-2" alt="App logo" />
                                            ) : (
                                                <PhotoIcon className="w-8 h-8 text-gray-400 group-hover:scale-110 transition-transform" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowPathIcon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" title="Upload logo file" onChange={(e) => e.target.files?.[0] && handleBrandingUpload('logoUrl', e.target.files[0])} />
                                            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full sm:w-auto h-8 px-4 font-medium">
                                                {uploading ? 'Uploading...' : 'Upload Logo'}
                                            </Button>
                                            <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">
                                                Upload a high-res PNG (min 512x512).<br/>
                                                This will be used for your app icon and splash screen.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Splash Screen Tab */}
                        {activeSubTab === 'splash' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Splash Configuration</p>
                                    <Button variant="ghost" size="sm" onClick={() => setIsAdvancedOpen(true)} className="text-xs h-7 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10">
                                        <Cog6ToothIcon className="w-3.5 h-3.5" />
                                        Advanced Settings
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-6 items-start">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-400 pt-2">Colors</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <ColorPickerPopover
                                            label="Background"
                                            value={toColorValue(safeBranding.splash.backgroundColor)}
                                            onChange={(v) => updateSplash('backgroundColor', v)}
                                        />
                                        <ColorPickerPopover
                                            label="Spinner Color"
                                            value={toColorValue(safeBranding.splash.spinnerColor)}
                                            onChange={(v) => updateSplash('spinnerColor', v)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-6 items-start border-t border-gray-100 dark:border-zinc-800/50 pt-6">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-400 pt-2">Resize Mode</label>
                                    <div>
                                        <select
                                            title="Splash screen resize mode"
                                            value={safeBranding.splash.resizeMode || 'cover'}
                                            onChange={(e) => updateSplash('resizeMode', e.target.value)}
                                            className="w-full max-w-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-zinc-100 shadow-sm"
                                        >
                                            <option value="cover">Cover</option>
                                            <option value="contain">Contain</option>
                                            <option value="stretch">Stretch</option>
                                            <option value="center">Center</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5">How the background image fills the app screen during boot.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-6 items-start border-t border-gray-100 dark:border-zinc-800/50 pt-6">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-400 pt-2">Loading Animation</label>
                                    <div>
                                        <select
                                            title="Splash screen loading animation"
                                            value={safeBranding.splash.spinnerType}
                                            onChange={(e) => updateSplash('spinnerType', e.target.value)}
                                            className="w-full max-w-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-zinc-100 shadow-sm"
                                        >
                                            <option value="circle">Circle</option>
                                            <option value="dots">Dots</option>
                                            <option value="pulse">Pulse</option>
                                            <option value="none">None</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5">The loading indicator style shown during application startup.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-6 items-start border-t border-gray-100 dark:border-zinc-800/50 pt-6">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-400 pt-2">Logo Animation</label>
                                    <div>
                                        <select
                                            title="Splash screen logo animation"
                                            value={safeBranding.splash.logoAnimation || 'none'}
                                            onChange={(e) => updateSplash('logoAnimation', e.target.value)}
                                            className="w-full max-w-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-zinc-100 shadow-sm"
                                        >
                                            <option value="none">None</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="rotate">Rotate</option>
                                            <option value="bounce">Bounce</option>
                                            <option value="pulse">Pulse</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5">Optional animation applied to your logo on the splash screen.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal for Advanced Settings */}
                    <Modal
                        isOpen={isAdvancedOpen}
                        onClose={() => setIsAdvancedOpen(false)}
                        title="Advanced Brand Settings"
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
                    </Modal>

                </div>
            </CardBody>
        </Card>
    )
}


