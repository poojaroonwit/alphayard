'use client'

import React from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { SeoConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { GlobeAltIcon, TagIcon, PhotoIcon, ShareIcon, DevicePhoneMobileIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SeoSettingsProps {
    seo: SeoConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function SeoSettings({ seo, setBranding }: SeoSettingsProps) {
    
    // Safety fallback for missing data (Fixed Runtime Error)
    const safeSeo: SeoConfig = {
        title: seo?.title ?? '',
        description: seo?.description ?? '',
        keywords: seo?.keywords ?? [] as string[],
        ogImage: seo?.ogImage ?? '',
        twitterHandle: seo?.twitterHandle ?? '',
        appleAppId: seo?.appleAppId ?? ''
    };

    const updateSettings = (field: keyof SeoConfig, value: any) => {
        setBranding((prev: any) => ({
            ...prev,
            seo: { ...prev.seo, [field]: value }
        }))
    }

    const addKeyword = (word: string) => {
        if (!word || safeSeo.keywords.includes(word)) return
        updateSettings('keywords', [...safeSeo.keywords, word])
    }

    const removeKeyword = (word: string) => {
        updateSettings('keywords', safeSeo.keywords.filter(w => w !== word))
    }

    const guideUsage = `// For Web (Next.js/HTML)\n<title>{seo.title}</title>\n<meta name="description" content={seo.description} />\n\n// For App Store\nAppleAppID: {seo.appleAppId}`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <GlobeAltIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">SEO & App Metadata</CardTitle>
                            <CardDescription>Configure how your app appears in search engines and app stores.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="SEO Manager"
                        idLabel="Config Type"
                        idValue="Public Metadata"
                        usageExample={guideUsage}
                        devNote="OG Image should be 1200x630 for best social sharing results."
                        buttonVariant="labeled"
                        buttonLabel="Metadata Guide"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500">Global Search Title</label>
                        <Input 
                            value={safeSeo.title}
                            onChange={(e) => updateSettings('title', e.target.value)}
                            placeholder="My Awesome App | Enterprise Dashboard"
                            className="text-sm font-bold"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500">Meta Description</label>
                        <textarea 
                            value={safeSeo.description}
                            onChange={(e) => updateSettings('description', e.target.value)}
                            className="content-input min-h-[80px] text-sm resize-none"
                            placeholder="Enter a compelling description for search engine results..."
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <TagIcon className="w-3.5 h-3.5" />
                            Keywords (SEO Tags)
                        </label>
                        <div className="flex gap-2 mb-3">
                            <Input 
                                id="new-keyword"
                                placeholder="Add keyword..."
                                className="text-sm h-9"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addKeyword((e.target as HTMLInputElement).value)
                                        ;(e.target as HTMLInputElement).value = ''
                                    }
                                }}
                            />
                            <button 
                                onClick={() => {
                                    const input = document.getElementById('new-keyword') as HTMLInputElement
                                    addKeyword(input.value)
                                    input.value = ''
                                }}
                                className="px-3 h-9 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {safeSeo.keywords.map(word => (
                                <div key={word} className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                                    {word}
                                    <button onClick={() => removeKeyword(word)} className="hover:text-indigo-900">
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <PhotoIcon className="w-3.5 h-3.5" />
                            OG / Social Sharing Image URL
                        </label>
                        <Input 
                            value={safeSeo.ogImage}
                            onChange={(e) => updateSettings('ogImage', e.target.value)}
                            placeholder="https://example.com/og-image.jpg"
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-2">
                            <ShareIcon className="w-3.5 h-3.5" />
                            Twitter / X Handle
                        </label>
                        <Input 
                            value={safeSeo.twitterHandle}
                            onChange={(e) => updateSettings('twitterHandle', e.target.value)}
                            placeholder="@yourcompany"
                            className="text-sm font-mono"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 md:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                <DevicePhoneMobileIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900">Apple App Store ID</h4>
                                <p className="text-xs text-gray-500">The 9-digit ID for Smart App Banners and Store links.</p>
                                <Input 
                                    value={safeSeo.appleAppId}
                                    onChange={(e) => updateSettings('appleAppId', e.target.value)}
                                    placeholder="e.g. 123456789"
                                    className="mt-2 text-sm max-w-[200px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
