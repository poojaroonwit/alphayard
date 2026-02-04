import { shoppingApi, ShoppingListFilters, CreateShoppingItemRequest, UpdateShoppingItemRequest } from '../api/shopping';
import { ShoppingItem } from '../../types/home';
import { unwrapEntity } from '../collectionService';

class ShoppingService {
  async getItems(filters?: ShoppingListFilters): Promise<ShoppingItem[]> {
    try {
      const response = await shoppingApi.getShoppingItems(filters);
      const entities = response.data?.entities || [];
      return entities.map((item: any) => {
        const unwrapped = unwrapEntity(item);
        return {
          id: unwrapped.id,
          circleId: unwrapped.applicationId,
          item: unwrapped.item,
          category: unwrapped.category,
          quantity: unwrapped.quantity,
          assignedTo: unwrapped.assignedTo,
          completed: !!(unwrapped.completed || unwrapped.isCompleted),
          priority: unwrapped.priority,
          notes: unwrapped.notes,
          estimatedCost: unwrapped.estimatedCost,
          createdAt: unwrapped.createdAt
        };
      });
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      return [];
    }
  }

  async getItemById(itemId: string): Promise<ShoppingItem | null> {
    try {
      const response = await shoppingApi.getShoppingItemById(itemId);
      return response.item || null;
    } catch (error) {
      console.error('Error fetching shopping item:', error);
      return null;
    }
  }

  async createItem(itemData: CreateShoppingItemRequest): Promise<ShoppingItem> {
    try {
      const response = await shoppingApi.createShoppingItem(itemData);
      return response.item;
    } catch (error) {
      console.error('Error creating shopping item:', error);
      throw error;
    }
  }

  async updateItem(itemId: string, itemData: UpdateShoppingItemRequest): Promise<ShoppingItem> {
    try {
      const response = await shoppingApi.updateShoppingItem(itemId, itemData);
      return response.item;
    } catch (error) {
      console.error('Error updating shopping item:', error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      await shoppingApi.deleteShoppingItem(itemId);
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      throw error;
    }
  }

  async toggleItemCompletion(itemId: string, completed: boolean): Promise<ShoppingItem> {
    try {
      const response = await shoppingApi.markItemCompleted(itemId, completed);
      return response.item;
    } catch (error) {
      console.error('Error toggling shopping item completion:', error);
      throw error;
    }
  }

  async clearCompleted(circleId: string): Promise<void> {
    try {
      await shoppingApi.clearCompletedItems(circleId);
    } catch (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  }
}

export const shoppingService = new ShoppingService();
export default shoppingService;
