'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { OnboardingConfig, OnboardingSlide } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { PresentationChartLineIcon, TrashIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface OnboardingSettingsProps {
    onboarding: OnboardingConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

function OnboardingSimulator({ slides, isSkippable }: { slides: OnboardingSlide[], isSkippable: boolean }) {
    const [activeIndex, setActiveIndex] = React.useState(0)

    // Reset index if slides change significantly
    React.useEffect(() => {
        if (activeIndex >= slides.length && slides.length > 0) {
            setActiveIndex(0)
        }
    }, [slides.length])

    const activeSlide = slides[activeIndex]
    const isLast = activeIndex === slides.length - 1

    const handleNext = () => {
        if (isLast) {
            setActiveIndex(0) // Loop back for demo purposes
        } else {
            setActiveIndex(prev => prev + 1)
        }
    }

    return (
        <div className="relative w-[280px] h-[580px] bg-white rounded-[3rem] shadow-[0_0_0_12px_#111827,0_20px_50px_-10px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-gray-900/5">
                            {/* Device Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                                <div className="h-5 w-24 bg-black rounded-b-xl"></div>
                            </div>
                            
                            {/* Status Bar */}
                            <div className="absolute top-2 inset-x-0 px-5 flex justify-between items-center text-black text-[9px] font-medium z-20">
                                <span>9:41</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-3.5 h-2 rounded-[2px] border border-black/40 relative">
                                        <div className="absolute inset-0.5 bg-black rounded-[1px]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="absolute inset-0 pt-16 pb-20 px-6 flex flex-col items-center text-center">
                                {slides.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-2">
                                        <PresentationChartLineIcon className="w-12 h-12" />
                                        <p className="text-xs font-medium">No slides</p>
                                    </div>
                                ) : activeSlide ? (
                                    <>
                                        <div className="w-full flex justify-end mb-4 h-6">
                                            {isSkippable && (
                                                <button className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skip</button>
                                            )}
                                        </div>
                                        <div className="aspect-square w-full bg-gray-50 rounded-2xl mb-8 flex items-center justify-center overflow-hidden">
                                            {activeSlide.imageUrl ? (
                                                <img src={activeSlide.imageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <PhotoIcon className="w-16 h-16 text-gray-200" />
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{activeSlide.title || 'Slide Title'}</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">{activeSlide.description || 'Slide description goes here...'}</p>
                                        
                                        <div className="mt-auto w-full space-y-6">
                                            {/* Pagination Dots */}
                                            <div className="flex justify-center gap-1.5">
                                                {slides.map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-emerald-500 w-3' : 'bg-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            
                                            <Button 
                                                onClick={handleNext}
                                                className="w-full bg-black hover:bg-gray-800 text-white rounded-xl h-10 text-xs font-bold"
                                            >
                                                {isLast ? 'Get Started' : 'Next'}
                                            </Button>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 inset-x-0 flex justify-center z-20">
                                <div className="w-24 h-1 bg-black/10 rounded-full"></div>
                            </div>
        </div>
    )
}

export function OnboardingSettings({ onboarding, setBranding }: OnboardingSettingsProps) {
    
    // Safety fallback
    const safeOnboarding: OnboardingConfig = {
        enabled: onboarding?.enabled ?? false,
        isSkippable: onboarding?.isSkippable ?? false,
        slides: onboarding?.slides ?? [] as OnboardingSlide[]
    };

    const toggleEnabled = () => {
        setBranding((prev: any) => ({
            ...prev,
            flows: { // Ensure generic update structure works for nested flows
                ...prev.flows,
                onboarding: { ...safeOnboarding, enabled: !safeOnboarding.enabled }
            }
        }))
    }

    const toggleSkippable = () => {
        setBranding((prev: any) => ({
             ...prev,
            flows: {
                ...prev.flows,
                onboarding: { ...safeOnboarding, isSkippable: !safeOnboarding.isSkippable }
            }
        }))
    }

    const addSlide = () => {
        const newSlide: OnboardingSlide = {
            id: Date.now().toString(),
            title: 'New Slide',
            description: 'Enter description here...',
            imageUrl: ''
        }
        setBranding((prev: any) => ({
            ...prev,
            flows: {
                ...prev.flows,
                onboarding: { ...safeOnboarding, slides: [...(safeOnboarding.slides || []), newSlide] }
            }
        }))
    }

    const removeSlide = (id: string) => {
        setBranding((prev: any) => ({
             ...prev,
            flows: {
                ...prev.flows,
                onboarding: { ...safeOnboarding, slides: safeOnboarding.slides.filter((s: any) => s.id !== id) }
            }
        }))
    }

    const updateSlide = (id: string, field: keyof OnboardingSlide, value: string) => {
        setBranding((prev: any) => ({
            ...prev,
            flows: {
                ...prev.flows,
                onboarding: {
                    ...safeOnboarding,
                    slides: safeOnboarding.slides.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
                }
            }
        }))
    }

    const guideUsage = `const { onboarding } = useConfig();\n\nif (onboarding.enabled) {\n  return <Onboarding slides={onboarding.slides} />\n}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <PresentationChartLineIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Onboarding Flow</CardTitle>
                            <CardDescription>Configure the app's first-launch experience.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Onboarding Manager"
                        idLabel="Logic"
                        idValue="First-Launch Check"
                        usageExample={guideUsage}
                        devNote="Slides are served as a dynamic array. You can add up to 10 slides."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {/* Global Settings */}
                        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={safeOnboarding.enabled} onChange={toggleEnabled} className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                                <span className="text-sm font-medium text-gray-700">Enable Onboarding</span>
                            </label>
                            <div className="w-px h-6 bg-gray-200 mx-2" />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={safeOnboarding.isSkippable} onChange={toggleSkippable} className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                                <span className="text-sm font-medium text-gray-700">Can be skipped</span>
                            </label>
                        </div>

                        {/* Slides List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Onboarding Slides</h4>
                                 <Button size="sm" variant="outline" onClick={addSlide} className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                    <PlusIcon className="w-4 h-4 mr-1.5" />
                                    Add Slide
                                 </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-1">
                                {safeOnboarding.slides && safeOnboarding.slides.map((slide, index) => (
                                    <div key={slide.id} className="group relative flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 transition-all">
                                        <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 overflow-hidden shrink-0">
                                             {slide.imageUrl ? (
                                                 <img src={slide.imageUrl} className="w-full h-full object-cover" />
                                             ) : (
                                                 <>
                                                    <PhotoIcon className="w-6 h-6 mb-1" />
                                                    <span className="text-[10px]">Illustration</span>
                                                 </>
                                             )}
                                        </div>
                                        <div className="flex-1 space-y-3 min-w-0">
                                            <div className="flex gap-2">
                                                <div className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {index + 1}
                                                </div>
                                                <Input 
                                                    value={slide.title} 
                                                    onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                                                    placeholder="Slide Title"
                                                    className="h-8 text-sm px-2 font-semibold"
                                                />
                                            </div>
                                            <textarea 
                                                value={slide.description}
                                                onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                                                className="content-input w-full min-h-[60px] text-xs resize-none"
                                                placeholder="Slide description..."
                                            />
                                            <div className="space-y-1">
                                                <Input
                                                    value={slide.imageUrl}
                                                    onChange={(e) => updateSlide(slide.id, 'imageUrl', e.target.value)}
                                                    placeholder="Illustration URL (https://...)"
                                                    className="h-8 text-[10px] px-2 font-mono text-gray-500"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeSlide(slide.id)}
                                            className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!safeOnboarding.slides || safeOnboarding.slides.length === 0) && (
                                    <div className="text-center py-8 text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                        No slides added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Simulator */}
                    <div className="hidden lg:block space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Interactive Simulator</label>
                        <div className="flex justify-center py-8 bg-gray-50/50 rounded-3xl border border-gray-100 sticky top-4">
                             <OnboardingSimulator slides={safeOnboarding.slides || []} isSkippable={safeOnboarding.isSkippable} />
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
