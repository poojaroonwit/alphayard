import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CoolIcon from '../../components/common/CoolIcon';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface FamilyItem {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  membersCount: number;
}

const FamilyListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadFamilies();
    }
  }, [isAuthenticated]);

  const loadFamilies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/families');
      const { families: apiFamilies } = response.data;

      const transformedFamilies: FamilyItem[] = apiFamilies.map((family: any) => ({
        id: family.id,
        name: family.name,
        description: family.description || `${family.membersCount} members • ${family.type || 'Private'}`,
        avatar: undefined, // Could be enhanced with family avatar
        membersCount: family.membersCount || 0,
      }));

      setFamilies(transformedFamilies);
    } catch (error: any) {
      console.error('Failed to load families:', error);
      if (error.response?.status !== 401) {
        Alert.alert(
          'Error',
          'Failed to load families. Please try again.',
          [{ text: 'OK' }]
        );
      }
      // On error, keep empty array or show empty state
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFamilies();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: FamilyItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('FamilyDetail', { familyId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.cardLeft}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <CoolIcon name="image" size={22} color="#9CA3AF" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.name}</Text>
          {!!item.description && <Text style={styles.subtitle}>{item.description}</Text>}
        </View>
      </View>
      <CoolIcon name="chevron-right" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Families</Text>
        <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
          <CoolIcon name="refresh" size={18} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={families}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <CoolIcon name="account-group" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No families yet</Text>
            <Text style={styles.emptySubtitle}>Create or join a family to get started</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FamilySettings')}
        activeOpacity={0.9}
      >
        <CoolIcon name="plus" size={24} color="#1F2937" />
      </TouchableOpacity>
    </View>
  );
};

export default FamilyListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 182, 193, 0.12)'
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFB6C1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});


