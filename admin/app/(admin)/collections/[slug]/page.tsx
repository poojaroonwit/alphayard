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
        try {
            const config = await adminService.getEntityType(slug)
            setConfig(config)
        } catch (err: any) {
            console.error(`Failed to fetch config for ${slug}:`, err)
            setError(`Collection "${slug}" configuration not found`)
        } finally {
            setLoadingConfig(false)
        }
    }

    const fetchData = async (currentConfig?: any) => {
        const activeConfig = currentConfig || config
        if (!activeConfig) return
        
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

            setData(items)
        } catch (err: any) {
            console.error(`Failed to fetch ${slug}:`, err)
            setError(err.message || 'Failed to load data')
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
                const fetchedConfig = await adminService.getEntityType(slug)
                setConfig(fetchedConfig)
                setLoadingConfig(false)
                if (fetchedConfig) {
                    fetchData(fetchedConfig)
                }
            }
            loadPage().catch(err => {
                console.error('Page load error:', err)
                setError(`Failed to load collection "${slug}"`)
                setLoadingConfig(false)
                setLoading(false)
            })
        }
    }, [slug])

    if (loadingConfig) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!config) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h1 className="text-xl font-bold text-gray-900 mb-2">Collection Not Found</h1>
                <p>The collection "{slug}" is not configured.</p>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Go to Dashboard
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
