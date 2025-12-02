import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { locationService, LocationData } from '../services/location/locationService';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  accuracy?: number;
}

interface FamilyLocation {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  isOnline: boolean;
}

interface LocationContextType {
  currentLocation: Location | null;
  familyLocations: FamilyLocation[];
  isLoading: boolean;
  error: string | null;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  refreshFamilyLocations: () => Promise<void>;
  shareLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to start location tracking
        await locationService.startLocationTracking({ highAccuracy: true, interval: 30000 });
        
        // Get current location if available
        const loc = locationService.getCurrentLocation();
        if (isMounted && loc) {
          setCurrentLocation({
            id: 'current',
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.address || '',
            timestamp: new Date(loc.timestamp).toISOString(),
            accuracy: loc.accuracy,
          });
        }
        
        // Fetch family locations if authenticated (this doesn't require location permission)
        if (isMounted && isAuthenticated) {
          await refreshFamilyLocations();
        }
      } catch (e) {
        // Handle permission errors gracefully
        const errorMessage = e instanceof Error ? e.message : 'Failed to initialize location';
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          // Permission denied - set error but don't block app functionality
          if (isMounted) {
            setError('Location permission is required for location tracking. You can still use other features.');
          }
          logger.warn('Location permission denied:', errorMessage);
        } else {
          // Other errors
          if (isMounted) setError(errorMessage);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
      locationService.stopLocationTracking();
    };
  }, [isAuthenticated]);

  // Refresh family locations when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshFamilyLocations();
    } else {
      setFamilyLocations([]);
    }
  }, [isAuthenticated]);

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated: LocationData = {
        latitude,
        longitude,
        accuracy: currentLocation?.accuracy || 10,
        timestamp: new Date(),
      };
      // Send update via service (will emit through sockets and enrich)
      (locationService as any).sendLocationUpdate?.(updated);
      setCurrentLocation({
        id: 'current',
        latitude: updated.latitude,
        longitude: updated.longitude,
        address: updated.address || currentLocation?.address || '',
        timestamp: updated.timestamp.toISOString(),
        accuracy: updated.accuracy,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFamilyLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!isAuthenticated) {
        setFamilyLocations([]);
        return;
      }

      const response = await api.get('/location');
      const { locations } = response.data;

      // Transform API response to FamilyLocation format
      const transformedLocations: FamilyLocation[] = locations.map((loc: any) => ({
        id: loc.userId || loc.id,
        userId: loc.userId,
        userName: loc.user ? `${loc.user.firstName || ''} ${loc.user.lastName || ''}`.trim() : 'Unknown',
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address || '',
        timestamp: loc.timestamp || loc.created_at,
        isOnline: true, // Could be enhanced with presence data
      }));

      setFamilyLocations(transformedLocations);
    } catch (err) {
      console.error('Failed to refresh family locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh hourse locations');
      // Keep previous locations on error
    } finally {
      setIsLoading(false);
    }
  };

  const shareLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loc = locationService.getCurrentLocation();
      if (loc) {
        (locationService as any).sendLocationUpdate?.(loc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share location');
    } finally {
      setIsLoading(false);
    }
  };

  const value: LocationContextType = {
    currentLocation,
    familyLocations,
    isLoading,
    error,
    updateLocation,
    refreshFamilyLocations,
    shareLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}; 