import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Text, Animated, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

// Components
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { TabNavigation } from '../../components/home/TabNavigation';
import GalleryCardContent from '../../components/card/GalleryCardContent';
import NotesCardContent from '../../components/card/NotesCardContent';
import CalendarCardContent from '../../components/card/CalendarCardContent';
import ChatCardContent from '../../components/card/ChatCardContent';
import { YouTab } from '../../components/home/YouTab';
import { FinancialTab } from '../../components/home/FinancialTab';
import { SocialTab } from '../../components/home/SocialTab';
import { FloatingCreatePostButton } from '../../components/home/FloatingCreatePostButton';
import { CreatePostModal } from '../../components/home/CreatePostModal';
import { CommentDrawer } from '../../components/home/CommentDrawer';
import { PostDrawer } from '../../components/home/PostDrawer';
import { FamilyDropdown } from '../../components/home/FamilyDropdown';
import { AttentionDrawer } from '../../components/home/AttentionDrawer';
import EmotionHeatMap from '../../components/EmotionHeatMap';
import { useMainContent } from '../../contexts/MainContentContext';

// Hooks and Utils
import { useHomeScreen } from '../../hooks/home/useHomeScreen';
import { emotionService, EmotionRecord } from '../../services/emotionService';

// API Services
import { familyApi, safetyApi, locationApi } from '../../services/api';
import { locationService, FamilyLocation } from '../../services/location/locationService';

// Constants and Styles
import { ATTENTION_APPS } from '../../constants/home';
import { homeStyles } from '../../styles/homeStyles';
// Inline API base to fetch settings without additional imports
const API_BASE_URL_MOBILE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [families, setFamilies] = useState([]);
  const [safetyStats, setSafetyStats] = useState(null);
  const [locationStats, setLocationStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [emotionData, setEmotionData] = useState<EmotionRecord[]>([]);
  const [loadingEmotionData, setLoadingEmotionData] = useState(false);
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([]);

  const {
    // State
    activeTab,
    showBackToTop,
    showCreatePostModal,
    newPostContent,
    showCommentDrawer,
    newComment,
    commentAttachments,
    showFamilyDropdown,
    selectedFamily,
    showAttentionDrawer,
    
    // Setters
    setShowCreatePostModal,
    setNewPostContent,
    setShowCommentDrawer,
    setNewComment,
    setCommentAttachments,
    setShowFamilyDropdown,
    setShowAttentionDrawer,
    
    // Handlers
    handleTabPress,
    handleRefresh,
    handleCommentPress,
    handleCloseCommentDrawer,
    handleAddComment,
    handleAddAttachment,
    handleRemoveAttachment,
    handleLinkPress,
    handleFamilySelect,
  } = useHomeScreen();

  // Create Post attachments state
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [postLocationLabel, setPostLocationLabel] = useState<string | null>(null);
  const [showPostDrawer, setShowPostDrawer] = useState(false);

  const [lastCreatedPost, setLastCreatedPost] = useState<{ content: string; imageUri?: string | null; locationLabel?: string | null } | null>(null);

  // Homescreen background config
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image'>('gradient');
  const [bgColors, setBgColors] = useState<string[]>(['#FA7272', '#FFBBB4']);
  const [bgImageUrl, setBgImageUrl] = useState<string>('');

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need media permissions to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('pick image error', e);
    }
  };

  const handleClearImage = () => setPostImageUri(null);

  const handlePickLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need location permission to attach your location.');
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let label = `${coords.coords.latitude.toFixed(5)}, ${coords.coords.longitude.toFixed(5)}`;
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: coords.coords.latitude, longitude: coords.coords.longitude });
        if (geocode && geocode[0]) {
          const a = geocode[0];
          const parts = [a.street, a.city, a.region].filter(Boolean);
          if (parts.length) label = parts.join(', ');
        }
      } catch {}
      setPostLocationLabel(label);
    } catch (e) {
      console.error('pick location error', e);
    }
  };
  const handleClearLocation = () => setPostLocationLabel(null);

  // Backend integration functions
  const loadFamilies = async () => {
    try {
      const response = await familyApi.getFamilies();
      if (response.success) {
        setFamilies(response.families);
      }
    } catch (error) {
      console.error('Error loading families:', error);
      Alert.alert('Error', 'Failed to load families');
    }
  };

  const loadSafetyStats = async () => {
    try {
      const response = await safetyApi.getSafetyStats();
      if (response.success) {
        setSafetyStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading safety stats:', error);
    }
  };

  const loadLocationStats = async () => {
    try {
      const response = await locationApi.getLocationStats();
      if (response.success) {
        setLocationStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading location stats:', error);
    }
  };

  const loadEmotionData = async () => {
    setLoadingEmotionData(true);
    try {
      const data = await emotionService.getUserEmotionHistory(30);
      setEmotionData(data);
    } catch (error) {
      console.error('Error loading emotion data:', error);
    } finally {
      setLoadingEmotionData(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFamilies(),
        loadSafetyStats(),
        loadLocationStats(),
        loadEmotionData(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load application homescreen background setting (prefer public, fallback to legacy or draft if needed)
  useEffect(() => {
    const loadBackground = async () => {
      try {
        const root = API_BASE_URL_MOBILE.replace(/\/api$/i, '');
        const res = await fetch(`${root}/admin/application-settings?is_public=true`);
        if (!res.ok) return;
        const json = await res.json();
        const settings = (json.settings || []);
        const pick = (keys: string[]) => {
          for (const k of keys) {
            const it = settings.find((s: any) => s.setting_key === k);
            if (it?.setting_value) return it.setting_value;
          }
          return null;
        };
        const v = pick(['homescreen.background.public', 'homescreen.background', 'homescreen.background.draft']);
        if (v) {
          const type = (v.type as 'color' | 'gradient' | 'image') || 'color';
          setBgType(type);
          if (type === 'color') {
            setBgColors([v.colors?.[0] || '#FFFFFF']);
            setBgImageUrl('');
          } else if (type === 'gradient') {
            const colors = Array.isArray(v.colors) && v.colors.length ? v.colors.slice(0, 3) : ['#FF6B6B', '#FFB6C1'];
            setBgColors(colors);
            setBgImageUrl('');
          } else if (type === 'image') {
            setBgImageUrl(v.imageUrl || '');
          }
        }
      } catch (e) {
        // Fail silently; keep defaults
      }
    };
    loadBackground();
  }, []);

  const BackgroundWrapper = useMemo(() => {
    if (bgType === 'image' && bgImageUrl) {
      return ({ children }: { children: React.ReactNode }) => (
        <ImageBackground source={{ uri: bgImageUrl }} style={homeStyles.gradientContainer} resizeMode="cover">
          {children}
        </ImageBackground>
      );
    }
    if (bgType === 'color') {
      return ({ children }: { children: React.ReactNode }) => (
        <View style={[homeStyles.gradientContainer, { backgroundColor: bgColors[0] || '#FFFFFF' }]}>
          {children}
        </View>
      );
    }
    // default gradient
    return ({ children }: { children: React.ReactNode }) => (
      <LinearGradient
        colors={bgColors.length ? bgColors : ['#FA7272', '#FFBBB4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={homeStyles.gradientContainer}
      >
        {children}
      </LinearGradient>
    );
  }, [bgType, bgColors, bgImageUrl]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

  const { activeSection } = useMainContent();

  // Load data only on Home section to avoid unnecessary loads in other tabs
  useEffect(() => {
    if (user && activeSection === 'home') {
      loadData();
      
      // Set up real-time location tracking
      const unsubscribe = locationService.subscribe((locations) => {
        setFamilyLocations(locations);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, activeSection]);

  // Update location service when hourse data changes
  useEffect(() => {
    if (families && families.length > 0) {
      locationService.setFamilyData(families);
    }
  }, [families]);

  // Update location service when user data changes
  useEffect(() => {
    if (user) {
      locationService.setCurrentUser(user);
    }
  }, [user]);

  // Animate to home when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      animateToHome();
    }, [animateToHome])
  );

  // Transform hourse data from API
  const familyMembers = families.map(hourse => ({
    id: hourse.id,
    name: hourse.name,
    notifications: 0,
    isComposite: false,
    type: 'hourse',
    familyId: hourse.id,
    avatarUrl: hourse.avatar_url || null,
  }));
  
  // Always include the current user in hourse status
  const currentUserMember = {
    id: user?.id || 'current-user',
    name: user ? `${user.firstName} ${user.lastName}` : 'You',
    avatar: user?.avatar || null,
    status: 'online' as const,
    lastActive: new Date(),
    heartRate: null, // No real data available
    heartRateHistory: [],
    steps: null, // No real data available
    sleepHours: null, // No real data available
    location: 'Not Available',
    batteryLevel: null, // No real data available
    isEmergency: false,
    mood: null, // No real data available
    activity: 'Not Available',
    temperature: null, // No real data available
  };

  // Combine current user with hourse members
  const familyStatusMembers = [currentUserMember, ...families];

  // hourse locations from API (including current user)
  // hourse locations are now managed by the real-time location service

  // Available families from API
  const availableFamilies = families;

  const handleCreatePost = () => {
    const created = {
      content: newPostContent,
      imageUri: postImageUri,
      locationLabel: postLocationLabel,
    };
    setLastCreatedPost(created);
    setShowCreatePostModal(false);
    setShowPostDrawer(true);
    setNewPostContent('');
    setPostImageUri(null);
    setPostLocationLabel(null);
  };

  
  const renderMainContentBySection = () => {
    switch (activeSection) {
      case 'gallery':
        return <GalleryCardContent />;
      case 'calendar':
        return <CalendarCardContent />;
      case 'notes':
        return <NotesCardContent />;
      case 'chat':
        return <ChatCardContent familyMembers={familyStatusMembers} />;
      case 'home':
      default:
        switch (activeTab) {
          case 'you':
            return (
              <YouTab
                showAttentionDrawer={showAttentionDrawer}
                setShowAttentionDrawer={setShowAttentionDrawer}
                familyStatusMembers={familyStatusMembers}
                emotionData={emotionData}
                familyLocations={familyLocations}
                selectedFamily={selectedFamily}
              />
            );
          case 'financial':
            return <FinancialTab />;
          case 'social':
            return <SocialTab onCommentPress={handleCommentPress} familyId={selectedFamily?.id} />;
          default:
            return null;
        }
    }
  };

  return (
    <BackgroundWrapper>
      <SafeAreaView style={homeStyles.container}>
        {/* Fixed Welcome Section */}
        <WelcomeSection
          selectedFamily={selectedFamily}
          onFamilyDropdownPress={() => setShowFamilyDropdown(!showFamilyDropdown)}
          showFamilyDropdown={showFamilyDropdown}
          familyMembers={familyStatusMembers}
        />

        {/* Main Content Card with Fixed Tabs and Scrollable Content */}
        <Animated.View style={[
          homeStyles.mainContentCard,
          {
            marginTop: cardMarginTopAnim,
          }
        ]}>
          {/* Fixed Tabs - only show on Home section */}
          {activeSection === 'home' && (
            <TabNavigation
              activeTab={activeTab}
              onTabPress={handleTabPress}
            />
          )}

          {/* Scrollable Tab Content Only */}
          <ScrollView
            style={homeStyles.cardScrollView}
            contentContainerStyle={homeStyles.cardScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#D32F2F']}
                tintColor="#D32F2F"
              />
            }
          >
            {renderMainContentBySection()}
            {showBackToTop && (
              <TouchableOpacity
                style={homeStyles.quickActionButton}
                onPress={() => {
                  // Scroll to top logic would go here
                }}
              >
                <Text style={homeStyles.quickActionText}>↑</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>

        {/* Floating Create Post Button (only visible on Social tab) */}
        <FloatingCreatePostButton
          visible={activeTab === 'social'}
          onPress={() => setShowCreatePostModal(true)}
        />

        {/* Create Post Modal */}
        <CreatePostModal
          visible={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          newPostContent={newPostContent}
          setNewPostContent={setNewPostContent}
          onPost={handleCreatePost}
          imageUri={postImageUri}
          onPickImage={handlePickImage}
          onClearImage={handleClearImage}
          locationLabel={postLocationLabel}
          onPickLocation={handlePickLocation}
          onClearLocation={handleClearLocation}
        />

        {/* Comment Drawer Modal */}
        <CommentDrawer
          visible={showCommentDrawer}
          onClose={handleCloseCommentDrawer}
          newComment={newComment}
          setNewComment={setNewComment}
          commentAttachments={commentAttachments}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onAddComment={handleAddComment}
          onLinkPress={handleLinkPress}
        />

        {/* hourse Selection Dropdown Modal */}
        <FamilyDropdown
          visible={showFamilyDropdown}
          onClose={() => setShowFamilyDropdown(false)}
          selectedFamily={selectedFamily}
          onFamilySelect={handleFamilySelect}
          availableFamilies={availableFamilies}
        />

        {/* Attention List Drawer Modal */}
        <AttentionDrawer
          visible={showAttentionDrawer}
          onClose={() => setShowAttentionDrawer(false)}
          attentionApps={ATTENTION_APPS as any}
        />

        {/* New Post Drawer */}
        <PostDrawer
          visible={showPostDrawer}
          onClose={() => setShowPostDrawer(false)}
          authorName={currentUserMember.name}
          timestamp={new Date().toLocaleString()}
          content={lastCreatedPost?.content || ''}
          imageUri={lastCreatedPost?.imageUri}
          locationLabel={lastCreatedPost?.locationLabel}
        />
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default HomeScreen;
