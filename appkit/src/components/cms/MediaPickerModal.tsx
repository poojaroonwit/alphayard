'use client'

import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Tabs } from '../ui/Tabs'
import { MediaUpload, MediaGallery } from './MediaUpload'
import { CloudArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface MediaFile {
  id: string
  url: string
  name: string
  size: number
  type: string
  createdAt: string
}

interface MediaPickerModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (file: MediaFile) => void
    title?: string
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Select Image"
}) => {
    const [activeTab, setActiveTab] = useState('library')

    const tabs = [
        { id: 'library', label: 'Media Library', icon: <PhotoIcon className="w-4 h-4" /> },
        { id: 'upload', label: 'Upload New', icon: <CloudArrowUpIcon className="w-4 h-4" /> }
    ]

    const handleUploadComplete = (file: MediaFile) => {
        onSelect(file)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="xl"
            className="h-[600px] flex flex-col"
        >
            <div className="flex flex-col h-full -mt-2">
                <div className="mb-4">
                    <Tabs 
                        tabs={tabs} 
                        activeTab={activeTab} 
                        onChange={setActiveTab} 
                        variant="pills"
                        className="w-full max-w-sm"
                    />
                </div>

                <div className="flex-1 overflow-hidden min-h-0 relative rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    {activeTab === 'library' ? (
                        <MediaGallery 
                            onSelect={(file) => {
                                onSelect(file)
                                onClose()
                            }}
                            className="h-full overflow-y-auto pr-2"
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-gray-200">
                             <MediaUpload 
                                onUploadComplete={handleUploadComplete}
                                accept="image/*"
                                className="w-full max-w-2xl mx-auto"
                             />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
