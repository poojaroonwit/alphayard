'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DataCollectionView } from '../../../../components/common/DataCollectionView'
import { DynamicCollection } from '../../../../types/collection'
import { adminService } from '../../../../services/adminService'
import { useApp } from '../../../../contexts/AppContext'

export default function DynamicCollectionPage() {
    const params = useParams()
    const router = useRouter()
    
    const slug = (params?.slug as string) || ''
    
    const [config, setConfig] = useState<DynamicCollection | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingConfig, setLoadingConfig] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchConfig = async () => {
        setLoadingConfig(true)
        setError(null)
        try {
            const config = await adminService.getEntityType(slug)
            if (!config) {
                setError(`Collection "${slug}" configuration not found`)
                setLoadingConfig(false)
                return
            }
            setConfig(config)
        } catch (err: any) {
            console.error(`Failed to fetch config for ${slug}:`, err)
            const errorMessage = err.message || err.error || `Collection "${slug}" configuration not found`
            setError(errorMessage)
            // Don't set config to null here, let the error state handle it
        } finally {
            setLoadingConfig(false)
        }
    }

    const fetchData = async (currentConfig?: any) => {
        const activeConfig = currentConfig || config
        if (!activeConfig) {
            setError('Collection configuration is missing')
            setLoading(false)
            return
        }
        
        if (!activeConfig.apiEndpoint) {
            setError('API endpoint is not configured for this collection')
            setLoading(false)
            return
        }
        
        setLoading(true)
        setError(null)
        try {
            const data = await adminService.getEntities(activeConfig.apiEndpoint)
            
            // Handle different API response structures using responseKey
            let items = []
            if (activeConfig.responseKey && data && data[activeConfig.responseKey]) {
                items = data[activeConfig.responseKey]
            } else if (Array.isArray(data)) {
                items = data
            } else if (Array.isArray(data?.data)) {
                items = data.data
            } else if (data && typeof data === 'object') {
                const key = Object.keys(data).find(k => Array.isArray(data[k]))
                if (key) items = data[key]
            }

            // Flatten entity structure - unwrap attributes/data to top level for easier access
            const flattenedItems = (items || []).map((item: any) => {
                // If it's a unified entity, flatten attributes to top level
                if (item.attributes || item.data) {
                    const attrs = item.attributes || item.data || {}
                    const createdAt = item.createdAt || item.created_at
                    const updatedAt = item.updatedAt || item.updated_at
                    
                    return {
                        id: item.id,
                        ...attrs, // Spread all attributes to top level
                        // Add entity metadata fields at top level for column accessors
                        created_at: createdAt,
                        createdAt: createdAt,
                        updated_at: updatedAt,
                        updatedAt: updatedAt,
                        // Keep entity metadata accessible
                        _entity: {
                            type: item.type,
                            status: item.status,
                            createdAt,
                            updatedAt,
                            applicationId: item.applicationId || item.application_id,
                            ownerId: item.ownerId || item.owner_id
                        }
                    }
                }
                return item
            })

            setData(flattenedItems)
        } catch (err: any) {
            console.error(`Failed to fetch ${slug}:`, err)
            const errorMessage = err.message || err.error || `Failed to load data for "${slug}"`
            setError(errorMessage)
            setData([])
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (item: any) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return
        try {
            await adminService.deleteEntity(config?.apiEndpoint || '', item.id)
            fetchData() 
        } catch (err: any) {
            alert('Failed to delete: ' + err.message)
        }
    }

    const handleSave = async (formData: any) => {
        setSubmitting(true)
        try {
            if (editingItem) {
                await adminService.updateEntity(config?.apiEndpoint || '', editingItem.id, formData)
            } else {
                await adminService.createEntity(config?.apiEndpoint || '', formData)
            }
            setIsModalOpen(false)
            setEditingItem(null)
            fetchData()
        } catch (err: any) {
            alert('Failed to save: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        if (slug) {
            const loadPage = async () => {
                try {
                    setLoadingConfig(true)
                    setError(null)
                    const fetchedConfig = await adminService.getEntityType(slug)
                    if (!fetchedConfig) {
                        setError(`Collection "${slug}" not found`)
                        setLoadingConfig(false)
                        setLoading(false)
                        return
                    }
                    setConfig(fetchedConfig)
                    setLoadingConfig(false)
                    // Debug: Log the endpoint being used
                    console.log(`[Collections] Loading collection "${slug}" with endpoint:`, fetchedConfig.apiEndpoint)
                    await fetchData(fetchedConfig)
                } catch (err: any) {
                    console.error('Page load error:', err)
                    const errorMessage = err.message || err.error || `Failed to load collection "${slug}"`
                    setError(errorMessage)
                    setLoadingConfig(false)
                    setLoading(false)
                }
            }
            loadPage()
        }
    }, [slug])

    if (loadingConfig) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error && !config) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <h1 className="text-xl font-bold text-red-900 mb-2">Error Loading Collection</h1>
                    <p className="text-red-700 mb-4">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => {
                                setError(null)
                                if (slug) {
                                    const loadPage = async () => {
                                        try {
                                            setLoadingConfig(true)
                                            const fetchedConfig = await adminService.getEntityType(slug)
                                            if (fetchedConfig) {
                                                setConfig(fetchedConfig)
                                                await fetchData(fetchedConfig)
                                            }
                                        } catch (err: any) {
                                            setError(err.message || err.error || `Failed to load collection "${slug}"`)
                                        } finally {
                                            setLoadingConfig(false)
                                        }
                                    }
                                    loadPage()
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                        <button 
                            onClick={() => router.push('/collections')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Back to Collections
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!config) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h1 className="text-xl font-bold text-gray-900 mb-2">Collection Not Found</h1>
                <p>The collection "{slug}" is not configured.</p>
                <button 
                    onClick={() => router.push('/collections')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Back to Collections
                </button>
            </div>
        )
    }

    return (
        <DataCollectionView
            collectionName={config.id || ''}
            title={config.title || ''}
            description={config.description}
            columns={config.columns || []}
            data={data}
            loading={loading}
            error={error}
            searchable={config.searchable}
            searchPlaceholder={config.searchPlaceholder}
            
            // CRUD Props
            canCreate={config.canCreate}
            canUpdate={config.canUpdate}
            canDelete={config.canDelete}
            schema={config.schema}
            
            onAdd={config.canCreate ? () => {
                setEditingItem(null)
                setIsModalOpen(true)
            } : undefined}
            
            onEdit={config.canUpdate ? (item) => {
                setEditingItem(item)
                setIsModalOpen(true)
            } : undefined}
            
            onDelete={config.canDelete ? handleDelete : undefined}
            
            // Modal Props (Assuming DataCollectionView handles modal or passing props suitable for it)
            isModalOpen={isModalOpen}
            onCloseModal={() => setIsModalOpen(false)}
            onSave={handleSave}
            editingItem={editingItem}
            isSubmitting={submitting}
        />
    )
}
