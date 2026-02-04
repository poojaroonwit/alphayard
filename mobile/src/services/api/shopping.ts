import { api } from './index';
import { ShoppingItem } from '../../types/home';

export interface ShoppingListFilters {
  circleId?: string;
  assignedTo?: string;
  category?: string;
  completed?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateShoppingItemRequest {
  item: string;
  category: string;
  quantity: string;
  assignedTo: string;
  circleId: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  estimatedCost?: number;
}

export interface UpdateShoppingItemRequest {
  item?: string;
  category?: string;
  quantity?: string;
  assignedTo?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  estimatedCost?: number;
}

export interface ShoppingListStats {
  total: number;
  completed: number;
  pending: number;
  byCategory: Record<string, number>;
  byAssignee: Record<string, number>;
  totalEstimatedCost: number;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export const shoppingApi = {
  // Get shopping items
  getShoppingItems: async (filters?: ShoppingListFilters): Promise<{ success: boolean; data: { entities: any[] } }> => {
    const params = new URLSearchParams();
    if (filters?.circleId) params.append('circleId', filters.circleId);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response: any = await api.get(`/shopping/items?${params.toString()}`);
    return response;
  },

  // Get shopping item by ID
  getShoppingItemById: async (itemId: string): Promise<{ success: boolean; item: ShoppingItem }> => {
    const response = await api.get(`/shopping/items/${itemId}`);
    return response.data;
  },

  // Create shopping item
  createShoppingItem: async (itemData: CreateShoppingItemRequest): Promise<{ success: boolean; item: ShoppingItem }> => {
    const response = await api.post('/shopping/items', itemData);
    return response.data;
  },

  // Update shopping item
  updateShoppingItem: async (itemId: string, itemData: UpdateShoppingItemRequest): Promise<{ success: boolean; item: ShoppingItem }> => {
    const response = await api.put(`/shopping/items/${itemId}`, itemData);
    return response.data;
  },

  // Delete shopping item
  deleteShoppingItem: async (itemId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/shopping/items/${itemId}`);
    return response.data;
  },

  // Mark item as completed
  markItemCompleted: async (itemId: string, completed: boolean = true): Promise<{ success: boolean; item: ShoppingItem }> => {
    const response = await api.patch(`/shopping/items/${itemId}/complete`, { completed });
    return response.data;
  },

  // Mark multiple items as completed
  markMultipleItemsCompleted: async (itemIds: string[], completed: boolean = true): Promise<{ success: boolean; items: ShoppingItem[] }> => {
    const response = await api.patch('/shopping/items/bulk-complete', { 
      itemIds, 
      completed 
    });
    return response.data;
  },

  // Get shopping categories
  getShoppingCategories: async (): Promise<{ success: boolean; categories: ShoppingCategory[] }> => {
    const response = await api.get('/shopping/categories');
    return response.data;
  },

  // Create shopping category
  createShoppingCategory: async (categoryData: Omit<ShoppingCategory, 'id'>): Promise<{ success: boolean; category: ShoppingCategory }> => {
    const response = await api.post('/shopping/categories', categoryData);
    return response.data;
  },

  // Get shopping stats
  getShoppingStats: async (circleId?: string): Promise<{ success: boolean; data: ShoppingListStats }> => {
    const params = circleId ? `?circleId=${circleId}` : '';
    const response: any = await api.get(`/shopping/stats${params}`);
    return response;
  },

  // Get items by assignee
  getItemsByAssignee: async (circleId: string, assigneeId: string): Promise<{ success: boolean; items: ShoppingItem[] }> => {
    const response = await api.get(`/shopping/families/${circleId}/assignees/${assigneeId}/items`);
    return response.data;
  },

  // Get items by category
  getItemsByCategory: async (circleId: string, category: string): Promise<{ success: boolean; items: ShoppingItem[] }> => {
    const response = await api.get(`/shopping/families/${circleId}/categories/${category}/items`);
    return response.data;
  },

  // Clear completed items
  clearCompletedItems: async (circleId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/shopping/families/${circleId}/completed`);
    return response.data;
  },

  // Duplicate shopping list
  duplicateShoppingList: async (sourceCircleId: string, targetCircleId: string): Promise<{ success: boolean; items: ShoppingItem[] }> => {
    const response = await api.post(`/shopping/families/${sourceCircleId}/duplicate`, {
      targetCircleId
    });
    return response.data;
  },

  // Export shopping list
  exportShoppingList: async (circleId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<{ success: boolean; downloadUrl: string }> => {
    const response = await api.get(`/shopping/families/${circleId}/export?format=${format}`);
    return response.data;
  }
};

