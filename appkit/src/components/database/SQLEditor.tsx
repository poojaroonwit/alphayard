'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Save, History, AlertCircle, CheckCircle, Clock, Database, ChevronDown } from 'lucide-react';

interface QueryResult {
    rows: any[];
    rowCount: number;
    fields: { name: string; dataType: string }[];
    executionTimeMs: number;
}

interface SavedQuery {
    id: string;
    name: string;
    sql: string;
    createdAt: string;
}

interface SQLEditorProps {
    onExecute?: (result: QueryResult) => void;
    defaultQuery?: string;
}

const EXAMPLE_QUERIES = [
    { name: 'All Tables', sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name' },
    { name: 'User Count', sql: 'SELECT COUNT(*) as total_users FROM users' },
    { name: 'Recent Users', sql: 'SELECT id, email, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 10' },
    { name: 'Table Sizes', sql: `SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as data_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20` },
];

export const SQLEditor: React.FC<SQLEditorProps> = ({ onExecute, defaultQuery = '' }) => {
    const [query, setQuery] = useState(defaultQuery || 'SELECT * FROM users LIMIT 10');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [queryName, setQueryName] = useState('');
    const [showExamples, setShowExamples] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load saved queries
    useEffect(() => {
        fetchSavedQueries();
    }, []);

    const fetchSavedQueries = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/v1/admin/database/saved-queries', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSavedQueries(data.queries);
            }
        } catch (err) {
            console.error('Error fetching saved queries:', err);
        }
    };

    const executeQuery = useCallback(async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/v1/admin/database/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sql: query, readOnly: true })
            });

            const data = await res.json();

            if (data.success) {
                setResult(data);
                onExecute?.(data);
            } else {
                setError(data.error || 'Query execution failed');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to execute query');
        } finally {
            setLoading(false);
        }
    }, [query, onExecute]);

    const saveQuery = async () => {
        if (!queryName.trim() || !query.trim()) return;

        try {
            const token = localStorage.getItem('admin_token');
            await fetch('/api/v1/admin/database/saved-queries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: queryName, sql: query })
            });

            setShowSaveModal(false);
            setQueryName('');
            fetchSavedQueries();
        } catch (err) {
            console.error('Error saving query:', err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl/Cmd + Enter to execute
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            executeQuery();
        }
        // Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newQuery = query.substring(0, start) + '  ' + query.substring(end);
                setQuery(newQuery);
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                }, 0);
            }
        }
    };

    const formatValue = (value: any): string => {
        if (value === null) return 'NULL';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={executeQuery}
                        disabled={loading || !query.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Play size={16} />
                        <span>Run</span>
                    </button>
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Save size={16} />
                        <span>Save</span>
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <History size={16} />
                            <span>Examples</span>
                            <ChevronDown size={14} />
                        </button>
                        {showExamples && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                {EXAMPLE_QUERIES.map((ex, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setQuery(ex.sql);
                                            setShowExamples(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                                    >
                                        {ex.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+Enter</kbd> to run
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Query Input */}
                <div className="relative flex-shrink-0" style={{ minHeight: '150px' }}>
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full min-h-[150px] p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none"
                        placeholder="Enter your SQL query here..."
                        spellCheck={false}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">SQL</span>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 border-t border-gray-200 overflow-hidden flex flex-col">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            {loading && (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Executing...</span>
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle size={16} />
                                    <span className="text-sm">Error</span>
                                </div>
                            )}
                            {result && !error && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle size={16} />
                                        <span className="text-sm">Success</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Database size={14} />
                                        <span className="text-sm">{result.rowCount} rows</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Clock size={14} />
                                        <span className="text-sm">{result.executionTimeMs}ms</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 border-b border-red-100">
                            <p className="text-red-700 font-mono text-sm whitespace-pre-wrap">{error}</p>
                        </div>
                    )}

                    {/* Results Table */}
                    {result && result.rows.length > 0 && (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                                            #
                                        </th>
                                        {result.fields.map((field, i) => (
                                            <th
                                                key={i}
                                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
                                            >
                                                <div>{field.name}</div>
                                                <div className="text-[10px] font-normal text-gray-400 normal-case">{field.dataType}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.rows.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                                                {rowIndex + 1}
                                            </td>
                                            {result.fields.map((field, colIndex) => (
                                                <td key={colIndex} className="px-4 py-2 font-mono text-gray-900 max-w-xs truncate">
                                                    <span className={row[field.name] === null ? 'text-gray-400 italic' : ''}>
                                                        {formatValue(row[field.name])}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Empty State */}
                    {result && result.rows.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Database size={40} className="mx-auto mb-2 text-gray-300" />
                                <p>Query returned no results</p>
                            </div>
                        </div>
                    )}

                    {/* Initial State */}
                    {!result && !error && !loading && (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Play size={40} className="mx-auto mb-2" />
                                <p>Run a query to see results</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Query Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Query</h3>
                        <input
                            type="text"
                            value={queryName}
                            onChange={(e) => setQueryName(e.target.value)}
                            placeholder="Query name"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveQuery}
                                disabled={!queryName.trim()}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SQLEditor;
