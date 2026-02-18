'use client'

import React from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ArrowDownTrayIcon, CodeBracketIcon, DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline'
import { BrandingConfig, CategoryConfig } from './types'

interface ThemeExporterProps {
    branding: BrandingConfig
    categories: CategoryConfig[]
}

export function ThemeExporter({ branding, categories }: ThemeExporterProps) {
    const [copied, setCopied] = React.useState(false)

    const generateThemeJson = () => {
        const theme = {
            metadata: {
                appName: branding.appName,
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            },
            visualTokens: {
                colors: {
                    primary: branding.primaryColor,
                    secondary: branding.secondaryColor
                },
                fonts: {
                    primary: branding.primaryFont,
                    secondary: branding.secondaryFont
                },
                typography: branding.typography,
                navigation: branding.navigation,
                tokens: branding.tokens
            },
            componentStyles: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                components: cat.components.map(comp => ({
                    id: comp.id,
                    name: comp.name,
                    styles: comp.styles,
                    mobileConfig: comp.mobileConfig
                }))
            }))
        }
        return JSON.stringify(theme, null, 2)
    }

    const handleDownload = () => {
        const json = generateThemeJson()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${branding.appName?.toLowerCase().replace(/\s+/g, '-')}-theme.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generateThemeJson())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="p-8 border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <CodeBracketIcon className="w-32 h-32" />
            </div>
            
            <div className="max-w-2xl space-y-8 relative">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Theme Exporter</h3>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Export your custom design system as a structured JSON file. Your mobile developers can use this file to instantly synchronize the app's appearance with your admin configurations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100/50 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <ArrowDownTrayIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 tracking-tight">Download JSON</h4>
                            <p className="text-xs text-blue-700 mt-1">Get the complete theme configuration as a .json file.</p>
                        </div>
                        <Button onClick={handleDownload} className="w-full bg-white hover:bg-white/80 text-blue-600 border border-blue-200 shadow-sm rounded-2xl py-6 font-bold">
                            Download Theme
                        </Button>
                    </div>

                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg shadow-gray-900/20">
                            <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 tracking-tight">Copy to Clipboard</h4>
                            <p className="text-xs text-gray-500 mt-1">Quickly copy the theme JSON for sharing or pasting.</p>
                        </div>
                        <Button onClick={handleCopy} variant="secondary" className="w-full rounded-2xl py-6 font-bold">
                            {copied ? (
                                <span className="flex items-center gap-2 text-green-600">
                                    <CheckIcon className="w-5 h-5" />
                                    Copied!
                                </span>
                            ) : 'Copy JSON'}
                        </Button>
                    </div>
                </div>

                <div className="pt-4">
                    <div className="p-4 rounded-2xl bg-slate-900 overflow-hidden relative group">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JSON Output Preview</span>
                            <span className="text-[10px] py-1 px-2 rounded-full bg-white/10 text-white font-bold">Read Only</span>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 hide-scrollbar">
                            {generateThemeJson()}
                        </pre>
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>
        </Card>
    )
}
