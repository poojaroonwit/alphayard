import { apiClient as api } from '../api/apiClient';
import { WidgetType } from '../../types/home';

export interface WidgetFilters {
  category?: string;
  enabled?: boolean;
  circleId?: string;
  userId?: string;
}

export interface WidgetConfiguration {
  widgetId: string;
  userId: string;
  circleId?: string;
  enabled: boolean;
  position: number;
  settings: Record<string, any>;
}

export interface WidgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  order: number;
}

class WidgetService {
  private baseUrl = '/widgets';

  async getWidgetTypes(filters?: WidgetFilters): Promise<WidgetType[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.enabled !== undefined) params.append('enabled', filters.enabled.toString());
      if (filters?.circleId) params.append('circleId', filters.circleId);
      if (filters?.userId) params.append('userId', filters.userId);

      const response = await api.get(`${this.baseUrl}/types?${params.toString()}`);
      return response.data.widgets || [];
    } catch (error) {
      console.error('Error fetching widget types:', error);
      // Return default widget types if API fails
      return this.getDefaultWidgetTypes();
    }
  }

  async getWidgetCategories(): Promise<WidgetCategory[]> {
    try {
      const response = await api.get(`${this.baseUrl}/categories`);
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching widget categories:', error);
      return this.getDefaultWidgetCategories();
    }
  }

  async getUserWidgetConfiguration(userId: string, circleId?: string): Promise<WidgetConfiguration[]> {
    try {
      const params = circleId ? `?circleId=${circleId}` : '';
      const response = await api.get(`${this.baseUrl}/users/${userId}/configuration${params}`);
      return response.data.configurations || [];
    } catch (error) {
      console.error('Error fetching user widget configuration:', error);
      return [];
    }
  }

  async updateWidgetConfiguration(configuration: WidgetConfiguration): Promise<WidgetConfiguration> {
    try {
      const response = await api.put(`${this.baseUrl}/configuration`, configuration);
      return response.data;
    } catch (error) {
      console.error('Error updating widget configuration:', error);
      throw error;
    }
  }

  async enableWidget(widgetId: string, userId: string, circleId?: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/enable`, {
        widgetId,
        userId,
        circleId
      });
    } catch (error) {
      console.error('Error enabling widget:', error);
      throw error;
    }
  }

  async disableWidget(widgetId: string, userId: string, circleId?: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/disable`, {
        widgetId,
        userId,
        circleId
      });
    } catch (error) {
      console.error('Error disabling widget:', error);
      throw error;
    }
  }

  async reorderWidgets(userId: string, widgetIds: string[], circleId?: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/reorder`, {
        userId,
        widgetIds,
        circleId
      });
    } catch (error) {
      console.error('Error reordering widgets:', error);
      throw error;
    }
  }

  async getWidgetData(widgetId: string, userId: string, circleId?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      if (circleId) params.append('circleId', circleId);

      const response = await api.get(`${this.baseUrl}/${widgetId}/data?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching widget data:', error);
      return null;
    }
  }

  async updateWidgetSettings(widgetId: string, userId: string, settings: Record<string, any>, circleId?: string): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/${widgetId}/settings`, {
        userId,
        settings,
        circleId
      });
    } catch (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }
  }

  private getDefaultWidgetTypes(): WidgetType[] {
    return [
      // Circle Category
      { id: 'Circle-members', name: 'Circle Members', icon: 'account-group', enabled: true, category: 'Circle' },
      { id: 'Circle-status', name: 'Circle Status', icon: 'heart-pulse', enabled: true, category: 'Circle' },
      { id: 'location-map', name: 'Location Map', icon: 'map', enabled: true, category: 'Circle' },
      
      // Productivity Category
      { id: 'appointments', name: 'Appointments', icon: 'calendar', enabled: true, category: 'productivity' },
      { id: 'shopping-list', name: 'Shopping List', icon: 'shopping', enabled: true, category: 'productivity' },
      { id: 'recently-used', name: 'Recently Used', icon: 'clock', enabled: true, category: 'productivity' },
      
      // Social Category
      { id: 'social-posts', name: 'Social Posts', icon: 'account-multiple', enabled: true, category: 'social' },
      { id: 'Circle-chat', name: 'Circle Chat', icon: 'chat', enabled: false, category: 'social' },
      
      // Health Category
      { id: 'health-metrics', name: 'Health Metrics', icon: 'heart-pulse', enabled: false, category: 'health' },
      { id: 'emergency-alert', name: 'Emergency Alert', icon: 'alert-circle', enabled: true, category: 'health' },
      
      // Finance Category
      { id: 'asset-cards', name: 'Asset Cards', icon: 'wallet', enabled: true, category: 'finance' },
      { id: 'attention-apps', name: 'Attention Apps', icon: 'bell', enabled: true, category: 'finance' }
    ];
  }

  private getDefaultWidgetCategories(): WidgetCategory[] {
    return [
      { id: 'Circle', name: 'Circle', icon: 'home', color: '#4F46E5', description: 'Circle-related widgets', order: 1 },
      { id: 'productivity', name: 'Productivity', icon: 'briefcase', color: '#10B981', description: 'Productivity and organization widgets', order: 2 },
      { id: 'social', name: 'Social', icon: 'account-multiple', color: '#F59E0B', description: 'Social and communication widgets', order: 3 },
      { id: 'health', name: 'Health', icon: 'heart', color: '#EF4444', description: 'Health and wellness widgets', order: 4 },
      { id: 'finance', name: 'Finance', icon: 'wallet', color: '#8B5CF6', description: 'Financial and money management widgets', order: 5 }
    ];
  }
}

export const widgetService = new WidgetService();

