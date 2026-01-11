import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import { userService } from '../../services/user/UserService';
import { ProfileStatusTab } from '../../components/profile/ProfileStatusTab';
import { ProfileInfoTab } from '../../components/profile/ProfileInfoTab';
import { ProfileSocialTab } from '../../components/profile/ProfileSocialTab';
import { ProfileFinancialTab } from '../../components/profile/ProfileFinancialTab';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'status', label: 'Status', icon: 'pulse' },
  { key: 'profile', label: 'Profile', icon: 'account' },
  { key: 'social', label: 'Social', icon: 'post' },
  { key: 'financial', label: 'Financial', icon: 'wallet' },
];

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  bio?: string;
}

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { currentFamily } = useFamily();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const tabScrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Use mock data if API fails
      const mockProfile = {
        id: user?.id || '1',
        firstName: user?.firstName || 'John',
        lastName: user?.lastName || 'Doe',
        email: user?.email || 'john.doe@example.com',
        phoneNumber: '+66 123 456 789',
        avatar: user?.avatar,
        bio: 'Living life to the fullest with my wonderful family.',
      };

      try {
        const response = await userService.getProfile();
        setProfile(response.data || mockProfile);
      } catch {
        setProfile(mockProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: tabScrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const tabIndex = Math.round(offsetX / width);
        if (tabIndex !== activeTab && tabIndex >= 0 && tabIndex < TABS.length) {
          setActiveTab(tabIndex);
        }
      }
    }
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : 'User';

  return (
    <LinearGradient
      colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Section with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.headerContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>

          {/* Name & Contact */}
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.contactRow}>
              <Icon name="phone" size={14} color="#6B7280" />
              <Text style={styles.contactText}>{profile?.phoneNumber || 'Not set'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Icon name="email" size={14} color="#6B7280" />
              <Text style={styles.contactText} numberOfLines={1}>
                {profile?.email || 'Not set'}
              </Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Icon name="pencil" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Family Badge */}
        {currentFamily && (
          <View style={styles.familyBadge}>
            <Icon name="home-heart" size={16} color="#8B5CF6" />
            <Text style={styles.familyBadgeText}>{currentFamily.name}</Text>
          </View>
        )}
      </View>

      {/* Main Content Card with Rounded Top */}
      <View style={styles.mainContentCard}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map((tab, index) => {
              const isActive = activeTab === index;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleTabPress(index)}
                >
                  <Icon
                    name={tab.icon}
                    size={20}
                    color={isActive ? '#3B82F6' : '#6B7280'}
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Content - Swipeable */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.tabContent}
        >
          {/* Status Tab */}
          <View style={styles.tabPage}>
            <ProfileStatusTab
              userId={profile?.id}
              isOnline={true}
              location="Bangkok, Thailand"
            />
          </View>

          {/* Profile Tab */}
          <View style={styles.tabPage}>
            <ProfileInfoTab
              firstName={profile?.firstName}
              lastName={profile?.lastName}
              email={profile?.email}
              phone={profile?.phoneNumber}
              bio={profile?.bio}
              family={currentFamily ? {
                name: currentFamily.name,
                memberCount: currentFamily.members?.length || 1,
                role: 'Member',
              } : undefined}
            />
          </View>

          {/* Social Tab */}
          <View style={styles.tabPage}>
            <ProfileSocialTab userId={profile?.id} />
          </View>

          {/* Financial Tab */}
          <View style={styles.tabPage}>
            <ProfileFinancialTab
              userId={profile?.id}
              showFinancial={false}
            />
          </View>
        </Animated.ScrollView>

        {/* Edit Profile Modal */}
        <EditProfileModal
          visible={showEditModal}
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            try {
              await userService.updateProfile(data);
              await loadProfile();
              setShowEditModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to update profile');
            }
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mainContentCard: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  familyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  tabPage: {
    width: width,
    flex: 1,
  },
});

export default ProfileScreen;