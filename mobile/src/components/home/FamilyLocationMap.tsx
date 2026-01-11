import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import IconIon from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';

import { MapCN, Marker } from '../common/MapCN';
import { CircularBatteryBorder } from '../common/CircularBatteryBorder';

// ... (interfaces remain same)

interface FamilyLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  isOnline: boolean;
  address?: string;
  batteryLevel?: number;
  accuracy?: number;
  speed?: number;
  // Legacy support if needed
  id?: string;
  lastUpdated?: Date;
}

interface FamilyLocationMapProps {
  locations: FamilyLocation[];
  onMemberSelect?: (member: FamilyLocation) => void;
}

export const FamilyLocationMap: React.FC<FamilyLocationMapProps> = ({ locations, onMemberSelect }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const formatTimeAgo = (date: Date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleNavigate = (location: FamilyLocation) => {
    Alert.alert(
      'Navigate to Location',
      `Open navigation to ${location.userName}'s location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Navigate', onPress: () => {
            console.log('Navigate to:', location);
          }
        }
      ]
    );
  };

  return (
    <View style={[homeStyles.familyLocationCard, { padding: 0, backgroundColor: 'transparent', shadowOpacity: 0 }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>Location</Text>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            {locations.filter(l => l.isOnline).length} members online
          </Text>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 3 }}>
          <TouchableOpacity
            onPress={() => setViewMode('map')}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: viewMode === 'map' ? '#FFFFFF' : 'transparent',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: viewMode === 'map' ? 0.1 : 0,
              shadowRadius: 2,
              elevation: viewMode === 'map' ? 2 : 0,
            }}
          >
            <IconMC name="map-marker" size={18} color={viewMode === 'map' ? '#1F2937' : '#9CA3AF'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: viewMode === 'list' ? 0.1 : 0,
              shadowRadius: 2,
              elevation: viewMode === 'list' ? 2 : 0,
            }}
          >
            <IconIon name="list" size={18} color={viewMode === 'list' ? '#1F2937' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      {viewMode === 'map' && (
        <View style={{ height: 320, borderRadius: 24, overflow: 'hidden', backgroundColor: '#F3F4F6', position: 'relative' }}>
          <MapCN
            style={{ flex: 1 }}
            initialRegion={{
              latitude: locations[0]?.latitude || 37.78825,
              longitude: locations[0]?.longitude || -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            focusCoordinate={
              selectedLocation
                ? locations.find(l => (l.userId === selectedLocation || l.id === selectedLocation))
                : undefined
            }
          >
            {locations.map((loc) => {
              const id = loc.userId || loc.id || '';
              if (!id) return null;
              return (
                <Marker
                  key={id}
                  coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                  title={loc.userName}
                  description={loc.address || 'Unknown Location'}
                  avatarLabel={loc.userName.charAt(0).toUpperCase()}
                  isOnline={loc.isOnline}
                  onPress={() => {
                    setSelectedLocation(id);
                    if (onMemberSelect) onMemberSelect(loc);
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: loc.isOnline ? '#10B981' : '#6B7280',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 3,
                      borderColor: '#FFFFFF',
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 6,
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                        {loc.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginTop: 6,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                      elevation: 3,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1F2937' }}>
                        {loc.userName.split(' ')[0]}
                      </Text>
                    </View>
                  </View>
                </Marker>
              )
            })}
          </MapCN>

          {/* Floating Member List */}
          <View style={{ position: 'absolute', top: 16, left: 0, right: 0 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {locations.map((loc) => {
                const id = loc.userId || loc.id || '';
                if (!id) return null;
                const isSelected = selectedLocation === id;

                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setSelectedLocation(id)}
                    style={{
                      alignItems: 'center',
                      opacity: isSelected ? 1 : 0.85,
                      transform: [{ scale: isSelected ? 1.1 : 1 }]
                    }}
                  >
                    <View style={{
                      padding: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: 24,
                      backdropFilter: 'blur(10px)', // Web only support, but nice to have
                    }}>
                      <CircularBatteryBorder
                        percentage={loc.batteryLevel || 100}
                        size={40}
                        strokeWidth={3}
                      >
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: loc.isOnline ? '#10B981' : '#9CA3AF',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                            {loc.userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      </CircularBatteryBorder>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <ScrollView style={{ marginTop: 0 }} showsVerticalScrollIndicator={false}>
          {locations.map((location) => {
            const id = location.userId || location.id || '';
            if (!id) return null;
            const lastUpdated = location.timestamp || location.lastUpdated;
            const isSelected = selectedLocation === id;

            return (
              <TouchableOpacity
                key={id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: '#FFFFFF',
                  marginBottom: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isSelected ? '#3B82F6' : '#F3F4F6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
                onPress={() => {
                  const newId = selectedLocation === id ? null : id;
                  setSelectedLocation(newId);
                  if (newId && onMemberSelect) onMemberSelect(location);
                }}
              >
                {/* Avatar with Status */}
                <View style={{ position: 'relative', marginRight: 16 }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: location.isOnline ? '#D1FAE5' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: location.isOnline ? '#10B981' : '#E5E7EB'
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: location.isOnline ? '#047857' : '#6B7280' }}>
                      {location.userName.charAt(0)}
                    </Text>
                  </View>
                  {location.isOnline && (
                    <View style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: '#10B981',
                      borderWidth: 2,
                      borderColor: '#FFFFFF'
                    }} />
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{location.userName}</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{Math.floor(Math.random() * 5) + 1}km away</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconMC name="map-marker-outline" size={14} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: '#6B7280', flex: 1 }} numberOfLines={1}>
                      {location.address || "123 Main St, New York, NY"}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconIon name="battery-half" size={16} color="#10B981" />
                          <Text style={{ fontSize: 12, color: '#374151' }}>{location.batteryLevel || 85}% Charged</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconIon name="speedometer-outline" size={16} color="#6B7280" />
                          <Text style={{ fontSize: 12, color: '#374151' }}>{location.speed || 0} km/h</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Updated {formatTimeAgo(lastUpdated)}</Text>
                        <TouchableOpacity onPress={() => handleNavigate(location)}>
                          <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '600' }}>Get Directions</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

    </View>
  );
};
