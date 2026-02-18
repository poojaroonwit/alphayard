'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Edit } from 'lucide-react';

interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
}

interface RowEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    schema: string;
    tableName: string;
    columns: ColumnInfo[];
    mode: 'insert' | 'edit';
    rowData?: Record<string, any>;
    pkValue?: any;
}

export const RowEditorModal: React.FC<RowEditorModalProps> = ({
    isOpen,
    onClose,
    onSaved,
    schema,
    tableName,
    columns,
    mode,
    rowData,
    pkValue
}) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [nullFields, setNullFields] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && rowData) {
                const data: Record<string, any> = {};
                const nulls = new Set<string>();
                columns.forEach(col => {
                    if (rowData[col.name] === null) {
                        nulls.add(col.name);
                        data[col.name] = '';
                    } else {
                        data[col.name] = rowData[col.name] ?? '';
                    }
                });
                setFormData(data);
                setNullFields(nulls);
            } else {
                // Insert mode - empty form
                const data: Record<string, any> = {};
                columns.forEach(col => {
                    data[col.name] = '';
                });
                setFormData(data);
                setNullFields(new Set());
            }
        }
    }, [isOpen, mode, rowData, columns]);

    if (!isOpen) return null;

    const handleChange = (columnName: string, value: string) => {
        setFormData(prev => ({ ...prev, [columnName]: value }));
        // Unset null when user types
        if (nullFields.has(columnName)) {
            setNullFields(prev => {
                const next = new Set(prev);
                next.delete(columnName);
                return next;
            });
        }
    };

    const toggleNull = (columnName: string) => {
        setNullFields(prev => {
            const next = new Set(prev);
            if (next.has(columnName)) {
                next.delete(columnName);
            } else {
                next.add(columnName);
                setFormData(p => ({ ...p, [columnName]: '' }));
            }
            return next;
        });
    };

    const getInputType = (type: string): string => {
        const t = type.toLowerCase();
        if (t.includes('int') || t === 'serial' || t === 'bigserial' || t === 'numeric' || t === 'decimal' || t === 'real' || t.includes('double')) {
            return 'number';
        }
        if (t === 'date') return 'date';
        if (t === 'time') return 'time';
        if (t.includes('timestamp')) return 'datetime-local';
        if (t === 'boolean' || t === 'bool') return 'checkbox';
        return 'text';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('admin_token');
            
            // Build the data object with proper null handling
            const dataToSend: Record<string, any> = {};
            const pkColumn = columns.find(c => c.isPrimaryKey);

            columns.forEach(col => {
                // Skip auto-generated primary keys on insert
                if (mode === 'insert' && col.isPrimaryKey && (col.type.toLowerCase().includes('serial') || col.defaultValue?.includes('nextval'))) {
                    return;
                }
                // Skip primary key on edit (can't change PK)
                if (mode === 'edit' && col.isPrimaryKey) {
                    return;
                }

                if (nullFields.has(col.name)) {
                    dataToSend[col.name] = null;
                } else {
                    const value = formData[col.name];
                    const inputType = getInputType(col.type);
                    
                    if (inputType === 'checkbox') {
                        dataToSend[col.name] = value === true || value === 'true' || value === '1';
                    } else if (inputType === 'number' && value !== '') {
                        dataToSend[col.name] = Number(value);
                    } else if (value !== '' || !col.nullable) {
                        dataToSend[col.name] = value;
                    }
                }
            });

            const url = mode === 'insert'
                ? `/api/v1/admin/database/tables/${schema}/${tableName}/rows`
                : `/api/v1/admin/database/tables/${schema}/${tableName}/rows/${pkValue}`;

            const res = await fetch(url, {
                method: mode === 'insert' ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || `Failed to ${mode} row`);
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const pkColumn = columns.find(c => c.isPrimaryKey);
    const isAutoGenPK = pkColumn && (pkColumn.type.toLowerCase().includes('serial') || pkColumn.defaultValue?.includes('nextval'));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode === 'insert' ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {mode === 'insert' ? <Plus size={20} className="text-green-600" /> : <Edit size={20} className="text-orange-600" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{mode === 'insert' ? 'Insert New Row' : 'Edit Row'}</h3>
                            <p className="text-sm text-gray-500">{schema}.{tableName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {columns.map(col => {
                            const inputType = getInputType(col.type);
                            const isDisabled = mode === 'edit' && col.isPrimaryKey;
                            const skipOnInsert = mode === 'insert' && col.isPrimaryKey && isAutoGenPK;

                            if (skipOnInsert) {
                                return (
                                    <div key={col.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-500">{col.name}</label>
                                            <p className="text-sm text-gray-400">Auto-generated</p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={col.name} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {col.name}
                                            {col.isPrimaryKey && <span className="ml-1 text-blue-500 text-xs">(PK)</span>}
                                            {!col.nullable && !col.isPrimaryKey && <span className="ml-1 text-red-500">*</span>}
                                        </label>
                                        <span className="text-xs text-gray-400">{col.type}</span>
                                    </div>

                                    {inputType === 'checkbox' ? (
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData[col.name] === true || formData[col.name] === 'true'}
                                                    onChange={e => handleChange(col.name, e.target.checked ? 'true' : 'false')}
                                                    disabled={isDisabled || nullFields.has(col.name)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-sm">True</span>
                                            </label>
                                            {col.nullable && (
                                                <label className="flex items-center gap-2 ml-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={nullFields.has(col.name)}
                                                        onChange={() => toggleNull(col.name)}
                                                        className="w-4 h-4 text-gray-400 rounded"
                                                    />
                                                    <span className="text-sm text-gray-500">NULL</span>
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type={inputType}
                                                value={nullFields.has(col.name) ? '' : (formData[col.name] ?? '')}
                                                onChange={e => handleChange(col.name, e.target.value)}
                                                disabled={isDisabled || nullFields.has(col.name)}
                                                placeholder={nullFields.has(col.name) ? 'NULL' : ''}
                                                className={`flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm 
                                                    ${isDisabled ? 'bg-gray-100 text-gray-500' : ''} 
                                                    ${nullFields.has(col.name) ? 'bg-gray-50 text-gray-400 italic' : ''}
                                                    focus:ring-2 focus:ring-blue-500`}
                                            />
                                            {col.nullable && (
                                                <label className="flex items-center gap-1 text-sm text-gray-500">
                                                    <input
                                                        type="checkbox"
                                                        checked={nullFields.has(col.name)}
                                                        onChange={() => toggleNull(col.name)}
                                                        className="w-4 h-4 text-gray-400 rounded"
                                                    />
                                                    NULL
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </form>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                            mode === 'insert' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                    >
                        <Save size={16} />
                        {loading ? 'Saving...' : mode === 'insert' ? 'Insert Row' : 'Update Row'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RowEditorModal;
