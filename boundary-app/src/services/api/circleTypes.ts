import { apiClient } from './apiClient';

export interface CircleType {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  sort_order: number;
}

export const circleTypeApi = {
  getAll: async (): Promise<{ success: boolean; data: CircleType[] }> => {
    const res = await apiClient.get<any>('/circle-types');
    return { success: true, data: Array.isArray(res) ? res : (res.data || []) };
  },

  getById: async (id: string): Promise<{ success: boolean; data: CircleType | null }> => {
    const res = await apiClient.get<any>('/circle-types');
    const list: CircleType[] = Array.isArray(res) ? res : (res.data || []);
    return { success: true, data: list.find((t) => t.id === id) || null };
  },
};

export default circleTypeApi;
