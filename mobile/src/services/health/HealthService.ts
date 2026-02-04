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

export class HealthService {
  private static instance: HealthService;

  private constructor() {}

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Get user health metrics
   */
  async getMetrics(type?: string): Promise<HealthMetric[]> {
    const url = type ? `/user/health/${type}` : '/user/health';
    const response = await apiClient.get(url);
    const entities = response.data as any[] || [];
    return entities.map(unwrapEntity);
  }

  /**
   * Save a new health metric
   */
  async saveMetric(metric: Omit<HealthMetric, 'id' | 'timestamp'>): Promise<HealthMetric> {
    const response = await apiClient.post('/user/health', metric);
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
