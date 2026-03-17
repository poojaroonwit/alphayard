import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { colors, textColors } from '../../theme/colors';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push(t('validation.passwordMinLength'));
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push(t('validation.passwordUppercase'));
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push(t('validation.passwordLowercase'));
    }
    
    if (!/\d/.test(password)) {
      errors.push(t('validation.passwordNumber'));
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push(t('validation.passwordSpecialChar'));
    }
    
    return errors;
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (password.length === 0) return { strength: 0, label: '', color: textColors.primarySecondary };
    
    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      password.length >= 12,
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score < 3) return { strength: score, label: t('password.weak'), color: '#FF6B6B' };
    if (score < 5) return { strength: score, label: t('password.medium'), color: '#FFB366' };
    return { strength: score, label: t('password.strong'), color: '#4CAF50' };
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate inputs
      if (!currentPassword.trim()) {
        Alert.alert(t('error'), t('validation.currentPasswordRequired'));
        return;
      }

      if (!newPassword.trim()) {
        Alert.alert(t('error'), t('validation.newPasswordRequired'));
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert(t('error'), t('validation.passwordMismatch'));
        return;
      }

      if (currentPassword === newPassword) {
        Alert.alert(t('error'), t('validation.passwordSame'));
        return;
      }

      // Validate new password strength
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        Alert.alert(
          t('error'),
          t('validation.passwordRequirements') + '\n\n' + passwordErrors.join('\n')
        );
        return;
      }

      await onSave(currentPassword, newPassword);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(t('error'), t('profile.passwordChangeError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Icon name="close" size={24} color={textColors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.changePassword')}</Text>
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

        <View style={styles.content}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <Icon name="shield-lock" size={48} color={colors.primary} />
            <Text style={styles.infoTitle}>{t('profile.passwordSecurity')}</Text>
            <Text style={styles.infoDescription}>
              {t('profile.passwordSecurityDesc')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Current Password */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.currentPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  placeholderTextColor={textColors.primarySecondary}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={textColors.primarySecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.newPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  placeholderTextColor={textColors.primarySecondary}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={textColors.primarySecondary}
                  />
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBar}>
                    {[...Array(6)].map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              index < passwordStrength.strength
                                ? passwordStrength.color
                                : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('profile.confirmPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('profile.confirmPasswordPlaceholder')}
                  placeholderTextColor={textColors.primarySecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={textColors.primarySecondary}
                  />
                </TouchableOpacity>
              </View>
              
              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  <Icon
                    name={newPassword === confirmPassword ? 'check-circle' : 'close-circle'}
                    size={16}
                    color={newPassword === confirmPassword ? '#4CAF50' : '#FF6B6B'}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color: newPassword === confirmPassword ? '#4CAF50' : '#FF6B6B',
                      },
                    ]}
                  >
                    {newPassword === confirmPassword
                      ? t('validation.passwordMatch')
                      : t('validation.passwordMismatch')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>{t('profile.passwordRequirements')}</Text>
            
            {[
              { key: 'length', test: newPassword.length >= 8, text: t('validation.passwordMinLength') },
              { key: 'uppercase', test: /[A-Z]/.test(newPassword), text: t('validation.passwordUppercase') },
              { key: 'lowercase', test: /[a-z]/.test(newPassword), text: t('validation.passwordLowercase') },
              { key: 'number', test: /\d/.test(newPassword), text: t('validation.passwordNumber') },
              { key: 'special', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), text: t('validation.passwordSpecialChar') },
            ].map((requirement) => (
              <View key={requirement.key} style={styles.requirement}>
                <Icon
                  name={requirement.test ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={requirement.test ? '#4CAF50' : textColors.primarySecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    { color: requirement.test ? '#4CAF50' : textColors.primarySecondary },
                  ]}
                >
                  {requirement.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
    padding: 20,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: textColors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: textColors.primarySecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: textColors.primary,
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
    color: textColors.primary,
    backgroundColor: '#FFFFFF',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  passwordStrength: {
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirementsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: textColors.primary,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
});

export default ChangePasswordModal;
