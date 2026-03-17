import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { imagePickerService, MediaTypeOptions } from '../../services/imagePicker/ImagePickerService';
import { colors, textColors } from '../../theme/colors';
import { LoadingSpinner } from '../common/LoadingSpinner';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
}

interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  profile,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        avatar: profile.avatar,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bio: profile.bio,
      });
    }
  }, [visible, profile]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarPress = () => {
    Alert.alert(
      t('profile.changeAvatar'),
      t('profile.chooseAvatarSource'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('profile.camera'), onPress: () => openImagePicker('camera') },
        { text: t('profile.gallery'), onPress: () => openImagePicker('gallery') },
        ...(formData.avatar ? [{ text: t('profile.removeAvatar'), style: 'destructive', onPress: removeAvatar }] : []),
      ]
    );
  };

  const openImagePicker = async (source: 'camera' | 'gallery') => {
    try {
      setAvatarLoading(true);
      
      // Request permissions
      if (source === 'camera') {
        const { status } = await imagePickerService.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('error'), t('profile.cameraPermissionRequired'));
          return;
        }
      } else {
        const { status } = await imagePickerService.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('error'), t('profile.galleryPermissionRequired'));
          return;
        }
      }

      const options = {
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        result = await imagePickerService.launchCameraAsync(options);
      } else {
        result = await imagePickerService.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          avatar: imageUri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), t('profile.avatarUploadError'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: undefined,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        Alert.alert(t('error'), t('profile.nameRequired'));
        return;
      }

      if (!formData.email?.trim()) {
        Alert.alert(t('error'), t('profile.emailRequired'));
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert(t('error'), t('profile.invalidEmail'));
        return;
      }

      // Phone validation (basic)
      if (formData.phoneNumber && formData.phoneNumber.length < 10) {
        Alert.alert(t('error'), t('profile.invalidPhone'));
        return;
      }

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('error'), t('profile.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const firstInitial = formData.firstName?.charAt(0) || '';
    const lastInitial = formData.lastName?.charAt(0) || '';
    return firstInitial + lastInitial;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="close" size={24} color={textColors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={avatarLoading}
            >
              {avatarLoading ? (
                <View style={[styles.avatar, styles.avatarLoading]}>
                  <LoadingSpinner size="small" />
                </View>
              ) : formData.avatar ? (
                <Image source={{ uri: formData.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              )}
              
              <View style={styles.editAvatarBadge}>
                <Icon name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.avatarHint}>{t('profile.tapToChangeAvatar')}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Name Fields */}
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('profile.firstName')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.firstName || ''}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder={t('profile.firstNamePlaceholder')}
                  placeholderTextColor={textColors.primarySecondary}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('profile.lastName')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.lastName || ''}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder={t('profile.lastNamePlaceholder')}
                  placeholderTextColor={textColors.primarySecondary}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.email')} *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email || ''}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder={t('profile.emailPlaceholder')}
                placeholderTextColor={textColors.primarySecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.phoneNumber')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phoneNumber || ''}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                placeholder={t('profile.phonePlaceholder')}
                placeholderTextColor={textColors.primarySecondary}
                keyboardType="phone-pad"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.dateOfBirth')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.dateOfBirth || ''}
                onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={textColors.primarySecondary}
              />
            </View>

            {/* Gender */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.gender')}</Text>
              <View style={styles.genderOptions}>
                {['male', 'female', 'other', 'prefer_not_to_say'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      formData.gender === gender && styles.genderOptionSelected,
                    ]}
                    onPress={() => handleInputChange('gender', gender)}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        formData.gender === gender && styles.genderOptionTextSelected,
                      ]}
                    >
                      {t(`profile.gender.${gender}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bio */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.bio')}</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={formData.bio || ''}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder={t('profile.bioPlaceholder')}
                placeholderTextColor={textColors.primarySecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {(formData.bio || '').length}/500
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: textColors.primary,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoading: {
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 14,
    color: textColors.primarySecondary,
    textAlign: 'center',
  },
  formSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formField: {
    flex: 1,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: textColors.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: textColors.primary,
    backgroundColor: colors.backgroundLight,
  },
  textAreaInput: {
    height: 100,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: textColors.primarySecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderOptionText: {
    fontSize: 14,
    color: textColors.primary,
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default EditProfileModal;
