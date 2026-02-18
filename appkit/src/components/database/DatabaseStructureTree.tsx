'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Database,
    Table as TableIcon,
    Key,
    Link2,
    Search,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Folder,
    FolderOpen,
    Hash,
    Type,
    Calendar,
    ToggleLeft,
    FileJson,
    Columns3,
    Layers,
    Box,
    CircleDot
} from 'lucide-react';

// =====================================
// TYPES
// =====================================

interface TableInfo {
    tableName: string;
    schema: string;
    rowCount: number;
    sizeBytes: number;
    sizeFormatted: string;
    columns: ColumnInfo[];
}

interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    foreignKeyRef?: string;
    maxLength?: number;
}

// =====================================
// SCHEMA COLORS
// =====================================

const SCHEMA_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; dot: string; gradientFrom: string; gradientTo: string }> = {
    core:     { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', gradientFrom: 'from-blue-500', gradientTo: 'to-blue-600' },
    admin:    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', gradientFrom: 'from-amber-500', gradientTo: 'to-amber-600' },
    bondarys: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', gradientFrom: 'from-purple-500', gradientTo: 'to-purple-600' },
    public:   { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', gradientFrom: 'from-gray-400', gradientTo: 'to-gray-500' },
};

const getSchemaColor = (schema: string) => SCHEMA_COLORS[schema] || SCHEMA_COLORS.public;

const getColumnIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('int') || lowerType === 'numeric' || lowerType === 'decimal' || lowerType === 'float4' || lowerType === 'float8') return Hash;
    if (lowerType.includes('char') || lowerType === 'text' || lowerType === 'varchar') return Type;
    if (lowerType.includes('timestamp') || lowerType === 'date' || lowerType === 'time' || lowerType === 'timestamptz') return Calendar;
    if (lowerType === 'bool' || lowerType === 'boolean') return ToggleLeft;
    if (lowerType === 'json' || lowerType === 'jsonb') return FileJson;
    if (lowerType === 'uuid') return Key;
    return CircleDot;
};

const SCHEMA_DESCRIPTIONS: Record<string, string> = {
    core: 'Core application tables - users, auth, sessions, settings',
    admin: 'Admin panel tables - admin users, roles, permissions, audit',
    bondarys: 'AppKit app-specific tables - circles, social, notes, etc.',
    public: 'Public/system tables',
};

// =====================================
// MAIN COMPONENT
// =====================================

interface DatabaseStructureTreeProps {
    onNavigateToTable?: (tableName: string, schema: string) => void;
}

export const DatabaseStructureTree: React.FC<DatabaseStructureTreeProps> = ({ onNavigateToTable }) => {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['core', 'admin', 'bondarys']));
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
    const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/v1/admin/database/tables', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTables(data.tables);
            } else {
                setError(data.error || 'Failed to fetch');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    // Group tables by schema
    const groupedTables = useMemo(() => {
        const groups: Record<string, TableInfo[]> = {};
        const filtered = tables.filter(t =>
            t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.schema.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.columns.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        for (const table of filtered) {
            if (!groups[table.schema]) groups[table.schema] = [];
            groups[table.schema].push(table);
        }
        const order = ['core', 'admin', 'bondarys', 'public'];
        const sorted: [string, TableInfo[]][] = [];
        for (const s of order) {
            if (groups[s]) sorted.push([s, groups[s]]);
        }
        for (const [s, tbls] of Object.entries(groups)) {
            if (!order.includes(s)) sorted.push([s, tbls]);
        }
        return sorted;
    }, [tables, searchQuery]);

    const toggleSchema = (schema: string) => {
        setExpandedSchemas(prev => {
            const next = new Set(prev);
            if (next.has(schema)) next.delete(schema);
            else next.add(schema);
            return next;
        });
    };

    const toggleTable = (key: string) => {
        setExpandedTables(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedSchemas(new Set(groupedTables.map(([s]) => s)));
        const allTableKeys = tables.map(t => `${t.schema}.${t.tableName}`);
        setExpandedTables(new Set(allTableKeys));
    };

    const collapseAll = () => {
        setExpandedSchemas(new Set());
        setExpandedTables(new Set());
    };

    const totalTables = groupedTables.reduce((sum, [, tbls]) => sum + tbls.length, 0);
    const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-500 mb-3" />
                    <p className="text-sm text-gray-500">Loading database structure...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Database className="w-10 h-10 mx-auto text-red-300 mb-3" />
                    <p className="text-sm text-red-600 mb-2">{error}</p>
                    <button onClick={fetchTables} className="text-sm text-blue-500 hover:underline">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Left: Tree */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search schemas, tables, or columns..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={expandAll}
                        className="px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                    >
                        Collapse All
                    </button>
                    <button
                        onClick={fetchTables}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Summary Bar */}
                <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Layers size={12} />
                        {groupedTables.length} schemas
                    </span>
                    <span className="flex items-center gap-1.5">
                        <TableIcon size={12} />
                        {totalTables} tables
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Columns3 size={12} />
                        {totalColumns} columns
                    </span>
                    <div className="flex items-center gap-3 ml-auto">
                        {groupedTables.map(([schema, tbls]) => {
                            const colors = getSchemaColor(schema);
                            return (
                                <span key={schema} className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                    <span className={colors.text}>{schema}</span>
                                    <span className="text-gray-400">({tbls.length})</span>
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-auto px-2 py-2">
                    {groupedTables.map(([schema, schemaTables]) => {
                        const colors = getSchemaColor(schema);
                        const isSchemaExpanded = expandedSchemas.has(schema);
                        const schemaSize = schemaTables.reduce((sum, t) => sum + t.sizeBytes, 0);
                        const schemaRows = schemaTables.reduce((sum, t) => sum + t.rowCount, 0);

                        return (
                            <div key={schema} className="mb-1">
                                {/* Schema Node */}
                                <button
                                    onClick={() => toggleSchema(schema)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors group`}
                                >
                                    {isSchemaExpanded ? (
                                        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                    )}
                                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientTo} flex items-center justify-center flex-shrink-0`}>
                                        {isSchemaExpanded ? (
                                            <FolderOpen size={14} className="text-white" />
                                        ) : (
                                            <Folder size={14} className="text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={`${colors.text} font-bold`}>{schema}</div>
                                        <div className="text-[11px] text-gray-400 font-normal">
                                            {SCHEMA_DESCRIPTIONS[schema] || `${schemaTables.length} tables`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-normal">
                                        <span>{schemaTables.length} tables</span>
                                    </div>
                                </button>

                                {/* Tables under schema */}
                                {isSchemaExpanded && (
                                    <div className="ml-4 border-l-2 border-gray-100">
                                        {schemaTables.map((table) => {
                                            const tableKey = `${table.schema}.${table.tableName}`;
                                            const isTableExpanded = expandedTables.has(tableKey);
                                            const pkCount = table.columns.filter(c => c.isPrimaryKey).length;
                                            const fkCount = table.columns.filter(c => c.isForeignKey).length;

                                            return (
                                                <div key={tableKey} className="ml-2">
                                                    {/* Table Node */}
                                                    <div className="flex items-center group">
                                                        <button
                                                            onClick={() => toggleTable(tableKey)}
                                                            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors`}
                                                        >
                                                            {isTableExpanded ? (
                                                                <ChevronDown size={14} className="text-gray-300 flex-shrink-0" />
                                                            ) : (
                                                                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                                                            )}
                                                            <TableIcon size={15} className={colors.text + ' flex-shrink-0'} />
                                                            <span className="font-medium text-gray-800">{table.tableName}</span>
                                                            <span className="text-[11px] text-gray-400 ml-1">
                                                                ({table.columns.length} cols)
                                                            </span>
                                                            <div className="flex items-center gap-1.5 ml-auto text-[11px] text-gray-400">
                                                                {pkCount > 0 && (
                                                                    <span className="flex items-center gap-0.5 text-blue-500">
                                                                        <Key size={10} /> {pkCount}
                                                                    </span>
                                                                )}
                                                                {fkCount > 0 && (
                                                                    <span className="flex items-center gap-0.5 text-purple-500">
                                                                        <Link2 size={10} /> {fkCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                        {onNavigateToTable && (
                                                            <button
                                                                onClick={() => onNavigateToTable(table.tableName, table.schema)}
                                                                className="p-1.5 text-gray-300 hover:text-emerald-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Open in Table Explorer"
                                                            >
                                                                <Box size={14} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Columns under table */}
                                                    {isTableExpanded && (
                                                        <div className="ml-8 border-l border-gray-100 mb-1">
                                                            {table.columns.map((col) => {
                                                                const ColIcon = getColumnIcon(col.type);
                                                                const colKey = `${tableKey}.${col.name}`;
                                                                const isHovered = hoveredColumn === colKey;

                                                                return (
                                                                    <div
                                                                        key={col.name}
                                                                        className={`flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm rounded-r-lg transition-colors ${
                                                                            isHovered ? 'bg-gray-50' : ''
                                                                        }`}
                                                                        onMouseEnter={() => setHoveredColumn(colKey)}
                                                                        onMouseLeave={() => setHoveredColumn(null)}
                                                                    >
                                                                        <ColIcon size={13} className="text-gray-400 flex-shrink-0" />
                                                                        <span className={`font-mono text-xs ${col.isPrimaryKey ? 'font-bold text-blue-700' : col.isForeignKey ? 'text-purple-700' : 'text-gray-700'}`}>
                                                                            {col.name}
                                                                        </span>
                                                                        <span className="font-mono text-[11px] text-gray-400">{col.type}</span>
                                                                        <div className="flex items-center gap-1 ml-auto">
                                                                            {col.isPrimaryKey && (
                                                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">PK</span>
                                                                            )}
                                                                            {col.isForeignKey && (
                                                                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-medium" title={col.foreignKeyRef}>
                                                                                    FK
                                                                                </span>
                                                                            )}
                                                                            {col.nullable && (
                                                                                <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded text-[10px] font-medium">NULL</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Schema Overview Cards */}
            <div className="w-80 border-l border-gray-200 bg-gray-50/50 overflow-auto p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Database size={16} />
                    Schema Overview
                </h3>

                {groupedTables.map(([schema, schemaTables]) => {
                    const colors = getSchemaColor(schema);
                    const schemaRows = schemaTables.reduce((sum, t) => sum + t.rowCount, 0);
                    const schemaCols = schemaTables.reduce((sum, t) => sum + t.columns.length, 0);

                    return (
                        <div key={schema} className={`mb-3 rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientTo} flex items-center justify-center`}>
                                    <Database size={14} className="text-white" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${colors.text}`}>{schema}</h4>
                                    <p className="text-[11px] text-gray-500">{SCHEMA_DESCRIPTIONS[schema] || 'Custom schema'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white/70 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-gray-900">{schemaTables.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Tables</div>
                                </div>
                                <div className="bg-white/70 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-gray-900">{schemaCols}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Columns</div>
                                </div>
                                <div className="bg-white/70 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-gray-900">{schemaRows.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Rows</div>
                                </div>
                            </div>

                            {/* Top tables by row count */}
                            <div className="mt-3 space-y-1">
                                {[...schemaTables].sort((a, b) => b.rowCount - a.rowCount).slice(0, 5).map(t => (
                                    <div key={t.tableName} className="flex items-center gap-2 text-xs">
                                        <TableIcon size={11} className="text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-700 truncate flex-1">{t.tableName}</span>
                                        <span className="text-gray-400">{t.rowCount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {schemaTables.length > 5 && (
                                    <div className="text-[11px] text-gray-400 text-center pt-1">
                                        +{schemaTables.length - 5} more tables
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DatabaseStructureTree;
