'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CollectionSchemaBuilder, CollectionSchemaData, FieldDefinition } from '../../../../../components/collections/CollectionSchemaBuilder'
import { adminService } from '../../../../../services/adminService'
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner'

export default function EditCollectionPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [initialData, setInitialData] = useState<CollectionSchemaData | null>(null)

    useEffect(() => {
        loadEntityType()
    }, [id])

    const loadEntityType = async () => {
        setLoading(true)
        setError(null)
        try {
            const entityType = await adminService.getEntityType(id)
            if (!entityType) {
                setError('Collection not found')
                return
            }

            // Map to CollectionSchemaData format
            const fields: FieldDefinition[] = (entityType.schema?.fields || []).map((f: any, idx: number) => ({
                id: f.id || `field_${idx}`,
                ...f
            }))

            setInitialData({
                name: entityType.name,
                displayName: entityType.displayName,
                description: entityType.description || '',
                icon: entityType.icon || 'collection',
                category: entityType.category, // Load category
                fields
            })
        } catch (err: any) {
            setError(err.message || 'Failed to load collection')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (data: CollectionSchemaData) => {
        await adminService.updateEntityType(id, {
            displayName: data.displayName,
            description: data.description,
            schema: { fields: data.fields },
            icon: data.icon,
            category: data.category // Save category
        })

        // Navigate back to collections list
        router.push('/collections')
    }

    const handleCancel = () => {
        router.push('/collections')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                    onClick={() => router.push('/collections')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    Back to Collections
                </button>
            </div>
        )
    }

    if (!initialData) {
        return null
    }

    return (
        <CollectionSchemaBuilder
            initialData={initialData}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing
        />
    )
}
