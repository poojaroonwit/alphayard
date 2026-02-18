'use client'

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { BrandingConfig, ScreenConfig } from './types'
import { clsx } from 'clsx'
import { PhotoIcon, CodeBracketIcon, PaintBrushIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MobileGuide, MobileGuideContent } from '../ui/MobileGuide'
import { ColorPickerPopover } from '../ui/ColorPickerPopover'
import { toast } from '@/hooks/use-toast'
import { API_BASE_URL } from '../../services/apiConfig'

// Normalize image URL to ensure it's a full URL
const normalizeImageUrl = (url: string | undefined): string => {
  if (!url) return ''
  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  // If it's a UUID (file ID), construct proxy URL
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url)) {
    return `${API_BASE_URL}/storage/proxy/${url}`
  }
  // If it starts with /, assume it's relative to API base
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`
  }
  // Otherwise, assume it's a file ID and construct proxy URL
  return `${API_BASE_URL}/storage/proxy/${url}`
}

interface WallpaperSettingsProps {
    branding: BrandingConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig>>
    handleBrandingUpload: (field: keyof BrandingConfig, file: File, screenId?: string) => Promise<void>
    activeScreenTab?: string
    setActiveScreenTab?: (id: string) => void
}

export function WallpaperSettings({ 
    branding, 
    setBranding, 
    handleBrandingUpload, 
    activeScreenTab,
    setActiveScreenTab
}: WallpaperSettingsProps) {

    const [activeTab, setActiveTab] = useState<'design' | 'code'>('design')

    const activeScreenIndex = branding.screens?.findIndex(s => s.id === activeScreenTab)
    const activeScreen = activeScreenIndex !== -1 && branding.screens ? branding.screens[activeScreenIndex] : null

    const updateActiveScreen = (updates: Partial<ScreenConfig>) => {
         if (!activeScreen) return
         const updatedScreens = [...(branding.screens || [])]
         if (activeScreenIndex !== -1 && activeScreenIndex !== undefined) {
             updatedScreens[activeScreenIndex] = { ...activeScreen, ...updates }
             setBranding(prev => ({
                 ...prev,
                 screens: updatedScreens
             }))
         }
    }

    const currentMode = activeScreen?.resizeMode || 'cover'
    
    const currentBgValue = activeScreen ? (typeof activeScreen.background === 'string' ? { mode: 'solid', solid: activeScreen.background } as any : activeScreen.background || { mode: 'solid', solid: '#ffffff' }) : { mode: 'solid', solid: '#ffffff' }
    
    const cssBackground: string = activeScreen ? (typeof activeScreen.background === 'string' ? activeScreen.background : 
        (activeScreen.background?.mode === 'image' ? normalizeImageUrl(activeScreen.background.image) : 
         activeScreen.background?.mode === 'gradient' && activeScreen.background.gradient ? `linear-gradient(${activeScreen.background.gradient.angle}deg, ${activeScreen.background.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})` :
         activeScreen.background?.solid || '#ffffff')) : '#ffffff'

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
            {!activeScreen ? (
                 <Card className="border-0 bg-transparent shadow-none">
                     <div className="text-center py-12 text-gray-400">
                        <PhotoIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No screen selected for configuration.</p>
                     </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Design & Developer Tabs */}
                    <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
                        <button
                            onClick={() => setActiveTab('design')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                activeTab === 'design' ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800"
                            )}
                        >
                            <PhotoIcon className="w-4 h-4" />
                            Design
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                activeTab === 'code' ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800"
                            )}
                        >
                            <CodeBracketIcon className="w-4 h-4" />
                            Code
                        </button>
                    </div>

                    {activeTab === 'design' && (
                        <div className="space-y-6">
                            {/* Visual Preview */}
                            <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-center border border-gray-100">
                                <div className="relative aspect-[9/16] w-[160px] rounded-[2rem] border-[6px] border-gray-900 bg-white shadow-xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-lg z-10"></div>
                                
                                <div 
                                    className={clsx("w-full h-full relative", 
                                        activeScreen.resizeMode === 'contain' ? 'bg-center bg-no-repeat bg-contain' :
                                        activeScreen.resizeMode === 'stretch' ? 'bg-center bg-no-repeat bg-[length:100%_100%]' :
                                        activeScreen.resizeMode === 'center' ? 'bg-center bg-no-repeat' :
                                        'bg-center bg-no-repeat bg-cover'
                                    )}
                                    style={
                                        (cssBackground.startsWith('http') || cssBackground.startsWith('/') || cssBackground.startsWith('data:'))
                                            ? { backgroundImage: `url(${cssBackground})` }
                                            : { background: cssBackground }
                                    }
                                >
                                    {/* Debug: Log the background URL */}
                                    {typeof activeScreen.background === 'object' && activeScreen.background?.mode === 'image' && activeScreen.background.image && (
                                        <div className="absolute top-0 left-0 text-[8px] text-gray-400 bg-white/80 p-1 rounded z-20 opacity-0 hover:opacity-100 transition-opacity">
                                            {normalizeImageUrl(activeScreen.background.image)}
                                        </div>
                                    )}
                                    {!activeScreen.background && (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                            <PhotoIcon className="w-8 h-8 opacity-20" />
                                            <span className="text-[10px]">No Asset</span>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>

                            {/* Design Controls */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Screen Name</label>
                                        <Input
                                            value={activeScreen.name}
                                            onChange={(e) => updateActiveScreen({ name: e.target.value })}
                                            className="font-medium bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Screen ID</label>
                                        <ScreenIdInput 
                                            value={activeScreen.id}
                                            onUpdate={(newId) => {
                                                updateActiveScreen({ id: newId });
                                                if (setActiveScreenTab) setActiveScreenTab(newId);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                                    <Input
                                        value={activeScreen.description || ''}
                                        onChange={(e) => updateActiveScreen({ description: e.target.value })}
                                        placeholder="Describe this screen's purpose..."
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <ColorPickerPopover
                                        label="Background Appearance"
                                        value={currentBgValue}
                                        onChange={(val) => updateActiveScreen({ background: val })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resize Mode</label>
                                    <select
                                        value={currentMode}
                                        onChange={(e) => updateActiveScreen({ resizeMode: e.target.value as any })}
                                        className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                                    >
                                        <option value="cover">Cover (Fill)</option>
                                        <option value="contain">Contain (Fit)</option>
                                        <option value="stretch">Stretch</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-100 text-center">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-center"
                                        onClick={() => document.getElementById('detail-upload')?.click()}
                                    >
                                        <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                        Upload Quick Asset
                                    </Button>
                                    <input
                                        id="detail-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleBrandingUpload('screens', file, activeScreen.id)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'code' && (
                        <div className="space-y-6">
                            <MobileGuideContent 
                                idLabel="Screen ID"
                                idValue={activeScreen.id}
                                usageExample={`// Consumer Component\nimport { ScreenBackground } from '../../components/ScreenBackground';\nimport { useBranding } from '../../contexts/BrandingContext';\n\nexport function ${activeScreen.id.charAt(0).toUpperCase() + activeScreen.id.slice(1)}Screen() {\n  const { screens } = useBranding();\n  const config = screens?.find(s => s.id === '${activeScreen.id}');\n\n  return (\n    <ScreenBackground background={config}>\n      <Text>Your Content</Text>\n    </ScreenBackground>\n  );\n}`}
                                devNote="Use the useBranding hook to access screen configurations. Pass the specific screen's background config to ScreenBackground for automatic rendering."
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-2">JSON Configuration</h4>
                                    <pre className="text-[10px] overflow-auto max-h-40 font-mono text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                                        {JSON.stringify(activeScreen, null, 2)}
                                    </pre>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="font-semibold text-blue-900 mb-2">Deep Link</h4>
                                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-100 text-xs font-mono text-blue-600">
                                        <span>myapp://{activeScreen.id}</span>
                                    </div>
                                    <p className="text-xs text-blue-600/70 mt-2">
                                        Use this URI scheme to navigate directly to this screen from push notifications or external apps.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function ScreenIdInput({ value, onUpdate }: { value: string, onUpdate: (val: string) => void }) {
    const [localValue, setLocalValue] = useState(value);
    
    // Sync local value if external value changes (and we aren't focused? No, just sync)
    // Actually, we only want to sync if the prop changes meaningfully (e.g. tab switch)
    // But since we control the prop via onUpdate, we can just use key-based reset or useEffect
    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                if (localValue !== value) {
                    onUpdate(localValue);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            className="font-mono text-xs bg-white text-gray-900"
        />
    );
}
