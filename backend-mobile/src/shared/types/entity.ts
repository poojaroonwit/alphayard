export interface EntityAttribute {
  name: string;
  value: any;
  type?: 'text' | 'number' | 'boolean' | 'json' | 'date' | 'datetime' | 'reference';
}

export interface Entity {
  id: string;
  type: string;
  typeId: string;
  applicationId?: string;
  ownerId?: string;
  status: string;
  metadata?: Record<string, any>;
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntityInput {
  typeName: string;
  applicationId?: string;
  ownerId?: string;
  attributes: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateEntityInput {
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: string;
}

export interface EntityQueryOptions {
  applicationId?: string;
  ownerId?: string;
  status?: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

// Field definition for dynamic schema
export interface FieldDefinition {
  name: string;           // Field identifier (snake_case)
  label: string;          // Display label
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'reference' | 'image' | 'json';
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { value: string; label: string }[];  // For select/multiselect
  referenceType?: string;  // For reference fields
  validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
  };
}

// Entity type schema
export interface EntityTypeSchema {
  fields: FieldDefinition[];
}

// Entity type (collection definition)
export interface EntityType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  applicationId?: string;
  schema: EntityTypeSchema;
  icon?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create entity type input
export interface CreateEntityTypeInput {
  name: string;
  displayName: string;
  description?: string;
  applicationId?: string;
  schema?: EntityTypeSchema;
  icon?: string;
}

// Update entity type input
export interface UpdateEntityTypeInput {
  displayName?: string;
  description?: string;
  schema?: EntityTypeSchema;
  icon?: string;
}
