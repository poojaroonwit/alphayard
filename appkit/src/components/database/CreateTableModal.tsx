'use client';

import React, { useState, useEffect } from 'react';
import { X, Table, Plus, Trash2 } from 'lucide-react';

interface Column {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string;
    isPrimaryKey: boolean;
}

const POSTGRES_TYPES = [
    'SERIAL',
    'BIGSERIAL',
    'INTEGER',
    'BIGINT',
    'SMALLINT',
    'TEXT',
    'VARCHAR(255)',
    'CHAR(1)',
    'BOOLEAN',
    'DATE',
    'TIMESTAMP',
    'TIMESTAMPTZ',
    'TIME',
    'NUMERIC',
    'DECIMAL',
    'REAL',
    'DOUBLE PRECISION',
    'UUID',
    'JSON',
    'JSONB',
    'BYTEA'
];

interface CreateTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    schemas: { name: string }[];
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    schemas
}) => {
    const [schema, setSchema] = useState('public');
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState<Column[]>([
        { name: 'id', type: 'SERIAL', nullable: false, defaultValue: '', isPrimaryKey: true }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (schemas.length > 0 && !schemas.find(s => s.name === schema)) {
            setSchema(schemas[0].name);
        }
    }, [schemas, schema]);

    if (!isOpen) return null;

    const addColumn = () => {
        setColumns([
            ...columns,
            { name: '', type: 'TEXT', nullable: true, defaultValue: '', isPrimaryKey: false }
        ]);
    };

    const removeColumn = (index: number) => {
        if (columns.length > 1) {
            setColumns(columns.filter((_, i) => i !== index));
        }
    };

    const updateColumn = (index: number, field: keyof Column, value: any) => {
        const updated = [...columns];
        updated[index] = { ...updated[index], [field]: value };
        
        // Only one primary key allowed
        if (field === 'isPrimaryKey' && value === true) {
            updated.forEach((col, i) => {
                if (i !== index) col.isPrimaryKey = false;
            });
        }
        
        setColumns(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate
        if (!tableName.trim()) {
            setError('Table name is required');
            return;
        }

        const invalidColumns = columns.filter(c => !c.name.trim());
        if (invalidColumns.length > 0) {
            setError('All columns must have a name');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/v1/admin/database/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ schema, tableName, columns })
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to create table');
            }

            setTableName('');
            setColumns([{ name: 'id', type: 'SERIAL', nullable: false, defaultValue: '', isPrimaryKey: true }]);
            onCreated();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Table size={20} className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold">Create New Table</h3>
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

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Schema</label>
                            <select
                                value={schema}
                                onChange={e => setSchema(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {schemas.map(s => (
                                    <option key={s.name} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Table Name</label>
                            <input
                                type="text"
                                value={tableName}
                                onChange={e => setTableName(e.target.value)}
                                placeholder="e.g., my_table"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">Columns</label>
                            <button
                                type="button"
                                onClick={addColumn}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                                <Plus size={16} /> Add Column
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">PK</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Nullable</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                                        <th className="px-3 py-2 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {columns.map((col, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={col.name}
                                                    onChange={e => updateColumn(index, 'name', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                                    placeholder="column_name"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={col.type}
                                                    onChange={e => updateColumn(index, 'type', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                                >
                                                    {POSTGRES_TYPES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={col.isPrimaryKey}
                                                    onChange={e => updateColumn(index, 'isPrimaryKey', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={col.nullable}
                                                    onChange={e => updateColumn(index, 'nullable', e.target.checked)}
                                                    disabled={col.isPrimaryKey}
                                                    className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={col.defaultValue}
                                                    onChange={e => updateColumn(index, 'defaultValue', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                                    placeholder="DEFAULT value"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeColumn(index)}
                                                    disabled={columns.length === 1}
                                                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                        disabled={loading || !tableName.trim()}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Table'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTableModal;
