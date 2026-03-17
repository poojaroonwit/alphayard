import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Modal, ScrollView } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Location {
  id: string;
  userName: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  isOnline: boolean;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  batteryLevel?: number;
  accuracy?: number;
  speed?: number;
}

interface FreeMapViewProps {
  locations: Location[];
  height?: number;
}

export const FreeMapView: React.FC<FreeMapViewProps> = ({
  locations,
  height = 200
}) => {
  const [mapZoom, setMapZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapBounds, setMapBounds] = useState({
    minLat: 37.7,
    maxLat: 37.8,
    minLng: -122.5,
    maxLng: -122.3
  });
  const [showMapDrawer, setShowMapDrawer] = useState(false);

  // Deduplicate locations to prevent key warnings
  const uniqueLocations = React.useMemo(() => {
    const seen = new Set();
    return locations.filter(loc => {
      if (seen.has(loc.id)) return false;
      seen.add(loc.id);
      return true;
    });
  }, [locations]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'away': return '#F59E0B';
      case 'busy': return '#EF4444';
      case 'offline': return '#6B7280';
      default: return '#10B981';
    }
  };

  const getAvatarInitials = (userName: string) => {
    return userName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Calculate distance between two points in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Format local time
  const formatLocalTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get location label based on coordinates
  const getLocationLabel = (lat: number, lng: number, _userName: string): string => {
    // Define some common location areas (you can expand this)
    const locations = [
      { name: 'Home', lat: 37.7749, lng: -122.4194, radius: 0.005 },
      { name: 'Office', lat: 37.7849, lng: -122.4094, radius: 0.005 },
      { name: 'School', lat: 37.7649, lng: -122.4294, radius: 0.005 },
      { name: 'Park', lat: 37.7549, lng: -122.4394, radius: 0.005 },
      { name: 'Shopping Center', lat: 37.7449, lng: -122.4494, radius: 0.005 },
      { name: 'Restaurant', lat: 37.7699, lng: -122.4144, radius: 0.005 },
      { name: 'Gym', lat: 37.7799, lng: -122.4244, radius: 0.005 },
      { name: 'Library', lat: 37.7599, lng: -122.4344, radius: 0.005 },
    ];

    // Check if coordinates are near any known location
    for (const location of locations) {
      const distance = Math.sqrt(
        Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
      );
      if (distance <= location.radius) {
        return location.name;
      }
    }

    // If no known location, return a more descriptive label based on coordinates
    if (lat > 37.78) return 'North District';
    if (lat < 37.75) return 'South District';
    if (lng > -122.40) return 'East District';
    if (lng < -122.44) return 'West District';
    if (lat > 37.77 && lng > -122.42) return 'Downtown Core';
    if (lat < 37.77 && lng < -122.42) return 'Residential Area';

    return 'City Center';
  };

  // Calculate map center, bounds, and zoom dynamically based on all Circle member locations
  useEffect(() => {
    if (locations.length > 0) {

      // Calculate bounds to include all Circle members
      const lats = locations.map(loc => loc.latitude);
      const lngs = locations.map(loc => loc.longitude);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Add padding around the bounds
      const latRange = maxLat - minLat;
      const lngRange = maxLng - minLng;

      // Ensure minimum padding for single points or very close points
      const minPadding = 0.001; // ~100m minimum padding
      const latPadding = Math.max(latRange * 0.2, minPadding);
      const lngPadding = Math.max(lngRange * 0.2, minPadding);

      const newBounds = {
        minLat: minLat - latPadding,
        maxLat: maxLat + latPadding,
        minLng: minLng - lngPadding,
        maxLng: maxLng + lngPadding
      };

      setMapBounds(newBounds);

      // Calculate center point
      const centerLat = (newBounds.minLat + newBounds.maxLat) / 2;
      const centerLng = (newBounds.minLng + newBounds.maxLng) / 2;
      setMapCenter({ lat: centerLat, lng: centerLng });

      // Calculate appropriate zoom level based on the area covered
      const finalLatRange = newBounds.maxLat - newBounds.minLat;
      const finalLngRange = newBounds.maxLng - newBounds.minLng;
      const maxRange = Math.max(finalLatRange, finalLngRange);

      // Adjust zoom based on the range (smaller range = higher zoom)
      let newZoom = 13;
      if (maxRange < 0.001) newZoom = 16; // Very close together
      else if (maxRange < 0.005) newZoom = 15; // Close together
      else if (maxRange < 0.01) newZoom = 14; // Medium distance
      else if (maxRange < 0.05) newZoom = 13; // Far apart
      else if (maxRange < 0.1) newZoom = 12; // Very far apart
      else newZoom = 11; // Extremely far apart

      setMapZoom(newZoom);

    }
  }, [locations]);

  // Convert lat/lng to pixel coordinates on the map using dynamic bounds
  const latLngToPixel = (lat: number, lng: number) => {
    // Use the actual map container dimensions
    // The map container takes up the full width and the specified height
    const mapWidth = width; // Full width
    const mapHeight = height; // Use the height prop passed to the component

    // Calculate position within the bounds
    const latRange = mapBounds.maxLat - mapBounds.minLat;
    const lngRange = mapBounds.maxLng - mapBounds.minLng;

    // Convert to pixel coordinates within the map bounds
    const x = ((lng - mapBounds.minLng) / lngRange) * mapWidth;
    const y = ((mapBounds.maxLat - lat) / latRange) * mapHeight;

    // Debug logging removed

    return {
      x: Math.max(0, Math.min(mapWidth, x)),
      y: Math.max(0, Math.min(mapHeight, y))
    };
  };

  // Generate 3D Street Map tile URLs
  const getMapTileUrls = () => {
    // Calculate tile coordinates
    const n = Math.pow(2, mapZoom);
    const x = Math.floor(((mapCenter.lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(mapCenter.lat * Math.PI / 180) + 1 / Math.cos(mapCenter.lat * Math.PI / 180)) / Math.PI) / 2) * n);

    // Reliable tile sources for clean map
    const tileSources = [
      // Primary: OpenStreetMap - most reliable
      `https://tile.openstreetmap.org/${mapZoom}/${x}/${y}.png`,
      // Fallback: CartoDB Positron - clean style
      `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${mapZoom}/${x}/${y}.png`,
      // Alternative: Stamen Toner - high contrast
      `https://stamen-tiles.a.ssl.fastly.net/toner-lite/${mapZoom}/${x}/${y}.png`
    ];

    // Debug logging removed

    return tileSources;
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.mapContainer}>
        {/* 3D Street Map Background */}
        <View style={styles.mapBackground}>
          {/* Base map tile */}
          <Image
            source={{ uri: getMapTileUrls()[0] }}
            style={styles.mapTile}
            resizeMode="cover"
            onError={() => { }}
          />

          {/* Fallback map tile if primary fails */}
          <Image
            source={{ uri: getMapTileUrls()[1] }}
            style={[styles.mapTile, { opacity: 0.8 }]}
            resizeMode="cover"
            onError={() => { }}
          />



          {/* Map overlay with Circle members */}
          <View style={styles.mapOverlay}>
            {/* Debug: Show test avatar if no locations */}
            {locations.length === 0 && (
              <View
                style={[
                  styles.circleMarker,
                  {
                    left: 50,
                    top: 50,
                    backgroundColor: '#10B981',
                  }
                ]}
              >
                <Text style={styles.markerText}>T</Text>
                <View style={[styles.onlineIndicator, { backgroundColor: '#10B981' }]} />
              </View>
            )}

            {uniqueLocations.map((location) => {
              const pixelPos = latLngToPixel(location.latitude, location.longitude);
              const statusColor = getStatusColor(location.status || (location.isOnline ? 'online' : 'offline'));
              const initials = getAvatarInitials(location.userName);



              return (
                <View
                  key={location.id}
                  style={[
                    styles.circleMarker,
                    {
                      left: pixelPos.x - 20, // Center the marker (40px / 2)
                      top: pixelPos.y - 20,
                      backgroundColor: statusColor,
                    }
                  ]}
                >
                  <Text style={styles.markerText}>{initials}</Text>
                  {location.isOnline && (
                    <View style={[styles.onlineIndicator, { backgroundColor: statusColor }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Map controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setMapZoom(Math.min(18, mapZoom + 1))}
          >
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setMapZoom(Math.max(1, mapZoom - 1))}
          >
            <Text style={styles.controlText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.fitButton]}
            onPress={() => {
              // Trigger re-calculation of bounds and zoom
              if (locations.length > 0) {
                const lats = locations.map(loc => loc.latitude);
                const lngs = locations.map(loc => loc.longitude);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                const latPadding = (maxLat - minLat) * 0.2;
                const lngPadding = (maxLng - minLng) * 0.2;
                const newBounds = {
                  minLat: minLat - latPadding,
                  maxLat: maxLat + latPadding,
                  minLng: minLng - lngPadding,
                  maxLng: maxLng + lngPadding
                };
                setMapBounds(newBounds);
                setMapCenter({
                  lat: (newBounds.minLat + newBounds.maxLat) / 2,
                  lng: (newBounds.minLng + newBounds.maxLng) / 2
                });
              }
            }}
          >
            <Text style={styles.controlText}>⌂</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.expandButton]}
            onPress={() => setShowMapDrawer(true)}
          >
            <Text style={styles.controlText}>⛶</Text>
          </TouchableOpacity>
        </View>

        {/* Map info */}
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            Clean Map • {locations.length} Circle members • Zoom: {mapZoom} • Auto-fit: {locations.length > 0 ? 'ON' : 'OFF'}
          </Text>
          <Text style={[styles.mapInfoText, { fontSize: 10, marginTop: 2 }]}>
            Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)} • Tiles: {getMapTileUrls()[0].split('/').slice(-3).join('/')}
          </Text>
        </View>
      </View>

      {/* Bottom Map Drawer */}
      <Modal
        visible={showMapDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMapDrawer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContainer}>
            {/* Drawer Handle */}
            <View style={styles.drawerHandle} />

            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Circle Location Map</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMapDrawer(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Map Section */}
            <View style={styles.drawerMapSection}>
              <View style={styles.fullMapBackground}>
                {/* Base map tile */}
                <Image
                  source={{ uri: getMapTileUrls()[0] }}
                  style={styles.fullMapTile}
                  resizeMode="cover"
                  onError={() => { }}
                />

                {/* Fallback map tile if primary fails */}
                <Image
                  source={{ uri: getMapTileUrls()[1] }}
                  style={[styles.fullMapTile, { opacity: 0.8 }]}
                  resizeMode="cover"
                  onError={() => { }}
                />



                {/* Map overlay with Circle members */}
                <View style={styles.fullMapOverlay}>
                  {uniqueLocations.map((location) => {
                    const pixelPos = latLngToPixel(location.latitude, location.longitude);
                    const statusColor = getStatusColor(location.status || (location.isOnline ? 'online' : 'offline'));
                    const initials = getAvatarInitials(location.userName);

                    return (
                      <View
                        key={location.id}
                        style={[
                          styles.fullCircleMarker,
                          {
                            left: pixelPos.x - 25, // Center the larger marker (50px / 2)
                            top: pixelPos.y - 25,
                            backgroundColor: statusColor,
                          }
                        ]}
                      >
                        <Text style={styles.fullMarkerText}>{initials}</Text>
                        {location.isOnline && (
                          <View style={[styles.fullOnlineIndicator, { backgroundColor: statusColor }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Full-Screen Map Controls */}
              <View style={styles.fullMapControls}>
                <TouchableOpacity
                  style={styles.fullControlButton}
                  onPress={() => setMapZoom(Math.min(18, mapZoom + 1))}
                >
                  <Text style={styles.fullControlText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fullControlButton}
                  onPress={() => setMapZoom(Math.max(1, mapZoom - 1))}
                >
                  <Text style={styles.fullControlText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fullControlButton, styles.fullFitButton]}
                  onPress={() => {
                    if (uniqueLocations.length > 0) {
                      const lats = uniqueLocations.map(loc => loc.latitude);
                      const lngs = uniqueLocations.map(loc => loc.longitude);
                      const minLat = Math.min(...lats);
                      const maxLat = Math.max(...lats);
                      const minLng = Math.min(...lngs);
                      const maxLng = Math.max(...lngs);
                      const latPadding = (maxLat - minLat) * 0.2;
                      const lngPadding = (maxLng - minLng) * 0.2;
                      const newBounds = {
                        minLat: minLat - latPadding,
                        maxLat: maxLat + latPadding,
                        minLng: minLng - lngPadding,
                        maxLng: maxLng + lngPadding
                      };
                      setMapBounds(newBounds);
                      setMapCenter({
                        lat: (newBounds.minLat + newBounds.maxLat) / 2,
                        lng: (newBounds.minLng + newBounds.maxLng) / 2
                      });
                    }
                  }}
                >
                  <Text style={styles.fullControlText}>⌂</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Circle Members Cards */}
            <View style={styles.drawerCircleCardsContainer}>
              <ScrollView
                style={styles.circleListScroll}
                showsVerticalScrollIndicator={false}
              >
                {uniqueLocations.map((member) => {
                  const currentUser = uniqueLocations[0]; // First location is current user
                  const distance = currentUser ? calculateDistance(
                    currentUser.latitude,
                    currentUser.longitude,
                    member.latitude,
                    member.longitude
                  ) : 0;
                  const lastDetected = new Date(member.lastUpdated);

                  return (
                    <View key={member.id} style={styles.circleListItem}>
                      <View style={styles.listAvatar}>
                        <View style={[styles.listAvatarCircle, { backgroundColor: getStatusColor(member.status || 'online') }]}>
                          <Text style={styles.listAvatarText}>{getAvatarInitials(member.userName)}</Text>
                        </View>
                        <View style={[styles.listStatusDot, { backgroundColor: getStatusColor(member.status || 'online') }]} />
                      </View>

                      <View style={styles.listInfo}>
                        <Text style={styles.listName}>{member.userName}</Text>
                        <Text style={styles.listLocation}>
                          {getLocationLabel(member.latitude, member.longitude, member.userName)}
                        </Text>
                        <Text style={styles.listDetails}>
                          {distance.toFixed(1)} km • {formatTimeAgo(lastDetected)} • {formatLocalTime(lastDetected)}
                          {member.batteryLevel && ` • ${member.batteryLevel}%`}
                        </Text>
                      </View>

                      <View style={styles.listStatus}>
                        <Text style={[styles.listStatusText, { color: getStatusColor(member.status || 'online') }]}>
                          {member.status || 'online'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    minHeight: 200, // Ensure minimum height
  },
  mapTile: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  buildingShadows: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  buildingShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
  },
  streetDetails: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  street: {
    position: 'absolute',
  },
  mainStreet: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  mainStreetVertical: {
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  sideStreet: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  sideStreetVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circleMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  markerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
  },
  controlButton: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  controlText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  fitButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  locationButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  expandButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.9)', // Purple color for expand button
  },
  mapInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapInfoText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Drawer styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    height: height * 0.85, // 85% of screen height
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  // Drawer map section
  drawerMapSection: {
    flex: 1,
    position: 'relative',
  },
  // Full-screen map styles
  fullScreenMap: {
    flex: 1,
    position: 'relative',
  },
  fullMapBackground: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  fullMapTile: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fullBuildingShadows: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fullBuildingShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
  },
  fullStreetDetails: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  fullStreet: {
    position: 'absolute',
  },
  fullMainStreet: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  fullMainStreetVertical: {
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  fullSideStreet: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  fullSideStreetVertical: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  fullMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullCircleMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    zIndex: 1000,
  },
  fullMarkerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullOnlineIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fullMapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
    zIndex: 10,
  },
  fullControlButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fullControlText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  fullFitButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
  },
  // Circle cards styles
  circleCardsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.4, // 40% of screen height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerCircleCardsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  circleCardsScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  circleListScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: 12,
    width: 280, // Fixed width for horizontal scroll
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  circleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cardAvatar: {
    position: 'relative',
    marginRight: 16,
  },
  cardAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardStatus: {
    alignItems: 'flex-end',
  },
  cardStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // List styles
  listAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  listAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  listLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  listDetails: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  listStatus: {
    alignItems: 'flex-end',
  },
  listStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

