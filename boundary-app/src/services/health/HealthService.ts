import { apiClient } from '../api/apiClient';
import { unwrapEntity } from '../collectionService';

export interface HealthMetric {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: any;
}

export interface HealthRecord {
  id: string;
  subCategoryId: string;
  userId: string;
  name: string;
  recordDate: string;
  description?: string;
  createdAt: string;
}

export interface HealthSubCategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  records: HealthRecord[];
}

export interface HealthCategory {
  id: string;
  userId: string;
  name: string;
  section: 'assets' | 'liabilities' | 'flow' | 'kpis';
  type: 'asset' | 'liability' | 'input' | 'output' | 'kpi';
  color: string;
  icon: string;
  sortOrder: number;
  subCategories: HealthSubCategory[];
}

export interface HealthSummary {
  totalAssets: number;
  totalLiabilities: number;
  healthScore: number;
  totalInput: number;
  totalOutput: number;
  netFlow: number;
}

export class HealthService {
  private static instance: HealthService;

  private constructor() {}

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  // ── Health Overview Methods ───────────────────────────────────────────────

  async getCategories(section?: string): Promise<HealthCategory[]> {
    try {
      const response = await apiClient.get('/health-overview/categories', {
        params: section ? { section } : undefined,
      });
      return response.data || [];
    } catch (error) {
      console.error('[HealthService] Failed to get categories:', error);
      return [];
    }
  }

  async createCategory(data: {
    name: string;
    section: string;
    type: string;
    color: string;
    icon: string;
  }): Promise<HealthCategory> {
    const response = await apiClient.post('/health-overview/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: {
    name?: string;
    color?: string;
    icon?: string;
    isArchived?: boolean;
  }): Promise<HealthCategory> {
    const response = await apiClient.put(`/health-overview/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/health-overview/categories/${id}`);
  }

  async createSubCategory(categoryId: string, name: string): Promise<HealthSubCategory> {
    const response = await apiClient.post(`/health-overview/categories/${categoryId}/subcategories`, { name });
    return response.data;
  }

  async updateSubCategory(id: string, name: string): Promise<HealthSubCategory> {
    const response = await apiClient.put(`/health-overview/subcategories/${id}`, { name });
    return response.data;
  }

  async deleteSubCategory(id: string): Promise<void> {
    await apiClient.delete(`/health-overview/subcategories/${id}`);
  }

  async getRecords(subCatId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get(`/health-overview/subcategories/${subCatId}/records`);
      return response.data || [];
    } catch {
      return [];
    }
  }

  async createRecord(subCatId: string, data: {
    name: string;
    date: string;
    description?: string;
  }): Promise<HealthRecord> {
    const response = await apiClient.post(`/health-overview/subcategories/${subCatId}/records`, data);
    return response.data;
  }

  async updateRecord(id: string, data: {
    name?: string;
    date?: string;
    description?: string;
    subCategoryId?: string;
  }): Promise<HealthRecord> {
    const response = await apiClient.put(`/health-overview/records/${id}`, data);
    return response.data;
  }

  async deleteRecord(id: string): Promise<void> {
    await apiClient.delete(`/health-overview/records/${id}`);
  }

  async getSummary(): Promise<HealthSummary> {
    try {
      const response = await apiClient.get('/health-overview/summary');
      return response.data;
    } catch {
      return { totalAssets: 0, totalLiabilities: 0, healthScore: 0, totalInput: 0, totalOutput: 0, netFlow: 0 };
    }
  }

  // ── Legacy Metrics Methods ────────────────────────────────────────────────

  /**
   * Get user health metrics
   */
  async getMetrics(type?: string): Promise<HealthMetric[]> {
    const url = type ? `/health/metrics?metricType=${type}` : '/health/metrics';
    const response = await apiClient.get(url);
    const entities = response.data || [];
    return entities.map(unwrapEntity);
  }

  /**
   * Save a new health metric
   */
  async saveMetric(metric: Omit<HealthMetric, 'id' | 'timestamp'>): Promise<HealthMetric> {
    const response = await apiClient.post('/health/metrics', metric);
    return unwrapEntity(response.data);
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  }
}

export const healthService = HealthService.getInstance();
export default healthService;
