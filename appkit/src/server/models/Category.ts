export interface Category {
  id: string;
  circleId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category;
  children?: Category[];
}

export interface CreateCategoryRequest {
  circleId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

