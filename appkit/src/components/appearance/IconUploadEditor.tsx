'use client'

import React, { useState, useRef } from 'react'
import { PhotoIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

interface IconUploadEditorProps {
    iconUrl: string
    iconName: string
    onUpload: (file: File) => Promise<string>
    onRemove: () => void
    onChange: (url: string) => void
}

export const IconUploadEditor: React.FC<IconUploadEditorProps> = ({
    iconUrl,
    iconName,
    onUpload,
    onRemove,
    onChange
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0])
        }
    }

    const handleFile = async (file: File) => {
        // Validate file type
        const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PNG, SVG, JPG, or WebP image')
            return
        }

        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            alert('File size must be less than 500KB')
            return
        }

        setIsUploading(true)
        try {
            const url = await onUpload(file)
            onChange(url)
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Icon Preview */}
            <div 
                className={`
                    relative w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center
                    transition-all cursor-pointer overflow-hidden
                    ${dragActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                {iconUrl ? (
                    <img 
                        src={iconUrl} 
                        alt={iconName} 
                        className="w-full h-full object-contain p-1"
                    />
                ) : (
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                )}
                
                {isUploading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Info & Actions */}
            <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{iconName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {iconUrl ? 'Click to replace' : 'PNG, SVG, JPG (max 500KB)'}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleClick}
                    className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    title="Upload"
                >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                </button>
                
                {iconUrl && (
                    <button
                        onClick={onRemove}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        title="Remove"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    )
}

export default IconUploadEditor
