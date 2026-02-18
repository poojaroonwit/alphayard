'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Database, 
    Table, 
    Code, 
    BarChart3, 
    HardDrive, 
    Users, 
    Clock, 
    RefreshCw,
    Terminal,
    Layers,
    Activity,
    GitBranch
} from 'lucide-react';
import { SQLEditor } from '@/components/database/SQLEditor';
import { TableExplorer } from '@/components/database/TableExplorer';
import { DatabaseStructureTree } from '@/components/database/DatabaseStructureTree';

// =====================================
// TYPES
// =====================================

interface DatabaseStats {
    databaseSize: string;
    tableCount: number;
    totalRows: number;
    connectionCount: number;
    uptime: string;
}

// =====================================
// MAIN PAGE COMPONENT
// =====================================

export default function DatabasePage() {
    const [activeTab, setActiveTab] = useState<'tables' | 'structure' | 'sql'>('tables');
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [sqlEditorQuery, setSqlEditorQuery] = useState('');
    const [statsError, setStatsError] = useState<string | null>(null);
    const tableExplorerRef = useRef<{ navigateToTable: (name: string, schema: string) => void } | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/v1/admin/database/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            } else {
                setStatsError(data.error || data.message || 'Failed to fetch stats');
                console.error('Stats API error:', data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setStatsError('Network error');
        } finally {
            setLoadingStats(false);
        }
    };

    const handleOpenInEditor = (sql: string) => {
        setSqlEditorQuery(sql);
        setActiveTab('sql');
    };

    const handleNavigateToTable = (tableName: string, schema: string) => {
        setActiveTab('tables');
    };

    return (
        <div className="min-h-screen bg-gray-50 -m-4">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Database size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Database Explorer</h1>
                                <p className="text-sm text-gray-500">Browse tables, view data, and run SQL queries</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchStats}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <RefreshCw size={18} className={loadingStats ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto">
                {/* Stats Grid */}
                {statsError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Error:</span>
                            <span>{statsError}</span>
                            <button
                                onClick={fetchStats}
                                className="ml-auto text-sm underline hover:no-underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-6 px-4 py-2 bg-white border-b border-gray-200 text-sm">
                        <div className="flex items-center gap-2">
                            <HardDrive size={14} className="text-blue-500" />
                            <span className="text-gray-500">Size:</span>
                            <span className="font-medium text-gray-900">{stats?.databaseSize || '-'}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-green-500" />
                            <span className="text-gray-500">Tables:</span>
                            <span className="font-medium text-gray-900">{stats?.tableCount || 0}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <BarChart3 size={14} className="text-purple-500" />
                            <span className="text-gray-500">Rows:</span>
                            <span className="font-medium text-gray-900">{stats?.totalRows?.toLocaleString() || 0}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-orange-500" />
                            <span className="text-gray-500">Connections:</span>
                            <span className="font-medium text-gray-900">{stats?.connectionCount || 0}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-pink-500" />
                            <span className="text-gray-500">Uptime:</span>
                            <span className="font-medium text-gray-900">{stats?.uptime?.split('.')[0] || '-'}</span>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('tables')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'tables'
                                        ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50'
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Table size={18} />
                                Table Explorer
                            </button>
                            <button
                                onClick={() => setActiveTab('structure')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'structure'
                                        ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50'
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <GitBranch size={18} />
                                DB Structure
                            </button>
                            <button
                                onClick={() => setActiveTab('sql')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'sql'
                                        ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50'
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Terminal size={18} />
                                SQL Editor
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[500px]">
                        {activeTab === 'tables' && (
                            <TableExplorer onOpenInEditor={handleOpenInEditor} />
                        )}
                        {activeTab === 'structure' && (
                            <DatabaseStructureTree onNavigateToTable={handleNavigateToTable} />
                        )}
                        {activeTab === 'sql' && (
                            <SQLEditor defaultQuery={sqlEditorQuery} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
