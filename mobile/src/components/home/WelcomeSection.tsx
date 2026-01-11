import React, { useState } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { Avatar } from 'native-base';

import CoolIcon from '../common/CoolIcon';
import { homeStyles } from '../../styles/homeStyles';
import { ScalePressable } from '../common/ScalePressable';
import { useNavigation } from '@react-navigation/native';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ProfileDrawer } from './ProfileDrawer';
import { ShareProfileDrawer } from './ShareProfileDrawer';
import { SearchDrawer } from './SearchDrawer';

interface WelcomeSectionProps {
  mode?: 'you' | 'family' | 'organize' | 'social' | 'default';
  title?: string;
  onTitlePress?: () => void;
  // Organize Mode Props
  activeCategoryType?: 'work' | 'life';
  onCategoryTypeChange?: (type: 'work' | 'life') => void;
  // Social Mode Props
  onLocationFilterPress?: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  mode = 'default',
  title,
  onTitlePress
}) => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { chatOpacityAnim } = useNavigationAnimation();
  const { unreadCount } = useNotification();

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);

  const handleSearchPress = () => {
    setShowSearchDrawer(true);
  };

  const handleNotificationIconPress = () => {
    navigation.navigate('Notifications');
  };

  const renderLeftContent = () => {
    if (mode === 'you') {
      return (
        <ScalePressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={() => setShowProfileDrawer(true)}
        >
          <Avatar
            bg="#FFFFFF"
            size="40px"
            source={{
              uri: user?.avatar || 'https://api.dicebear.com/9.x/adventurer/png?seed=' + (user?.firstName || 'User')
            }}
            style={{ width: 40, height: 40, borderWidth: 0 }}
          >
            {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>
            Hi, {user?.firstName || 'User'}
          </Text>
        </ScalePressable>
      );
    }

    if (mode === 'family') {
      return (
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={onTitlePress}
        >
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)'
          }}>
            <CoolIcon name="home" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Hourse
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>
                {title || 'Select Family'}
              </Text>
              <CoolIcon name="chevron-down" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (mode === 'social') {
      return (
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={onTitlePress}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
            {title || 'Social'}
          </Text>
          <CoolIcon name="chevron-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }

    // Default Mode
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        onPress={handleSearchPress}
      >
        <CoolIcon name="menu" size={28} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '600' }}>
          Boundary
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRightContent = () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Notification Icon - Shown in 'you' mode or default */}
        {(mode === 'you' || mode === 'default') && (
          <ScalePressable
            style={homeStyles.notificationIconContainer}
            onPress={handleNotificationIconPress}
          >
            <CoolIcon name="bell-ring" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={homeStyles.notificationBadgeSmall}>
                <Text style={homeStyles.notificationBadgeSmallText}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </ScalePressable>
        )}

        {/* Search Icon - Shown in all modes */}
        <ScalePressable
          style={homeStyles.notificationIconContainer}
          onPress={handleSearchPress}
        >
          <CoolIcon name="search" size={24} color="#FFFFFF" />
        </ScalePressable>

        {/* Avatar - Shown in Family mode (Right side) or Default */}
        {(mode === 'family' || mode === 'default') && (
          <ScalePressable
            style={homeStyles.chatCycleCard}
            onPress={() => setShowProfileDrawer(true)}
          >
            <Avatar
              bg="#FFFFFF"
              size="40px"
              source={{
                uri: user?.avatar || 'https://api.dicebear.com/9.x/adventurer/png?seed=' + (user?.firstName || 'User')
              }}
              key={user?.avatar}
              style={{ width: 40, height: 40, borderWidth: 0 }}
            >
              {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </ScalePressable>
        )}
      </View>
    );
  };

  return (
    <View style={homeStyles.welcomeSection}>
      <View style={homeStyles.familyNameRow}>
        <View style={homeStyles.familyNameContainer}>
          {renderLeftContent()}
        </View>
        <Animated.View style={{ opacity: chatOpacityAnim }}>
          <View style={homeStyles.chatContainer}>
            {renderRightContent()}
          </View>
        </Animated.View>
      </View>

      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        onSharePress={() => setTimeout(() => setShowShareDrawer(true), 100)}
      />

      <ShareProfileDrawer
        visible={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
      />

      <SearchDrawer
        visible={showSearchDrawer}
        onClose={() => setShowSearchDrawer(false)}
      />
    </View>
  );
};
