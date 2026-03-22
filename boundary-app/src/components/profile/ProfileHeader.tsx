import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  subscription?: {
    plan: string;
    status: string;
  };
}

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditPress: () => void;
  onSettingsPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditPress,
  onSettingsPress,
}) => {
  const { t } = useTranslation();

  const getInitials = () => {
    const firstInitial = profile?.firstName?.charAt(0) || '';
    const lastInitial = profile?.lastName?.charAt(0) || '';
    return firstInitial + lastInitial;
  };


  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onEditPress}
          accessible={true}
          accessibilityLabel={t('profile.editProfile')}
          accessibilityHint={t('profile.editProfileHint')}
          accessibilityRole="button"
        >
          <Icon name="pencil" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onSettingsPress}
          accessible={true}
          accessibilityLabel={t('profile.settings')}
          accessibilityHint={t('profile.settingsHint')}
          accessibilityRole="button"
        >
          <Icon name="cog" size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Profile Content */}
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          
          {/* Edit Avatar Button */}
          <TouchableOpacity 
            style={styles.editAvatarButton} 
            onPress={onEditPress}
            accessible={true}
            accessibilityLabel={t('profile.changeAvatar')}
            accessibilityHint={t('profile.changeAvatarHint')}
            accessibilityRole="button"
          >
            <Icon name="camera" size={14} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Subscription Badge */}
          {profile.subscription && profile.subscription.status === 'active' && (
            <View style={styles.subscriptionBadge}>
              <Icon name="crown" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Profile Info */}
        <View 
          style={styles.profileInfo}
          accessible={true}
          accessibilityLabel={`${t('profile.userInfo')}: ${profile.firstName} ${profile.lastName}, ${profile.email}`}
        >
          <Text 
            style={styles.name}
            accessible={true}
            accessibilityLabel={`${t('profile.name')}: ${profile.firstName} ${profile.lastName}`}
          >
            {profile.firstName} {profile.lastName}
          </Text>
          <Text 
            style={styles.email}
            accessible={true}
            accessibilityLabel={`${t('profile.email')}: ${profile.email}`}
          >
            {profile.email}
          </Text>
          
          {profile.bio && (
            <Text 
              style={styles.bio} 
              numberOfLines={2}
              accessible={true}
              accessibilityLabel={`${t('profile.bio')}: ${profile.bio}`}
            >
              {profile.bio}
            </Text>
          )}

          {/* Verification Status */}
          <View 
            style={styles.verificationContainer}
            accessible={true}
            accessibilityLabel={t('profile.accountVerified')}
          >
            <Icon name="check-decagram" size={14} color="#4CAF50" />
            <Text style={styles.verificationText}>{t('profile.verified')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    minHeight: 280,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 30,
    zIndex: 10,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 73,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary[500],
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subscriptionBadge: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInfo: {
    alignItems: 'center',
    maxWidth: width - 80,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  bio: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '400',
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  verificationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 40,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default ProfileHeader;

