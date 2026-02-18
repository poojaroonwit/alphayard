'use client';

import React, { useState } from 'react';
import { X, Database } from 'lucide-react';

interface CreateSchemaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export const CreateSchemaModal: React.FC<CreateSchemaModalProps> = ({
    isOpen,
    onClose,
    onCreated
}) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/v1/admin/database/schemas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to create schema');
            }

            setName('');
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Database size={20} className="text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-semibold">Create New Schema</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Schema Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., my_schema"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                            title="Use only letters, numbers, and underscores. Must start with a letter or underscore."
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Use only letters, numbers, and underscores. Must start with a letter or underscore.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Schema'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSchemaModal;
