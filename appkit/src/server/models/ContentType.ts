export interface ContentType {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentTypeRequest {
  name: string;
  description?: string;
  schema: Record<string, any>;
}

export interface UpdateContentTypeRequest {
  name?: string;
  description?: string;
  schema?: Record<string, any>;
  isActive?: boolean;
}
