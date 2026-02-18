'use client'

import React, { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from './Button'
import { 
    BookOpenIcon, 
    XMarkIcon, 
    ClipboardDocumentIcon, 
    CheckIcon, 
    InformationCircleIcon, 
    SparklesIcon 
} from '@heroicons/react/24/outline'

interface MobileGuideProps {
    title: string
    subtitle?: string
    idLabel: string
    idValue: string
    usageExample: string
    devNote: string
    buttonLabel?: string
    buttonVariant?: 'icon' | 'labeled'
    className?: string
}

interface MobileGuideContentProps {
    idLabel: string
    idValue: string
    usageExample: string
    devNote: string
}

export function MobileGuideContent({ idLabel, idValue, usageExample, devNote }: MobileGuideContentProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-8">
            {/* ID / Path Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    {idLabel}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-mono text-gray-600 break-all select-all flex items-start gap-3">
                    <div className="mt-0.5 min-w-[1.25rem]"><InformationCircleIcon className="w-5 h-5 text-gray-400" /></div>
                    {idValue}
                </div>
            </div>

            {/* Usage Example Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    Usage Example
                </div>
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                        <span className="text-xs font-medium text-gray-400">TSX / JSX</span>
                        <button 
                            onClick={() => handleCopy(usageExample)}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
                        >
                            {copied ? (
                                <><CheckIcon className="w-3.5 h-3.5" /> Copied</>
                            ) : (
                                <><ClipboardDocumentIcon className="w-3.5 h-3.5" /> Copy Code</>
                            )}
                        </button>
                    </div>
                    <div className="bg-gray-900 p-4 overflow-x-auto">
                        <pre className="text-sm font-mono text-gray-100 leading-relaxed">
                            {usageExample}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Developer Note Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100/50">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-900 mb-2">
                    <SparklesIcon className="w-4 h-4 text-indigo-500" />
                    Developer Note
                </h4>
                <p className="text-sm text-indigo-800/80 leading-relaxed">
                    {devNote}
                </p>
            </div>
        </div>
    )
}

export function MobileGuide({
    title,
    subtitle = 'Mobile Implementation Guide',
    idLabel,
    idValue,
    usageExample,
    devNote,
    buttonLabel = 'Mobile Guide',
    buttonVariant = 'labeled',
    className = ''
}: MobileGuideProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {buttonVariant === 'labeled' ? (
                <button 
                    type="button"
                    className={`relative z-20 h-8 px-3 flex items-center gap-2 bg-white hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-full shadow-sm ring-1 ring-gray-200 transition-all duration-200 text-xs font-medium ${className}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(true)
                    }}
                >
                    <BookOpenIcon className="w-4 h-4" />
                    <span>{buttonLabel}</span>
                </button>
            ) : (
                <button 
                    type="button"
                    className={`p-2 bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-full shadow-sm ring-1 ring-gray-200 transition-all duration-200 ${className}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(true)
                    }}
                    title={buttonLabel}
                >
                    <BookOpenIcon className="w-5 h-5" />
                </button>
            )}

            <Transition show={isOpen} as={Fragment}>
                <Dialog 
                    onClose={() => setIsOpen(false)}
                    className="relative z-[110]"
                >
                    {/* Backdrop - intentionally transparent and non-blocking to meet "not show overlay" & "over top everything" request */}
                    <div className="fixed inset-0 pointer-events-none" aria-hidden="true" />

                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 pt-4 pr-4 pb-4">
                                <Transition.Child
                                    as={Fragment}
                                    enter="transform transition ease-in-out duration-300"
                                    enterFrom="translate-x-full"
                                    enterTo="translate-x-0"
                                    leave="transform transition ease-in-out duration-300"
                                    leaveFrom="translate-x-0"
                                    leaveTo="translate-x-full"
                                >
                                    <Dialog.Panel className="pointer-events-auto w-screen max-w-[450px]">
                                        <div className="flex h-full flex-col bg-white shadow-2xl border border-gray-200 rounded-2xl overflow-hidden">
                                            {/* Header */}
                                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                        <BookOpenIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <Dialog.Title className="font-semibold text-gray-900">{title}</Dialog.Title>
                                                        <p className="text-xs text-gray-500">{subtitle}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setIsOpen(false)} 
                                                    className="hover:bg-gray-100 rounded-full w-8 h-8 p-0 flex items-center justify-center"
                                                >
                                                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                                                </Button>
                                            </div>

                                            {/* Scrolling Body */}
                                            <div className="p-6 flex-1 overflow-y-auto">
                                                <MobileGuideContent 
                                                    idLabel={idLabel}
                                                    idValue={idValue}
                                                    usageExample={usageExample}
                                                    devNote={devNote}
                                                />
                                            </div>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
