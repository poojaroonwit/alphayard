import React, { useState } from 'react';
import { View, Text, Animated, TouchableOpacity, Image } from 'react-native';
import { Avatar } from 'native-base';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

import CoolIcon from '../common/CoolIcon';
import { homeStyles } from '../../styles/homeStyles';
import { ScalePressable } from '../common/ScalePressable';
import { useNavigation } from '@react-navigation/native';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme
import { ProfileDrawer } from './ProfileDrawer';
import { ShareProfileDrawer } from './ShareProfileDrawer';
import { SearchDrawer } from './SearchDrawer';

interface WelcomeSectionProps {
  mode?: 'you' | 'personal' | 'circle' | 'organize' | 'social' | 'chat' | 'default';
  title?: string;
  labelAbove?: string;
  leftIcon?: string;
  onTitlePress?: () => void;
  onMenuPress?: () => void; // For circle mode menu
  // Organize Mode Props
  activeCategoryType?: 'work' | 'life';
  onCategoryTypeChange?: (type: 'work' | 'life') => void;
  // Social Mode Props
  onLocationFilterPress?: () => void;
  children?: React.ReactNode;
  hideSearch?: boolean;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  mode = 'default',
  title,
  labelAbove,
  leftIcon,
  onTitlePress,
  onMenuPress,
  children,
  hideSearch
}) => {
  const { user } = useAuth();
  const { branding } = useTheme(); // Use branding
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

  const isWhiteHeader = mode === 'personal';
  const contentColor = isWhiteHeader ? '#1F2937' : '#FFFFFF';

  const renderLeftContent = () => {
    if (mode === 'you' || mode === 'personal') {
      return (
        <ScalePressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={() => setShowProfileDrawer(true)}
        >
          <Avatar
            bg={isWhiteHeader ? "#F3F4F6" : "#FFFFFF"}
            size="40px"
            source={{
              uri: user?.avatar || 'https://api.dicebear.com/9.x/adventurer/png?seed=' + (user?.firstName || 'User')
            }}
            style={{ width: 40, height: 40, borderWidth: 0 }}
          >
            {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Text style={{ color: contentColor, fontSize: 20, fontWeight: '700' }}>
            Hi, {user?.firstName || 'User'}
          </Text>
        </ScalePressable>
      );
    }

    if (mode === 'circle') {
      return (
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 6 }}
          onPress={onTitlePress}
          activeOpacity={0.7}
        >
          <Text style={{ color: contentColor, fontSize: 20, fontWeight: '700', textAlign: 'left' }}>
            {title || 'Select Circle'}
          </Text>
          <IconMC name="chevron-down" size={20} color={contentColor} />
        </TouchableOpacity>
      );
    }

    if (mode === 'social' || mode === 'organize') {
      return (
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={onTitlePress}
        >
          {leftIcon && (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isWhiteHeader ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)'
            }}>
              <CoolIcon name={leftIcon as any} size={24} color={contentColor} />
            </View>
          )}
          <View>
            {labelAbove && (
              <Text style={{ color: isWhiteHeader ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                {labelAbove}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: contentColor, fontSize: 22, fontWeight: '700' }}>
                {title || 'Social'}
              </Text>
              <CoolIcon name="chevron-down" size={20} color={contentColor} />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (mode === 'chat') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: isWhiteHeader ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)'
          }}>
            <CoolIcon name="chat" size={24} color={contentColor} />
          </View>
          <View>
            <Text style={{ color: isWhiteHeader ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Messages
            </Text>
            <Text style={{ color: contentColor, fontSize: 20, fontWeight: '700' }}>
              {title || 'Chats'}
            </Text>
          </View>
        </View>
      );
    }

    // Default Mode
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        onPress={handleSearchPress}
      >
        {branding?.logoUrl ? (
            <Image 
                source={{ uri: branding.logoUrl }} 
                style={{ width: 32, height: 32, resizeMode: 'contain' }} 
            />
        ) : (
            <CoolIcon name="menu" size={28} color={contentColor} />
        )}
        <Text style={{ color: contentColor, fontSize: 22, fontWeight: '600' }}>
          {(branding as any)?.mobileAppName || 'Boundary'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRightContent = () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Notification Icon - Shown in 'you' mode or default */}
        {(mode === 'you' || mode === 'personal' || mode === 'default') && (
          <ScalePressable
            style={homeStyles.notificationIconContainer}
            onPress={handleNotificationIconPress}
          >
            <CoolIcon name="bell-ring" size={24} color={contentColor} />
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
        {!hideSearch && (
          <ScalePressable
            style={homeStyles.notificationIconContainer}
            onPress={handleSearchPress}
          >
            <CoolIcon name="search" size={24} color={contentColor} />
          </ScalePressable>
        )}

        {/* 3-dot menu for Circle mode */}
        {mode === 'circle' && onMenuPress && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={{ padding: 4 }}
            activeOpacity={0.7}
          >
            <IconMC name="dots-vertical" size={24} color={contentColor} />
          </TouchableOpacity>
        )}

        {/* Avatar - Shown in Circle mode (Right side), Default, Social, Chat, and Organize */}
        {(mode === 'circle' || mode === 'default' || mode === 'social' || mode === 'chat' || mode === 'organize') && (
          <ScalePressable
            style={homeStyles.chatCycleCard}
            onPress={() => setShowProfileDrawer(true)}
          >
            <Avatar
              bg={isWhiteHeader ? "#F3F4F6" : "#FFFFFF"}
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
    <View style={[homeStyles.welcomeSection, isWhiteHeader && { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
      <View style={homeStyles.circleNameRow}>
        <View style={homeStyles.circleNameContainer}>
          {renderLeftContent()}
        </View>
        <Animated.View style={{ opacity: chatOpacityAnim }}>
          <View style={homeStyles.chatContainer}>
            {renderRightContent()}
          </View>
        </Animated.View>
      </View>

      {children}

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

