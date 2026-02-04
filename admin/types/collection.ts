import React from 'react';

export interface ColumnDefinition {
    id: string;
    label: string;
    accessor: string | ((item: any) => any);
    width?: string;
    render?: (value: any, item: any) => React.ReactNode;
    sortable?: boolean;
}

export interface SchemaField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'json';
    required?: boolean;
    options?: { label: string; value: any }[];
    defaultValue?: any;
    placeholder?: string;
}

export interface DynamicCollection {
    id: string;
    name: string;
    displayName: string;
    title?: string;
    description?: string;
    icon: string;
    isSystem: boolean;
    schema?: SchemaField[];
    category?: string;
    apiEndpoint?: string;
    responseKey?: string;
    searchable?: boolean;
    columns?: ColumnDefinition[];
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    searchPlaceholder?: string;
}
