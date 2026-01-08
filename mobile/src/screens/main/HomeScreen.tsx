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
import { FamilyTab } from '../../components/home/FamilyTab';
import { FinancialTab } from '../../components/home/FinancialTab'; // Keeping for finance summary navigation
import { SocialTab } from '../../components/home/SocialTab';
import { FloatingCreatePostButton } from '../../components/home/FloatingCreatePostButton';
import { CreatePostModal } from '../../components/home/CreatePostModal';
import { CommentDrawer } from '../../components/home/CommentDrawer';
import { PostDrawer } from '../../components/home/PostDrawer';
import { FamilyDropdown } from '../../components/home/FamilyDropdown';
import { HouseStatsDrawer } from '../../components/home/HouseStatsDrawer';
import { AttentionDrawer } from '../../components/home/AttentionDrawer';
import { EmotionCheckInModal } from '../../components/home/EmotionCheckInModal';
// import { ApplicationListDrawer } from '../../components/home/ApplicationListDrawer'; // Removed in favor of global ApplicationsDrawer
import { useMainContent } from '../../contexts/MainContentContext';

// Hooks and Utils
import { useHomeScreen } from '../../hooks/home/useHomeScreen';
import { emotionService, EmotionRecord } from '../../services/emotionService';
import { useHomeBackground } from '../../hooks/useAppConfig';

// API Services
import { api, safetyApi, locationApi } from '../../services/api';
import { socialService } from '../../services/dataServices';
import { locationService, FamilyLocation } from '../../services/location/locationService';


// Constants and Styles
import { ATTENTION_APPS } from '../../constants/home';
import { homeStyles } from '../../styles/homeStyles';
// Inline API base to fetch settings without additional imports
const API_BASE_URL_MOBILE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  // Get dynamic background from CMS - only used for logging/future features
  useHomeBackground();

  const [families, setFamilies] = useState<any[]>([]); // Using any[] to bypass the lint for now, but better than never[]
  const [isPosting, setIsPosting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [emotionData, setEmotionData] = useState<EmotionRecord[]>([]);
  const [, setLoadingEmotionData] = useState(false);
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([]);
  const [socialRefreshKey, setSocialRefreshKey] = useState(0);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [showHouseStatsDrawer, setShowHouseStatsDrawer] = useState(false);
  // const [showAppsDrawer, setShowAppsDrawer] = useState(false); // Managed globally now

  // Safety and location stats - stored for future use
  const [, setSafetyStats] = useState<any>(null);
  const [, setLocationStats] = useState<any>(null);

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
    setNewComment,
    setShowFamilyDropdown,
    setShowAttentionDrawer,

    // Handlers
    handleTabPress,
    handleCommentPress,
    handleCloseCommentDrawer,
    handleAddComment,
    handleAddAttachment,
    handleRemoveAttachment,
    handleLinkPress,
    handleLikeComment,
    handleFamilySelect,
    setActiveTab, // Exposed this for internal use
    // setActiveSection removed from here as it is not in useHomeScreen

    // Data
    comments,
    loadingComments,
  } = useHomeScreen();

  // Override handleTabPress to intercept 'apps'
  const onTabPress = (tabId: string) => {
    handleTabPress(tabId);
  };

  // Create Post attachments state
  const [postMedia, setPostMedia] = useState<{ type: 'image' | 'video'; uri: string } | null>(null);
  const [postLocationLabel, setPostLocationLabel] = useState<string | null>(null);
  const [postCoordinates, setPostCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPostDrawer, setShowPostDrawer] = useState(false);

  const [lastCreatedPost] = useState<{ content: string; imageUri?: string | null; locationLabel?: string | null } | null>(null);

  // Homescreen background config
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image'>('gradient');
  const [bgColors, setBgColors] = useState<string[]>(['#FA7272', '#FFBBB4']);
  const [bgImageUrl, setBgImageUrl] = useState<string>('');

  const handlePickMedia = async (type: 'image' | 'video') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need media permissions to attach media.');
        return;
      }
      const mediaType = type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaType, quality: 0.8 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostMedia({ type, uri: result.assets[0].uri });
      }
    } catch (e) {
      console.error('pick media error', e);
    }
  };

  const handleClearMedia = () => setPostMedia(null);

  const handlePickLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need location permission to attach your location.');
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPostCoordinates({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude
      });
      let label = `${coords.coords.latitude.toFixed(5)}, ${coords.coords.longitude.toFixed(5)}`;
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: coords.coords.latitude, longitude: coords.coords.longitude });
        if (geocode && geocode[0]) {
          const a = geocode[0];
          const parts = [a.street, a.city, a.region].filter(Boolean);
          if (parts.length) label = parts.join(', ');
        }
      } catch { }
      setPostLocationLabel(label);
    } catch (e) {
      console.error('pick location error', e);
    }
  };
  const handleClearLocation = () => {
    setPostLocationLabel(null);
    setPostCoordinates(null);
  };

  // Backend integration functions
  const loadFamilies = async () => {
    try {
      // Prefer the dedicated "my hourse" endpoint so the home screen always has
      // at least the current family with members and stats.
      const response: any = await api.get('/families/my-hourse');
      const hourse = response?.hourse;

      if (hourse) {
        const members = (hourse.members || []).map((member: any) => ({
          id: member.id,
          name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Member',
          userName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Member',
          role: member.role,
          notifications: typeof member.notifications === 'number' ? member.notifications : 0,
          // Used by location service as a fallback for timestamps
          lastLocationUpdate: member.joinedAt,
          address: member.address,
          placeLabel: member.placeLabel,
          isOnline: !!member.isOnline,
        }));

        const familyForState = {
          id: hourse.id,
          name: hourse.name,
          type: hourse.type,
          description: hourse.description,
          inviteCode: hourse.invite_code,
          createdAt: hourse.created_at,
          ownerId: hourse.owner_id,
          avatar_url: hourse.avatar || null,
          members,
          stats: hourse.stats || {
            totalMessages: 0,
            totalLocations: 0,
            totalMembers: members.length,
          },
        };

        setFamilies([familyForState]);
      } else {
        setFamilies([]);
      }
    } catch (error: any) {
      // 404 is expected for new users without families - don't show error
      if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
        setFamilies([]);
        return;
      }
      // Only log/show errors for unexpected failures
      console.error('Error loading families:', error);
      setFamilies([]);
    }
  };



  const loadSafetyStats = async () => {
    try {
      const response = await safetyApi.getSafetyStats();
      if (response?.success) {
        setSafetyStats(response.stats);
      }
    } catch (error: any) {
      // 404 is expected for new users without stats - silently handle
      if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
        return;
      }
      // Only log unexpected errors
      console.error('Error loading safety stats:', error);
    }
  };

  const loadLocationStats = async () => {
    try {
      const response = await locationApi.getLocationStats();
      if (response?.success) {
        setLocationStats(response.stats);
      }
    } catch (error: any) {
      // 404 is expected for new users without stats - silently handle
      if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
        return;
      }
      // Only log unexpected errors
      console.error('Error loading location stats:', error);
    }
  };

  const loadEmotionData = async () => {
    setLoadingEmotionData(true);
    try {
      const data = await emotionService.getUserEmotionHistory(365);
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

  const { setActiveSection, activeSection, contentOpacityAnim, contentScaleAnim, setShowAppsDrawer } = useMainContent();

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
    return undefined;
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

  // Check for emotion check-in (1 PM - Midnight)
  useEffect(() => {
    const checkEmotionStatus = async () => {
      if (!user) return;

      const now = new Date();
      const hour = now.getHours();

      // Show between 1 PM (13:00) and Midnight
      if (hour >= 13 && hour <= 23) {
        const hasChecked = await emotionService.hasCheckedToday();
        if (!hasChecked) {
          // Double check with latest data if available, or just show
          setShowEmotionModal(true);
        }
      }
    };

    checkEmotionStatus();
  }, [user]);

  // Animate to home when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      animateToHome();
    }, [animateToHome])
  );

  // Transform hourse data from API into live-status friendly members
  const familyMembersForStatus = (families || []).flatMap((hourse: any) =>
    (hourse.members || []).map((member: any) => ({
      id: member.id,
      name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Member',
      avatar: member.avatar || member.avatarUrl || '',
      status: member.isOnline ? ('online' as const) : ('offline' as const),
      lastActive: member.lastActive ? new Date(member.lastActive) : new Date(member.joinedAt || Date.now()),
      heartRate: member.heartRate ?? 0,
      heartRateHistory: member.heartRateHistory || [],
      steps: member.steps ?? 0,
      sleepHours: member.sleepHours ?? 0,
      location: member.location || 'Not Available',
      batteryLevel: member.batteryLevel ?? 0,
      isEmergency: !!member.isEmergency,
      mood: member.mood,
      activity: member.activity,
      temperature: member.temperature,
    }))
  );

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
  const familyStatusMembers = [currentUserMember, ...familyMembersForStatus];

  // hourse locations from API (including current user)
  // hourse locations are now managed by the real-time location service

  // Available families from API
  const availableFamilies = families;

  const handleCreatePost = async () => {
    console.log('Post button clicked');
    Alert.alert('DEBUG', 'Post button clicked');
    if (!newPostContent.trim()) {
      Alert.alert('Empty Post', 'Please write something to post.');
      return;
    }

    try {
      setIsPosting(true);

      // Find a valid family ID. selectedFamily is currently a string from useHomeScreen
      const matchingFamily = (families as any[]).find(f => f.name === selectedFamily);
      const targetFamilyId = matchingFamily?.id || (families as any[])[0]?.id || '00000000-0000-0000-0000-000000000000';

      const created = {
        content: newPostContent,
        familyId: targetFamilyId,
        media: postMedia ? { type: postMedia.type, url: postMedia.uri } : undefined,
        location: postLocationLabel || undefined,
        latitude: postCoordinates?.latitude,
        longitude: postCoordinates?.longitude,
        tags: [],
      };

      console.log('Creating post...', created);
      await socialService.createPost(created);

      // Update UI
      setSocialRefreshKey(prev => prev + 1); // Trigger SocialTab refresh
      setShowCreatePostModal(false); // Close modal

      // Reset form
      setNewPostContent('');
      setPostMedia(null);
      setPostLocationLabel(null);

      // Don't show success drawer ("model up") - user request
      setShowPostDrawer(false);
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };



  const renderMainContentBySection = () => {
    switch (activeSection) {
      case 'gallery':
        return <GalleryCardContent />;
      case 'calendar':
        return <CalendarCardContent />;
      case 'notes':
        return <NotesCardContent />;
      case 'finance':
        return <FinancialTab onBack={() => setActiveSection('home')} />;
      case 'chat':
        return <ChatCardContent familyMembers={familyStatusMembers} />;
      case 'home':
      default:
        switch (activeTab) {
          case 'you':
            return (
              <YouTab
                familyStatusMembers={familyStatusMembers}
                familyLocations={familyLocations}
                selectedFamily={selectedFamily}
                isFamilyLoading={loading}
                onOpenApps={() => setShowAppsDrawer(true)}
                onGoToFinance={() => setActiveSection('finance')}
              />
            );
          case 'family':
            return (
              <FamilyTab
                familyStatusMembers={familyStatusMembers}
                familyLocations={familyLocations}
                emotionData={emotionData}
                selectedFamily={selectedFamily}
              />
            );
          case 'social':
            return <SocialTab
              onCommentPress={handleCommentPress}
              familyId={(families as any[]).find(f => f.name === selectedFamily)?.id}
              refreshKey={socialRefreshKey}
            />;

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
          onFamilyDropdownPress={() => setShowHouseStatsDrawer(true)}
          showFamilyDropdown={showHouseStatsDrawer} // Reusing prop name but semantic is drawer likely
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
              onTabPress={onTabPress}
            />
          )}

          {/* Animated Content Container */}
          <Animated.View style={[
            { flex: 1 },
            {
              opacity: contentOpacityAnim,
              transform: [{ scale: contentScaleAnim }],
            }
          ]}>
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
          media={postMedia}
          onPickMedia={handlePickMedia}
          onClearMedia={handleClearMedia}
          locationLabel={postLocationLabel}
          onPickLocation={handlePickLocation}
          onClearLocation={handleClearLocation}
          loading={isPosting}
        />


        {/* Comment Drawer Modal */}
        <CommentDrawer
          visible={showCommentDrawer}
          onClose={handleCloseCommentDrawer}
          comments={comments}
          loading={loadingComments}
          newComment={newComment}
          setNewComment={setNewComment}
          commentAttachments={commentAttachments}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onLinkPress={handleLinkPress}
        />


        {/* Family Selection Dropdown Modal */}
        <FamilyDropdown
          visible={showFamilyDropdown}
          onClose={() => setShowFamilyDropdown(false)}
          selectedFamily={selectedFamily}
          onFamilySelect={handleFamilySelect}
          availableFamilies={availableFamilies as any[]}
        />

        {/* House Stats Drawer */}
        <HouseStatsDrawer
          visible={showHouseStatsDrawer}
          onClose={() => setShowHouseStatsDrawer(false)}
          currentFamily={(families as any[]).find(f => f.name === selectedFamily) || null}
          onSwitchFamily={() => setShowFamilyDropdown(true)}
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

        {/* Emotion Check-in Modal */}
        <EmotionCheckInModal
          visible={showEmotionModal}
          onClose={() => setShowEmotionModal(false)}
          onSuccess={() => {
            loadEmotionData(); // Refresh data
          }}
        />

        {/* Application List Drawer - Managed globally by MainTabNavigator */}
        {/* <ApplicationListDrawer visible={showAppsDrawer} onClose={() => setShowAppsDrawer(false)} /> */}

      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default HomeScreen;
