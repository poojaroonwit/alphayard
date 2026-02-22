'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Table as TableIcon, 
    Database, 
    Key, 
    Link2, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    SortAsc, 
    SortDesc,
    RefreshCw,
    Eye,
    ExternalLink,
    Hash,
    Type,
    Calendar,
    ToggleLeft,
    FileJson,
    X,
    Code,
    ChevronDown,
    ChevronRight as ChevronRightIcon,
    Folder,
    FolderOpen,
    Columns3,
    Plus,
    Edit,
    Trash2
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { RowEditorModal } from './RowEditorModal';
import { CreateSchemaModal } from './CreateSchemaModal';
import { CreateTableModal } from './CreateTableModal';

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

interface TableExplorerProps {
    onTableSelect?: (tableName: string) => void;
    onOpenInEditor?: (sql: string) => void;
}

// =====================================
// SCHEMA COLORS
// =====================================

const SCHEMA_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; dot: string }> = {
    admin: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    bondarys: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    public: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const getSchemaColor = (schema: string) => SCHEMA_COLORS[schema] || SCHEMA_COLORS.public;

// =====================================
// HELPERS
// =====================================

const getColumnIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('int') || lowerType === 'numeric' || lowerType === 'decimal') return Hash;
    if (lowerType.includes('char') || lowerType === 'text') return Type;
    if (lowerType.includes('timestamp') || lowerType === 'date' || lowerType === 'time') return Calendar;
    if (lowerType === 'bool' || lowerType === 'boolean') return ToggleLeft;
    if (lowerType === 'json' || lowerType === 'jsonb') return FileJson;
    if (lowerType === 'uuid') return Key;
    return Database;
};

const formatValue = (value: any, type: string): React.ReactNode => {
    if (value === null) return <span className="text-gray-400 italic">NULL</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
        return (
            <span className="text-purple-600 cursor-pointer hover:underline" title={JSON.stringify(value, null, 2)}>
                {JSON.stringify(value).substring(0, 50)}...
            </span>
        );
    }
    if (type.includes('timestamp') || type === 'date') {
        const date = new Date(value);
        return date.toLocaleString();
    }
    return String(value);
};

// =====================================
// SCHEMA TREE SIDEBAR
// =====================================

const SchemaTreeSidebar: React.FC<{
    tables: TableInfo[];
    selectedTable: string | null;
    selectedSchema: string | null;
    onSelectTable: (name: string, schema: string) => void;
    loading: boolean;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    error?: string | null;
    onRetry?: () => void;
}> = ({ tables, selectedTable, selectedSchema, onSelectTable, loading, searchQuery, onSearchChange, error, onRetry }) => {
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['admin', 'bondarys', 'public']));

    // Group tables by schema
    const groupedTables = useMemo(() => {
        const groups: Record<string, TableInfo[]> = {};
        const filtered = tables.filter(t =>
            t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.schema.toLowerCase().includes(searchQuery.toLowerCase())
        );
        for (const table of filtered) {
            if (!groups[table.schema]) groups[table.schema] = [];
            groups[table.schema].push(table);
        }
        const order = ['admin', 'bondarys', 'public'];
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

    const totalFilteredTables = groupedTables.reduce((sum, [, tbls]) => sum + tbls.length, 0);

    return (
        <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50/50 sticky top-0 h-screen overflow-hidden shrink-0">
            {/* Search and Actions */}
            <div className="p-3 border-b border-gray-200 space-y-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => (window as any).openCreateSchema()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Plus size={14} className="text-gray-500" />
                        New Schema
                    </button>
                    <button
                        onClick={() => (window as any).openCreateTable()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={14} className="text-white/90" />
                        New Table
                    </button>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search tables..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Schema Tree */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 px-4">
                        <div className="text-red-500 text-sm mb-2">{error}</div>
                        {onRetry && (
                            <button onClick={onRetry} className="text-xs text-blue-500 hover:underline">
                                Retry
                            </button>
                        )}
                    </div>
                ) : groupedTables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">No tables found</div>
                ) : (
                    <div className="py-1">
                        {groupedTables.map(([schema, schemaTables]) => {
                            const colors = getSchemaColor(schema);
                            const isExpanded = expandedSchemas.has(schema);
                            return (
                                <div key={schema}>
                                    {/* Schema Header */}
                                    <button
                                        onClick={() => toggleSchema(schema)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10`}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronRightIcon size={14} className="text-gray-400 flex-shrink-0" />
                                        )}
                                        {isExpanded ? (
                                            <FolderOpen size={16} className={colors.text} />
                                        ) : (
                                            <Folder size={16} className={colors.text} />
                                        )}
                                        <span className={colors.text}>{schema === 'bondarys' ? 'AppKit' : schema}</span>
                                        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                                            {schemaTables.length}
                                        </span>
                                    </button>

                                    {/* Tables under this schema */}
                                    {isExpanded && (
                                        <div className="pb-1">
                                            {schemaTables.map((table) => {
                                                const isSelected = selectedTable === table.tableName && selectedSchema === table.schema;
                                                return (
                                                    <button
                                                        key={`${table.schema}.${table.tableName}`}
                                                        onClick={() => onSelectTable(table.tableName, table.schema)}
                                                        className={`w-full text-left pl-10 pr-3 py-2 flex items-center gap-2.5 transition-colors text-sm ${
                                                            isSelected
                                                                ? `${colors.bg} border-l-2 ${colors.border}`
                                                                : 'hover:bg-gray-100 border-l-2 border-transparent'
                                                        }`}
                                                    >
                                                        <TableIcon size={14} className={isSelected ? colors.text : 'text-gray-400'} />
                                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                                            <div className={`font-medium truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {table.tableName}
                                                            </div>
                                                            <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                                                                {(() => { const count = Math.max(0, table.rowCount); return count >= 1000000 ? `${(count / 1000000).toFixed(1)}M` : count >= 1000 ? `${(count / 1000).toFixed(0)}k` : count; })()} · {table.sizeFormatted}
                                                            </span>
                                                        </div>
                                                    </button>
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

            {/* Footer Stats */}
            <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{totalFilteredTables} tables</span>
                    <span>{groupedTables.length} schemas</span>
                </div>
            </div>
        </div>
    );
};

// =====================================
// SCHEMA VIEW COMPONENT
// =====================================

const SchemaView: React.FC<{
    table: TableInfo;
    onOpenInEditor: (sql: string) => void;
}> = ({ table, onOpenInEditor }) => {
    const colors = getSchemaColor(table.schema);
    const qualifiedName = `"${table.schema}"."${table.tableName}"`;

    return (
        <div className="p-4 bg-gray-50 h-full overflow-auto">
            {/* Table Stats */}
            <div className="grid grid-cols-4 gap-4 text-sm mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Total Rows</span>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{table.rowCount.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Table Size</span>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{table.sizeFormatted}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Columns</span>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{table.columns.length}</p>
                </div>
                <div className={`bg-white rounded-lg border ${colors.border} p-4`}>
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Schema</span>
                    <p className={`text-xl font-semibold mt-1 ${colors.text}`}>{table.schema}</p>
                </div>
            </div>

            {/* Column Schema */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Column Definitions</h4>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {table.columns.map((col) => {
                                const Icon = getColumnIcon(col.type);
                                return (
                                    <tr key={col.name} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Icon size={14} className="text-gray-400" />
                                                {col.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{col.type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${col.nullable ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {col.nullable ? 'YES' : 'NO'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[200px]" title={col.defaultValue || ''}>
                                            {col.defaultValue || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {col.isPrimaryKey && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        <Key size={10} /> PK
                                                    </span>
                                                )}
                                                {col.isForeignKey && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs" title={col.foreignKeyRef}>
                                                        <Link2 size={10} /> FK
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick SQL Queries */}
            <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick SQL Queries</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onOpenInEditor(`SELECT * FROM ${qualifiedName} LIMIT 100`)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Code size={16} className="text-emerald-500 flex-shrink-0" />
                        <span className="truncate font-mono text-xs">SELECT * FROM {qualifiedName} LIMIT 100</span>
                    </button>
                    <button
                        onClick={() => onOpenInEditor(`SELECT COUNT(*) FROM ${qualifiedName}`)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Code size={16} className="text-emerald-500 flex-shrink-0" />
                        <span className="truncate font-mono text-xs">SELECT COUNT(*) FROM {qualifiedName}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// =====================================
// DATA GRID COMPONENT
// =====================================

const DataGrid: React.FC<{
    tableName: string;
    schema: string;
    columns: ColumnInfo[];
}> = ({ tableName, schema, columns }) => {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [loading, setLoading] = useState(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    
    // CRUD state
    const [rowEditorOpen, setRowEditorOpen] = useState(false);
    const [rowEditorMode, setRowEditorMode] = useState<'insert' | 'edit'>('insert');
    const [editingRow, setEditingRow] = useState<Record<string, any> | undefined>(undefined);
    const [editingPkValue, setEditingPkValue] = useState<any>(undefined);
    const [deleteConfirm, setDeleteConfirm] = useState<{ row: any; pkValue: any } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const result = await adminService.getTableData(tableName, {
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(sortColumn && { orderBy: sortColumn, orderDir: sortDir }),
                ...(searchQuery && { search: searchQuery, searchColumns: columns.map(c => c.name).join(',') })
            }) as any;
            
            if (result.success) {
                setData(result.rows);
                setTotal(result.total);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [tableName, page, pageSize, sortColumn, sortDir, searchQuery, columns]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDir('asc');
        }
    };

    // Get primary key column
    const pkColumn = columns.find(c => c.isPrimaryKey);

    // CRUD handlers
    const openInsertModal = () => {
        setRowEditorMode('insert');
        setEditingRow(undefined);
        setEditingPkValue(undefined);
        setRowEditorOpen(true);
    };

    const openEditModal = (row: Record<string, any>) => {
        if (!pkColumn) return;
        setRowEditorMode('edit');
        setEditingRow(row);
        setEditingPkValue(row[pkColumn.name]);
        setRowEditorOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteConfirm || !pkColumn) return;
        setDeleting(true);
        try {
            const result = await adminService.deleteRow(schema, tableName, deleteConfirm.pkValue);
            if (result.success) {
                setDeleteConfirm(null);
                fetchData();
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search rows..."
                            className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={openInsertModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                        title="Add Row"
                    >
                        <Plus size={14} />
                        Add Row
                    </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{total.toLocaleString()} rows total</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="Previous page"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span>Page {page} of {totalPages || 1}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="Next page"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-visible relative">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200 w-12 bg-gray-50">#</th>
                            {columns.map((col) => (
                                <th
                                    key={col.name}
                                    onClick={() => handleSort(col.name)}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none bg-gray-50"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{col.name}</span>
                                        {col.isPrimaryKey && <Key size={10} className="text-blue-500" />}
                                        {col.isForeignKey && <Link2 size={10} className="text-purple-500" />}
                                        {sortColumn === col.name && (
                                            sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                                        )}
                                    </div>
                                    <div className="text-[10px] font-normal text-gray-400 normal-case">{col.type}</div>
                                </th>
                            ))}
                            <th className="px-3 py-2 w-12 border-b border-gray-200 bg-gray-50"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-gray-400 mb-2" />
                                    Loading...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                                    No data found
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-400 font-mono text-xs">
                                        {(page - 1) * pageSize + rowIndex + 1}
                                    </td>
                                    {columns.map((col) => (
                                        <td key={col.name} className="px-3 py-2 font-mono text-sm text-gray-900 max-w-[200px] truncate" title={String(row[col.name])}>
                                            {formatValue(row[col.name], col.type)}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setSelectedRow(row)}
                                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                title="View row details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            {pkColumn && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(row)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit row"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm({ row, pkValue: row[pkColumn.name] })}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete row"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Row Detail Modal */}
            {selectedRow && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRow(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Row Details</h3>
                            <button onClick={() => setSelectedRow(null)} className="p-1 hover:bg-gray-100 rounded" title="Close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-auto max-h-[60vh]">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100">
                                    {columns.map((col) => (
                                        <tr key={col.name}>
                                            <td className="py-2 pr-4 font-medium text-gray-500 w-48">{col.name}</td>
                                            <td className="py-2 font-mono text-gray-900">
                                                <pre className="whitespace-pre-wrap break-all">
                                                    {selectedRow[col.name] === null 
                                                        ? <span className="text-gray-400 italic">NULL</span>
                                                        : typeof selectedRow[col.name] === 'object'
                                                            ? JSON.stringify(selectedRow[col.name], null, 2)
                                                            : String(selectedRow[col.name])
                                                    }
                                                </pre>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Row Editor Modal */}
            <RowEditorModal
                isOpen={rowEditorOpen}
                onClose={() => setRowEditorOpen(false)}
                onSaved={() => {
                    setRowEditorOpen(false);
                    fetchData();
                }}
                schema={schema}
                tableName={tableName}
                columns={columns}
                mode={rowEditorMode}
                rowData={editingRow}
                pkValue={editingPkValue}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Trash2 size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Row?</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 mb-6">
                                <p className="text-sm text-gray-600">
                                    Primary key: <span className="font-mono font-medium">{String(deleteConfirm.pkValue)}</span>
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Row'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =====================================
// VIEW MODE SWITCH
// =====================================

const ViewModeSwitch: React.FC<{
    activeView: 'schema' | 'data';
    onViewChange: (view: 'schema' | 'data') => void;
}> = ({ activeView, onViewChange }) => (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
            onClick={() => onViewChange('schema')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeView === 'schema'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
            }`}
        >
            <Columns3 size={16} />
            Schema
        </button>
        <button
            onClick={() => onViewChange('data')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeView === 'data'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
            }`}
        >
            <TableIcon size={16} />
            Data
        </button>
    </div>
);

// =====================================
// MAIN COMPONENT
// =====================================

export const TableExplorer: React.FC<TableExplorerProps> = ({ onTableSelect, onOpenInEditor }) => {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'schema' | 'data'>('schema');
    
    // Create Modals State
    const [createSchemaOpen, setCreateSchemaOpen] = useState(false);
    const [createTableOpen, setCreateTableOpen] = useState(false);

    useEffect(() => {
        // Expose open handlers to window for sidebar
        (window as any).openCreateSchema = () => setCreateSchemaOpen(true);
        (window as any).openCreateTable = () => setCreateTableOpen(true);
        
        return () => {
            delete (window as any).openCreateSchema;
            delete (window as any).openCreateTable;
        };
    }, []);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getDatabaseTables() as any;
            if (data.success) {
                setTables(data.tables);
            } else {
                setError(data.error || data.message || 'Failed to fetch tables');
                console.error('API error:', data);
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
            setError('Network error: Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTable = (tableName: string, schema: string) => {
        setSelectedTable(tableName);
        setSelectedSchema(schema);
        onTableSelect?.(tableName);
    };

    const currentTable = tables.find(t => t.tableName === selectedTable && t.schema === selectedSchema);
    const colors = currentTable ? getSchemaColor(currentTable.schema) : null;

    return (
        <div className="flex bg-white items-start">
            {/* Schema Tree Sidebar */}
            <SchemaTreeSidebar
                tables={tables}
                selectedTable={selectedTable}
                selectedSchema={selectedSchema}
                onSelectTable={handleSelectTable}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                error={error}
                onRetry={fetchTables}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedTable && currentTable ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                            <div className="flex items-center gap-3">
                                <TableIcon size={20} className="text-emerald-600" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{currentTable.tableName}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors?.badge}`}>
                                            {currentTable.schema}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {currentTable.rowCount.toLocaleString()} rows &middot; {currentTable.columns.length} columns &middot; {currentTable.sizeFormatted}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ViewModeSwitch activeView={viewMode} onViewChange={setViewMode} />
                                <button
                                    onClick={() => onOpenInEditor?.(`SELECT * FROM "${currentTable.schema}"."${currentTable.tableName}" LIMIT 100`)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                                >
                                    <ExternalLink size={14} />
                                    Open in SQL Editor
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-visible">
                            {viewMode === 'schema' ? (
                                <SchemaView table={currentTable} onOpenInEditor={onOpenInEditor || (() => {})} />
                            ) : (
                                <DataGrid tableName={selectedTable} schema={currentTable.schema} columns={currentTable.columns} />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Database size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-lg font-medium">Select a table</p>
                            <p className="text-sm">Choose a table from the schema tree to explore</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modals */}
            <CreateSchemaModal 
                isOpen={createSchemaOpen}
                onClose={() => setCreateSchemaOpen(false)}
                onCreated={() => {
                    fetchTables();
                    setCreateSchemaOpen(false);
                }}
            />
            
            <CreateTableModal
                isOpen={createTableOpen}
                onClose={() => setCreateTableOpen(false)}
                onCreated={() => {
                    fetchTables();
                    setCreateTableOpen(false);
                }}
                schemas={Array.from(new Set(tables.map(t => t.schema))).map(name => ({ name }))}
            />
        </div>
    );
};

export default TableExplorer;
