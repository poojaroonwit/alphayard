import { api } from './index';

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  isMoving?: boolean;
  createdAt: string;
}

export interface Geofence {
  id: string;
  circleId: string;
  name: string;
  description?: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationStats {
  totalLocations: number;
  totalDistance: number;
  averageSpeed: number;
  totalTime: number;
  lastLocation?: Location;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  isMoving?: boolean;
}

export interface CreateGeofenceRequest {
  name: string;
  description?: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  address?: string;
}

export const locationApi = {
  // Update user location
  updateLocation: async (data: UpdateLocationRequest): Promise<{ success: boolean; location: Location }> => {
    const response = await api.post('/location/update', data);
    return response.data;
  },

  // Get current location
  getCurrentLocation: async (): Promise<{ success: boolean; location?: Location }> => {
    const response = await api.get('/location/current');
    return response.data;
  },

  // Get location history
  getLocationHistory: async (params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }): Promise<{ success: boolean; locations: Location[]; pagination: any }> => {
    const response = await api.get('/location/history', { params });
    return response.data;
  },

  // Get Circle locations
  getCircleLocations: async (): Promise<{ success: boolean; locations: Location[] }> => {
    const response = await api.get('/location/Circle');
    return response.data;
  },

  // Get location statistics
  getLocationStats: async (): Promise<{ success: boolean; stats: LocationStats }> => {
    try {
      const response = await api.get('/location/stats');
      return response.data;
    } catch {
      return { success: false, stats: { totalLocations: 0, totalDistance: 0, averageSpeed: 0, totalTime: 0 } };
    }
  },

  // Create geofence
  createGeofence: async (data: CreateGeofenceRequest): Promise<{ success: boolean; geofence: Geofence }> => {
    const response = await api.post('/location/geofences', data);
    return response.data;
  },

  // Get user's geofences
  getGeofences: async (): Promise<{ success: boolean; geofences: Geofence[] }> => {
    const response = await api.get('/location/geofences');
    return response.data;
  },

  // Get geofence by ID
  getGeofence: async (geofenceId: string): Promise<{ success: boolean; geofence: Geofence }> => {
    const response = await api.get(`/location/geofences/${geofenceId}`);
    return response.data;
  },

  // Update geofence
  updateGeofence: async (geofenceId: string, data: Partial<CreateGeofenceRequest>): Promise<{ success: boolean; geofence: Geofence }> => {
    const response = await api.put(`/location/geofences/${geofenceId}`, data);
    return response.data;
  },

  // Delete geofence
  deleteGeofence: async (geofenceId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/location/geofences/${geofenceId}`);
    return response.data;
  },
};

