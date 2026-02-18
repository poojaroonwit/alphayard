import React from 'react';

export interface ColumnDefinition {
    id: string;
    label: string;
    accessor: string | ((item: any) => any);
    width?: string;
    render?: (value: any, item: any) => React.ReactNode;
    sortable?: boolean;
}

export type SchemaFieldType = 
    | 'text'           // Short text input
    | 'textarea'       // Long text / multi-line
    | 'number'         // Numeric input
    | 'boolean'        // Checkbox / toggle
    | 'date'           // Date picker
    | 'datetime'       // Date and time picker
    | 'time'           // Time only picker
    | 'select'         // Single select dropdown
    | 'multiselect'    // Multi-select (checkboxes or tags)
    | 'json'           // JSON editor
    | 'image'          // Image upload with preview
    | 'file'           // File upload
    | 'reference'      // Reference to another entity
    | 'email'          // Email input with validation
    | 'url'            // URL input with validation
    | 'phone'          // Phone number input
    | 'color'          // Color picker
    | 'password'       // Password input
    | 'rich-text'      // Rich text editor (HTML)
    | 'markdown'       // Markdown editor
    | 'rating'         // Star rating
    | 'slider'         // Range slider
    | 'tags';          // Tags input

export interface SchemaField {
    key: string;
    label: string;
    type: SchemaFieldType;
    required?: boolean;
    options?: { label: string; value: any }[];
    defaultValue?: any;
    placeholder?: string;
    // Additional field configuration
    min?: number;                    // For number, slider, rating
    max?: number;                    // For number, slider, rating
    step?: number;                   // For number, slider
    rows?: number;                   // For textarea
    accept?: string;                 // For file/image upload (e.g., "image/*")
    maxSize?: number;                // Max file size in bytes
    referenceType?: string;          // For reference fields - entity type to reference
    referenceDisplayField?: string;  // Field to display from referenced entity
    validation?: {                   // Custom validation
        pattern?: string;            // Regex pattern
        message?: string;            // Custom error message
    };
    hidden?: boolean;                // Hide from form (for readonly/system fields)
    readonly?: boolean;              // Show but don't allow editing
    helpText?: string;               // Help text below the field
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
