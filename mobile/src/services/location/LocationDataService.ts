import apiClient from '../api/apiClient';
import { unwrapEntity } from '../collectionService';

export interface LocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  placeLabel?: string;
  timestamp: string;
  type?: 'home' | 'work' | 'school' | 'other';
  isOnline?: boolean;
}

export interface LocationFilters {
  circleId?: string;
  userId?: string;
  type?: LocationData['type'];
  isOnline?: boolean;
  limit?: number;
  offset?: number;
}

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  address?: string;
  type?: LocationData['type'];
  accuracy?: number;
  timestamp: string;
  batteryLevel?: number;
  isOnline?: boolean;
}

export interface LocationHistory {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  accuracy?: number;
}

export interface LocationStats {
  totalLocations: number;
  onlineUsers: number;
  offlineUsers: number;
  byType: Record<string, number>;
  lastUpdated: string;
}

class LocationDataService {
  private baseUrl = '/location'; // Corrected to singular to match v1Router

  async getLocations(filters?: LocationFilters): Promise<LocationData[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.circleId) params.append('circleId', filters.circleId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isOnline !== undefined) params.append('isOnline', filters.isOnline.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
      return (response.data.locations || []).map(unwrapEntity);
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }

  async getLocationById(locationId: string): Promise<LocationData | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${locationId}`);
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  }

  async updateLocation(locationUpdate: LocationUpdate): Promise<LocationData> {
    try {
      const response = await apiClient.post(`${this.baseUrl}`, locationUpdate); // Changed from /update to follow REST
      return unwrapEntity(response.data.location);
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async getCircleLocations(circleId: string): Promise<LocationData[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}`, { params: { circleId } });
      return (response.data.locations || []).map(unwrapEntity);
    } catch (error) {
      console.error('Error fetching circle locations:', error);
      return [];
    }
  }

  async getUserLocationHistory(userId: string, days: number = 7): Promise<LocationHistory[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${userId}/history?days=${days}`);
      return response.data.history || [];
    } catch (error) {
      console.error('Error fetching user location history:', error);
      return [];
    }
  }

  async getLocationStats(circleId?: string): Promise<LocationStats> {
    try {
      const params = circleId ? `?circleId=${circleId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/stats${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching location stats:', error);
      return {
        totalLocations: 0,
        onlineUsers: 0,
        offlineUsers: 0,
        byType: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getNearbyLocations(latitude: number, longitude: number, radius: number = 1000): Promise<LocationData[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/nearby`, {
        params: {
          latitude,
          longitude,
          radius
        }
      });
      return response.data.locations || [];
    } catch (error) {
      console.error('Error fetching nearby locations:', error);
      return [];
    }
  }

  async setLocationType(userId: string, type: LocationData['type']): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/users/${userId}/type`, { type });
    } catch (error) {
      console.error('Error setting location type:', error);
      throw error;
    }
  }

  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/users/${userId}/status`, { isOnline });
    } catch (error) {
      console.error('Error setting online status:', error);
      throw error;
    }
  }

  async getLocationTypes(): Promise<string[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/types`);
      return response.data.types || [];
    } catch (error) {
      console.error('Error fetching location types:', error);
      return ['home', 'work', 'school', 'other'];
    }
  }

  async subscribeToLocationUpdates(circleId: string, callback: (data: any) => void): Promise<() => void> {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll implement a polling mechanism
    const interval = setInterval(async () => {
      try {
        const locations = await this.getCircleLocations(circleId);
        callback({ type: 'locations_update', data: locations });
      } catch (error) {
        console.error('Error in location updates subscription:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  async getGeofenceAlerts(circleId: string): Promise<Array<{
    id: string;
    userId: string;
    userName: string;
    geofenceName: string;
    action: 'enter' | 'exit';
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/families/${circleId}/geofence-alerts`);
      return response.data.alerts || [];
    } catch (error) {
      console.error('Error fetching geofence alerts:', error);
      return [];
    }
  }

  async createGeofence(geofenceData: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    circleId: string;
    notifications: {
      enter: boolean;
      exit: boolean;
    };
  }): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/geofences`, geofenceData);
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  async getGeofences(circleId: string): Promise<Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    notifications: {
      enter: boolean;
      exit: boolean;
    };
    isActive: boolean;
    createdAt: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/families/${circleId}/geofences`);
      return response.data.geofences || [];
    } catch (error) {
      console.error('Error fetching geofences:', error);
      return [];
    }
  }

  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/geofences/${geofenceId}`);
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }
}

export const locationDataService = new LocationDataService();
export default locationDataService;
