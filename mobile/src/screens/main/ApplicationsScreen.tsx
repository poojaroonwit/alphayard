import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  TextInput,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IconIon from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

/**
 * Calculate dynamic grid configuration based on screen width
 * This function determines the optimal number of apps per row and their sizes
 * based on the available screen width, ensuring a responsive layout that
 * adapts to different screen sizes and orientations.
 * 
 * @param currentWidth - The current screen width (defaults to global width)
 * @returns Object containing grid configuration parameters
 */
const getGridConfig = (currentWidth = width) => {
  const containerPadding = 40; // 20px on each side
  const gapBetweenApps = 16; // Gap between app icons
  const availableWidth = currentWidth - containerPadding;

  // Calculate how many apps can fit based on minimum app width
  const minAppWidth = 60; // Minimum width for an app icon container
  const maxAppsPerRow = Math.floor(availableWidth / (minAppWidth + gapBetweenApps));

  // Ensure we have at least 3 apps per row and at most 6
  const appsPerRow = Math.max(3, Math.min(maxAppsPerRow, 6));

  // Calculate actual app width to distribute space evenly
  const totalGaps = appsPerRow - 1;
  const totalGapWidth = totalGaps * gapBetweenApps;
  const appWidth = (availableWidth - totalGapWidth) / appsPerRow;

  return {
    appsPerRow,
    appWidth,
    gapBetweenApps,
    containerPadding,
  };
};

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  badge?: number;
  isNew?: boolean;
  isPremium?: boolean;
  category: 'communication' | 'productivity' | 'entertainment' | 'utilities' | 'safety' | 'finance' | 'settings';
  gradient: string[];
}

const ApplicationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentFamily } = useFamily();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [screenDimensions, setScreenDimensions] = useState({ width, height });

  const apps: App[] = [
    // Gallery
    {
      id: 'gallery',
      name: 'Gallery',
      description: 'hourse photo sharing',
      icon: 'image',
      color: '#FF6B6B',
      route: 'Gallery',
      category: 'communication',
      gradient: ['#FF6B6B', '#FF8E8E'],
    },

    // Communication (Combined Chat, Video Call & Voice)
    {
      id: 'communication',
      name: 'Communication',
      description: 'Chat, calls & voice',
      icon: 'chatbubbles',
      color: '#4ECDC4',
      route: 'Communication',
      category: 'communication',
      gradient: ['#4ECDC4', '#6EDDD6'],
    },

    // Social
    {
      id: 'social',
      name: 'Social',
      description: 'hourse social network',
      icon: 'people',
      color: '#FFA07A',
      route: 'Social',
      category: 'communication',
      gradient: ['#FFA07A', '#FFB08C'],
    },

    // Storage
    {
      id: 'storage',
      name: 'Storage',
      description: 'File management',
      icon: 'folder',
      color: '#DDA0DD',
      route: 'Storage',
      category: 'productivity',
      gradient: ['#DDA0DD', '#E5B3E5'],
    },

    // Notes
    {
      id: 'notes',
      name: 'Notes',
      description: 'Quick notes',
      icon: 'document-text',
      color: '#98D8C8',
      route: 'Notes',
      category: 'productivity',
      gradient: ['#98D8C8', '#A8E0D0'],
    },

    // Calendar
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Event planning',
      icon: 'calendar',
      color: '#F7DC6F',
      route: 'Calendar',
      category: 'productivity',
      gradient: ['#F7DC6F', '#F8E07F'],
    },

    // Tasks
    {
      id: 'tasks',
      name: 'Tasks',
      description: 'To-do lists',
      icon: 'checkmark-circle',
      color: '#BB8FCE',
      route: 'TaskManagement',
      category: 'productivity',
      gradient: ['#BB8FCE', '#C59DD6'],
    },

    // Goals
    {
      id: 'goals',
      name: 'Goals',
      description: 'hourse goals',
      icon: 'trophy',
      color: '#F8C471',
      route: 'Goals',
      category: 'productivity',
      gradient: ['#F8C471', '#F9CC81'],
    },

    // Location
    {
      id: 'location',
      name: 'Location',
      description: 'hourse tracking',
      icon: 'location',
      color: '#3498DB',
      route: 'Location',
      category: 'safety',
      gradient: ['#3498DB', '#44A8EB'],
    },

    // Health
    {
      id: 'health',
      name: 'Health',
      description: 'Health records',
      icon: 'medical',
      color: '#2ECC71',
      route: 'Health',
      category: 'safety',
      gradient: ['#2ECC71', '#3EDC81'],
    },

    // Budget
    {
      id: 'budget',
      name: 'Budget',
      description: 'hourse budget',
      icon: 'wallet',
      color: '#27AE60',
      route: 'Budget',
      category: 'finance',
      gradient: ['#27AE60', '#37BE70'],
    },

    // Expenses
    {
      id: 'expenses',
      name: 'Expenses',
      description: 'Track spending',
      icon: 'card',
      color: '#8E44AD',
      route: 'Expenses',
      category: 'finance',
      gradient: ['#8E44AD', '#9E54BD'],
    },

    // Savings
    {
      id: 'savings',
      name: 'Savings',
      description: 'Save money',
      icon: 'trending-up',
      color: '#16A085',
      route: 'Savings',
      category: 'finance',
      gradient: ['#16A085', '#26B095'],
    },

    // Investments
    {
      id: 'investments',
      name: 'Investments',
      description: 'Investment tracking',
      icon: 'analytics',
      color: '#D68910',
      route: 'Investments',
      category: 'finance',
      gradient: ['#D68910', '#E69920'],
    },

    // Bills
    {
      id: 'bills',
      name: 'Bills',
      description: 'Bill reminders',
      icon: 'receipt',
      color: '#C0392B',
      route: 'Bills',
      category: 'finance',
      gradient: ['#C0392B', '#D0493B'],
    },

    // hourse Settings
    {
      id: 'hourse',
      name: 'hourse',
      description: 'hourse settings',
      icon: 'people-circle',
      color: '#9B59B6',
      route: 'hourse',
      category: 'settings',
      gradient: ['#9B59B6', '#AB69C6'],
    },
  ];

  const categories = [
    { id: 'all', name: 'All Apps', icon: 'apps' },
    { id: 'communication', name: 'Communication', icon: 'chatbubbles' },
    { id: 'productivity', name: 'Productivity', icon: 'briefcase' },
    { id: 'safety', name: 'Safety', icon: 'shield-checkmark' },
    { id: 'finance', name: 'Finance', icon: 'wallet' },
    { id: 'settings', name: 'Settings', icon: 'settings' },
  ];

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApps();
    setRefreshing(false);
  };

  const handleAppPress = (app: App) => {
    // Navigate to the app or show app details
    console.log('App pressed:', app.name);

    // Navigate to specific screens based on app route
    switch (app.route) {
      case 'Gallery':
        navigation.navigate('Gallery' as never);
        break;
      case 'Storage':
        navigation.navigate('Storage' as never);
        break;
      case 'Notes':
        navigation.navigate('Notes' as never);
        break;
      case 'TaskManagement':
        navigation.navigate('TaskManagement' as never);
        break;
      default:
        // For other apps, you can add more navigation cases here
        console.log(`Navigation to ${app.route} not implemented yet`);
        break;
    }
  };

  const getFilteredApps = () => {
    let filtered = apps;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const renderAppIcon = (app: App) => {
    const { appWidth } = getGridConfig(screenDimensions.width);
    const iconSize = Math.max(20, Math.min(28, appWidth * 0.4)); // Responsive icon size
    return (
      <TouchableOpacity
        key={app.id}
        style={[styles.appIconContainer, { width: appWidth }]}
        onPress={() => handleAppPress(app)}
      >
        <LinearGradient
          colors={app.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.appIconGradient, {
            width: Math.min(56, appWidth * 0.8),
            height: Math.min(56, appWidth * 0.8),
            borderRadius: Math.min(28, appWidth * 0.4)
          }]}
        >
          <IconIon name={app.icon as any} size={iconSize} color="#FFFFFF" />
          {app.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{app.badge}</Text>
            </View>
          )}
          {app.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {app.isPremium && (
            <View style={styles.premiumBadge}>
              <IconIon name="star" size={12} color="#FFD700" />
            </View>
          )}
        </LinearGradient>
        <Text style={[styles.appName, { fontSize: Math.max(10, Math.min(14, appWidth * 0.25)) }]} numberOfLines={1}>{app.name}</Text>
        <Text style={[styles.appDescription, { fontSize: Math.max(8, Math.min(12, appWidth * 0.2)) }]} numberOfLines={1}>{app.description}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryTab = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryTab, selectedCategory === category.id && styles.activeCategoryTab]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <IconIon
        name={category.icon as any}
        size={20}
        color={selectedCategory === category.id ? '#FFFFFF' : '#666666'}
      />
      <Text style={[styles.categoryText, selectedCategory === category.id && styles.activeCategoryText]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderAppsGrid = (appsList: App[]) => {
    const { appsPerRow, gapBetweenApps, appWidth } = getGridConfig(screenDimensions.width);

    // Group apps by sections
    const sections = [
      {
        title: 'Store',
        apps: appsList.filter(app => ['gallery', 'storage', 'notes'].includes(app.id))
      },
      {
        title: 'Action Items',
        apps: appsList.filter(app => ['tasks', 'goals', 'bills'].includes(app.id))
      },
      {
        title: 'General',
        apps: appsList.filter(app => ['communication', 'social', 'location', 'health'].includes(app.id))
      },
      {
        title: 'Finance',
        apps: appsList.filter(app => ['budget', 'expenses', 'savings', 'investments'].includes(app.id))
      },
      {
        title: 'Settings',
        apps: appsList.filter(app => ['hourse'].includes(app.id))
      }
    ];

    return sections.map((section, sectionIndex) => (
      <View key={sectionIndex} style={styles.sectionContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionDivider} />
        </View>

        {/* Section Apps Grid */}
        {(() => {
          const rows = [];
          for (let i = 0; i < section.apps.length; i += appsPerRow) {
            rows.push(section.apps.slice(i, i + appsPerRow));
          }

          return rows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.appRow, { gap: gapBetweenApps }]}>
              {row.map(app => renderAppIcon(app))}
              {/* Fill empty spaces to maintain dynamic column layout */}
              {Array.from({ length: appsPerRow - row.length }).map((_, index) => (
                <View key={`empty-${index}`} style={[styles.emptyAppSlot, { width: appWidth }]} />
              ))}
            </View>
          ));
        })()}
      </View>
    ));
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const filteredApps = getFilteredApps();

  return (
    <LinearGradient
      colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Applications</Text>
              <Text style={styles.headerSubtitle}>
                {filteredApps.length} apps available • {getGridConfig(screenDimensions.width).appsPerRow} per row
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <IconIon name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <IconIon name="grid" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.contentCard}>
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <IconIon name="search" size={20} color="#666666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search applications..."
                  placeholderTextColor="#999999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <IconIon name="close-circle" size={20} color="#666666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
            >
              {categories.map(renderCategoryTab)}
            </ScrollView>

            {/* Apps Grid */}
            <View style={styles.appsContainer}>
              {filteredApps.length > 0 ? (
                renderAppsGrid(filteredApps)
              ) : (
                <View style={styles.emptyState}>
                  <IconMC name="apps" size={64} color="#cccccc" />
                  <Text style={styles.emptyStateTitle}>No apps found</Text>
                  <Text style={styles.emptyStateText}>
                    Try adjusting your search or category filter
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },

  // Category Tabs
  categoryContainer: {
    marginBottom: 24,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 8,
  },
  activeCategoryTab: {
    backgroundColor: '#FF5A5A',
    borderColor: '#FF5A5A',
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Apps Grid
  appsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 12,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  appIconContainer: {
    alignItems: 'center',
    // Width will be set dynamically in renderAppIcon
  },
  appIconGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    // Width, height, and borderRadius set dynamically in renderAppIcon
  },
  appName: {
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 2,
    // Font size set dynamically in renderAppIcon
  },
  appDescription: {
    color: '#666666',
    textAlign: 'center',
    // Font size set dynamically in renderAppIcon
  },
  emptyAppSlot: {
    // Width will be set dynamically in renderAppsGrid
  },

  // Badges
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#2ED573',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },
});

export default ApplicationsScreen; 