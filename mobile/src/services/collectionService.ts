
import api from './api/apiClient';

export interface CollectionItem {
    id: string;
    [key: string]: any;
}

export interface CollectionResponse {
    success: boolean;
    items: CollectionItem[];
    total: number;
    page?: number;
    limit?: number;
}

/**
 * Standardized helper to unwrap Unified Hybrid Model entities
 */
export const unwrapEntity = (item: any): any => {
    if (!item) return null;
    const attributes = item.attributes || item.data || {};
    return {
        id: item.id,
        ownerId: item.ownerId || attributes.user_id || attributes.author_id,
        applicationId: item.applicationId || attributes.circle_id || attributes.circleId,
        createdAt: item.createdAt || item.created_at,
        updatedAt: item.updatedAt || item.updated_at,
        status: item.status || 'active',
        ...attributes
    };
};

const collectionService = {
    /**
     * Get items from a collection
     * @param collectionName The system name/ID of the collection
     * @param params Query parameters (page, limit, search, etc.)
     */
    getCollectionItems: async (collectionName: string, params: any = {}): Promise<CollectionResponse> => {
        try {
            const response = await api.get(`/mobile/collections/${collectionName}`, { params });
            return response as any; // Assuming api.get returns the full response object, and .data contains the body
        } catch (error) {
            console.error(`Error fetching collection ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Get a single item by ID
     */
    getCollectionItem: async (collectionName: string, id: string): Promise<CollectionItem> => {
        try {
            const response = await api.get(`/mobile/collections/${collectionName}/${id}`);
            return (response as any).item;
        } catch (error) {
            console.error(`Error fetching item ${id} from ${collectionName}:`, error);
            throw error;
        }
    },
    
    /**
     * Create a new item
     */
    createItem: async (collectionName: string, attributes: any): Promise<CollectionItem> => {
        try {
            const response = await api.post(`/mobile/collections/${collectionName}`, { attributes });
            return (response as any).item;
        } catch (error) {
            console.error(`Error creating item in ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Update an item
     */
    updateItem: async (collectionName: string, id: string, attributes: any): Promise<CollectionItem> => {
        try {
            const response = await api.put(`/mobile/collections/${collectionName}/${id}`, { attributes });
            return (response as any).item;
        } catch (error) {
            console.error(`Error updating item ${id} in ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Delete an item
     */
    deleteItem: async (collectionName: string, id: string): Promise<boolean> => {
        try {
            await api.delete(`/mobile/collections/${collectionName}/${id}`);
            return true;
        } catch (error) {
            console.error(`Error deleting item ${id} from ${collectionName}:`, error);
            throw error;
        }
    }
};

export default collectionService;
