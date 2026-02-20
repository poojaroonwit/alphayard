'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { BrandingConfig, SurveyConfig } from './types'
import { 
    ChatBubbleBottomCenterTextIcon, 
    PlusIcon, 
    TrashIcon, 
    BoltIcon,
    Bars3CenterLeftIcon,
    QueueListIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { toast } from '@/hooks/use-toast'

interface SurveySettingsProps {
    survey: SurveyConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig | null>>
}

export function SurveySettings({ survey, setBranding }: SurveySettingsProps) {
    
    // Type-Safe Fallback
    const safeSurvey: SurveyConfig = {
        enabled: survey?.enabled ?? false,
        trigger: survey?.trigger ?? 'after_onboarding',
        slides: survey?.slides ?? []
    };

    const updateSurvey = (field: keyof SurveyConfig, value: any) => {
        setBranding((prev: any) => {
            if (!prev) return null
            return {
                ...prev,
                flows: {
                    ...(prev.flows || {}),
                    survey: { ...(prev.flows?.survey || {}), [field]: value }
                }
            }
        })
    }

    const addSlide = () => {
        const newSlide = {
            id: Math.random().toString(36).substr(2, 9),
            question: 'What is your primary goal?',
            options: ['Option 1', 'Option 2'],
            type: 'single_choice' as const
        }
        updateSurvey('slides', [...(safeSurvey.slides || []), newSlide])
    }

    const removeSlide = (id: string) => {
        updateSurvey('slides', safeSurvey.slides.filter((s:any) => s.id !== id))
    }

    const updateSlide = (id: string, field: string, value: any) => {
        const updatedSlides = safeSurvey.slides.map((s:any) => 
            s.id === id ? { ...s, [field]: value } : s
        )
        updateSurvey('slides', updatedSlides)
    }

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
                <CardHeader className="border-b border-gray-100/50 pb-3">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">In-App Conversion Microsurveys</CardTitle>
                                <CardDescription>Collect user data during key lifecycle moments.</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-5 space-y-8">
                    
                    {/* Trigger & Enable */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="flex items-center justify-between p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
                            <div>
                                <div className="text-sm font-bold text-gray-900">Enable Lifecycle Surveys</div>
                                <div className="text-[10px] text-purple-600 font-medium">Automatic popup collection.</div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={safeSurvey.enabled}
                                onChange={(e) => updateSurvey('enabled', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300"
                                title="Enable lifecycle surveys"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                                <BoltIcon className="w-3 h-3 text-amber-500" />
                                Global Trigger Event
                            </label>
                            <select 
                                value={safeSurvey.trigger}
                                onChange={(e) => updateSurvey('trigger', e.target.value)}
                                className="content-input text-xs"
                                title="Select global trigger event"
                            >
                                <option value="on_startup">Splash Screen (On Startup)</option>
                                <option value="after_onboarding">Post-Onboarding (Discovery)</option>
                                <option value="after_first_action">Aha! Moment (First Action)</option>
                            </select>
                        </div>
                    </div>

                    {/* Question Builder */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Question Sequence</label>
                            <Button onClick={addSlide} variant="outline" size="sm" className="h-8 text-xs bg-white border-dashed border-2 hover:border-purple-300 hover:text-purple-600 transition-all font-bold group" title="Add new question">
                                <PlusIcon className="w-3 h-3 mr-2 group-hover:scale-125 transition-transform" />
                                Add Question
                            </Button>
                        </div>

                        {safeSurvey.slides.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                                <ChatBubbleBottomCenterTextIcon className="w-12 h-12 mb-3 stroke-[1]" />
                                <p className="text-sm font-medium">No survey questions defined yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {safeSurvey.slides.map((slide:any, index:number) => (
                                    <div key={slide.id} className="group p-5 rounded-3xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all">
                                        <div className="flex gap-5 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-300 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Question Text</label>
                                                        <input 
                                                            value={slide.question}
                                                            onChange={(e) => updateSlide(slide.id, 'question', e.target.value)}
                                                            className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 text-sm font-medium transition-all"
                                                            placeholder="Enter your question here..."
                                                            title="Question text"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Input Type</label>
                                                        <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                                                            {[
                                                                { id: 'single_choice', icon: Bars3CenterLeftIcon },
                                                                { id: 'multiple_choice', icon: QueueListIcon },
                                                                { id: 'text', icon: ChatBubbleBottomCenterTextIcon }
                                                            ].map(type => (
                                                                <button
                                                                    key={type.id}
                                                                    onClick={() => updateSlide(slide.id, 'type', type.id)}
                                                                    className={clsx(
                                                                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                                                                        slide.type === type.id 
                                                                            ? "border-purple-500 bg-purple-50 text-purple-700" 
                                                                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                                                    )}
                                                                    title={`Set question type to ${type.id.replace('_', ' ')}`}
                                                                >
                                                                    <type.icon className="w-4 h-4" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {slide.type !== 'text' && (
                                                     <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Options (Comma separated)</label>
                                                        <input 
                                                            value={slide.options.join(', ')}
                                                            onChange={(e) => updateSlide(slide.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                            className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 text-sm italic transition-all"
                                                            placeholder="Option 1, Option 2, Option 3..."
                                                            title="Question options (comma separated)"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => removeSlide(slide.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove question"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </CardBody>
            </Card>
        </div>
    )
}


