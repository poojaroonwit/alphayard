'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'

// Field types from schema
export interface FieldDefinition {
    name: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'reference' | 'image' | 'json'
    required: boolean
    placeholder?: string
    defaultValue?: any
    options?: { value: string; label: string }[]
    referenceType?: string
    validation?: {
        min?: number
        max?: number
        pattern?: string
        message?: string
    }
}

interface DynamicEntityFormProps {
    schema: { fields: FieldDefinition[] }
    initialData?: Record<string, any>
    onSave: (data: Record<string, any>) => Promise<void>
    onCancel: () => void
    isEditing?: boolean
    title?: string
}

export function DynamicEntityForm({
    schema,
    initialData = {},
    onSave,
    onCancel,
    isEditing = false,
    title
}: DynamicEntityFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [globalError, setGlobalError] = useState<string | null>(null)

    useEffect(() => {
        // Initialize form data with defaults and initial values
        const initial: Record<string, any> = {}
        for (const field of schema.fields) {
            initial[field.name] = initialData[field.name] ?? field.defaultValue ?? getDefaultForType(field.type)
        }
        setFormData(initial)
    }, [schema, initialData])

    const getDefaultForType = (type: string): any => {
        switch (type) {
            case 'boolean': return false
            case 'number': return ''
            case 'multiselect': return []
            case 'json': return '{}'
            default: return ''
        }
    }

    const updateField = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[name]
                return next
            })
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        for (const field of schema.fields) {
            const value = formData[field.name]

            // Required check
            if (field.required) {
                if (value === undefined || value === null || value === '') {
                    newErrors[field.name] = `${field.label} is required`
                    continue
                }
                if (field.type === 'multiselect' && Array.isArray(value) && value.length === 0) {
                    newErrors[field.name] = `${field.label} is required`
                    continue
                }
            }

            // Type-specific validation
            if (value !== '' && value !== undefined && value !== null) {
                if (field.type === 'number' && field.validation) {
                    const num = Number(value)
                    if (field.validation.min !== undefined && num < field.validation.min) {
                        newErrors[field.name] = field.validation.message || `Minimum value is ${field.validation.min}`
                    }
                    if (field.validation.max !== undefined && num > field.validation.max) {
                        newErrors[field.name] = field.validation.message || `Maximum value is ${field.validation.max}`
                    }
                }

                if (field.type === 'text' && field.validation?.pattern) {
                    const regex = new RegExp(field.validation.pattern)
                    if (!regex.test(String(value))) {
                        newErrors[field.name] = field.validation.message || `Invalid format`
                    }
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        setGlobalError(null)

        if (!validate()) {
            return
        }

        setSaving(true)
        try {
            // Convert form data to proper types
            const data: Record<string, any> = {}
            for (const field of schema.fields) {
                let value = formData[field.name]
                if (field.type === 'number' && value !== '') {
                    value = Number(value)
                }
                if (field.type === 'json' && typeof value === 'string') {
                    try {
                        value = JSON.parse(value)
                    } catch {
                        // Keep as string if invalid JSON
                    }
                }
                data[field.name] = value
            }

            await onSave(data)
        } catch (err: any) {
            setGlobalError(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const renderField = (field: FieldDefinition) => {
        const value = formData[field.name]
        const error = errors[field.name]

        const labelElement = (
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
        )

        const errorElement = error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
        )

        const inputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={inputClasses}
                        />
                        {errorElement}
                    </div>
                )

            case 'number':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="number"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            className={inputClasses}
                        />
                        {errorElement}
                    </div>
                )

            case 'boolean':
                return (
                    <div key={field.name} className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => updateField(field.name, e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                            {field.label}
                        </label>
                        {errorElement}
                    </div>
                )

            case 'date':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="date"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className={inputClasses}
                        />
                        {errorElement}
                    </div>
                )

            case 'datetime':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="datetime-local"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className={inputClasses}
                        />
                        {errorElement}
                    </div>
                )

            case 'select':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <select
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className={inputClasses}
                        >
                            <option value="">Select {field.label}...</option>
                            {(field.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errorElement}
                    </div>
                )

            case 'multiselect':
                const selectedValues = Array.isArray(value) ? value : []
                return (
                    <div key={field.name}>
                        {labelElement}
                        <div className="space-y-2">
                            {(field.options || []).map(opt => (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedValues.includes(opt.value)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateField(field.name, [...selectedValues, opt.value])
                                            } else {
                                                updateField(field.name, selectedValues.filter((v: string) => v !== opt.value))
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                        {errorElement}
                    </div>
                )

            case 'image':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="url"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder || 'Enter image URL...'}
                            className={inputClasses}
                        />
                        {value && (
                            <div className="mt-2">
                                <img
                                    src={value}
                                    alt="Preview"
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                />
                            </div>
                        )}
                        {errorElement}
                    </div>
                )

            case 'json':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <textarea
                            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder || '{ }'}
                            rows={4}
                            className={`${inputClasses} font-mono text-sm resize-none`}
                        />
                        {errorElement}
                    </div>
                )

            case 'reference':
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder || 'Enter reference ID...'}
                            className={inputClasses}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Reference to: {field.referenceType || 'entity'}
                        </p>
                        {errorElement}
                    </div>
                )

            default:
                return (
                    <div key={field.name}>
                        {labelElement}
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={inputClasses}
                        />
                        {errorElement}
                    </div>
                )
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {title || (isEditing ? 'Edit Item' : 'Add New Item')}
                    </h2>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="space-y-6">
                {globalError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {globalError}
                    </div>
                )}

                {schema.fields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No fields defined for this collection
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {schema.fields.map(field => renderField(field))}
                    </div>
                )}
            </CardBody>
        </Card>
    )
}
