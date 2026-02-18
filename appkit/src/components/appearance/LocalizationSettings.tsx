'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { LocalizationConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { GlobeAltIcon, LanguageIcon, ArrowsRightLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface LocalizationSettingsProps {
    localization: LocalizationConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function LocalizationSettings({ localization, setBranding }: LocalizationSettingsProps) {
    // Defensive coding: Ensure localization object exists
    if (!localization) {
        return <div className="p-4 text-red-500">Localization configuration missing. Please reset defaults.</div>
    }
    
    const updateSettings = (field: keyof LocalizationConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            localization: { ...prev.localization, [field]: value }
        }))
    }

    const addLanguage = (lang: string) => {
        if (!lang || localization.supportedLanguages.includes(lang)) return
        updateSettings('supportedLanguages', [...localization.supportedLanguages, lang])
    }

    const removeLanguage = (lang: string) => {
        updateSettings('supportedLanguages', localization.supportedLanguages.filter(l => l !== lang))
    }

    const guideUsage = `const { localization } = useConfig();\n\ni18n.locale = localization.defaultLanguage;\nI18nManager.forceRTL(localization.enableRTL);`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <GlobeAltIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Language & Region</CardTitle>
                            <CardDescription>Internationalization and multi-language support.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Localization Manager"
                        idLabel="Config Type"
                        idValue="i18n Settings"
                        usageExample={guideUsage}
                        devNote="Supported languages must match your i18n JSON file keys (e.g., 'en', 'ar')."
                        buttonVariant="labeled"
                        buttonLabel="Mobile Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <LanguageIcon className="w-3.5 h-3.5" />
                            Default Language
                        </label>
                        <select 
                            value={localization.defaultLanguage}
                            onChange={(e) => updateSettings('defaultLanguage', e.target.value)}
                            className="content-input text-sm"
                        >
                            {(localization.supportedLanguages || []).map(lang => (
                                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add Supported Language
                        </label>
                        <div className="flex gap-2">
                            <Input 
                                id="new-lang"
                                placeholder="e.g. ar"
                                className="text-sm font-mono h-9"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addLanguage((e.target as HTMLInputElement).value)
                                        ;(e.target as HTMLInputElement).value = ''
                                    }
                                }}
                            />
                            <button 
                                onClick={() => {
                                    const input = document.getElementById('new-lang') as HTMLInputElement
                                    addLanguage(input.value)
                                    input.value = ''
                                }}
                                className="px-3 h-9 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-medium text-gray-500">Enabled Languages</label>
                        <div className="flex flex-wrap gap-2">
                            {(localization.supportedLanguages || []).map(lang => (
                                <div key={lang} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider">
                                    {lang}
                                    <button onClick={() => removeLanguage(lang)} className="hover:text-blue-900">
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 md:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <ArrowsRightLeftIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-indigo-900">Right-to-Left (RTL) Support</h4>
                                <p className="text-xs text-indigo-800/60">Explicitly force RTL layout for languages like Arabic or Hebrew.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateSettings('enableRTL', !localization.enableRTL)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localization.enableRTL ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localization.enableRTL ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
