import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export type VerifyChannel = 'email' | 'sms' | 'totp';

interface ChannelOption {
  id: VerifyChannel;
  title: string;
  description: string;
  icon: string;
}

const ALL_CHANNEL_OPTIONS: ChannelOption[] = [
  {
    id: 'email',
    title: 'Email',
    description: 'Receive a verification code via email',
    icon: 'email-outline',
  },
  {
    id: 'sms',
    title: 'SMS',
    description: 'Receive a verification code via text message',
    icon: 'message-text-outline',
  },
  {
    id: 'totp',
    title: 'Authenticator App',
    description: 'Use Google Authenticator or similar app',
    icon: 'shield-key-outline',
  },
];

interface VerifyChannelDrawerProps {
  visible: boolean;
  onClose: () => void;
  availableChannels: VerifyChannel[];
  /** Called when user confirms a channel. Receives the channel and the
   *  identifier to use for OTP (email address or phone number). */
  onConfirm: (channel: VerifyChannel, identifier: string) => Promise<void>;
  /** The identifier the user entered on the login screen */
  loginIdentifier: string;
  /** Full email from check-user response */
  email?: string;
  /** Full phone from check-user response */
  phoneNumber?: string;
}

const VerifyChannelDrawer: React.FC<VerifyChannelDrawerProps> = ({
  visible,
  onClose,
  availableChannels,
  onConfirm,
  loginIdentifier,
  email,
  phoneNumber,
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [selected, setSelected] = useState<VerifyChannel | null>(null);
  const [loading, setLoading] = useState(false);

  const options = ALL_CHANNEL_OPTIONS.filter((o) => availableChannels.includes(o.id));

  useEffect(() => {
    if (visible) {
      setSelected(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      // Resolve identifier for the selected channel
      let identifier = loginIdentifier;
      if (selected === 'email' && email) identifier = email;
      if (selected === 'sms' && phoneNumber) identifier = phoneNumber;
      await onConfirm(selected, identifier);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        <View style={styles.iconRow}>
          <View style={styles.iconBg}>
            <Icon name="shield-check-outline" size={28} color="#FA7272" />
          </View>
        </View>

        <Text style={styles.title}>Two-Factor Verification</Text>
        <Text style={styles.subtitle}>Choose how to verify your identity</Text>

        <View style={styles.optionList}>
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(opt.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <Icon name={opt.icon as any} size={22} color={isSelected ? '#FFF' : '#FA7272'} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, (!selected || loading) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmBtnText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionList: {
    gap: 10,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionSelected: {
    borderColor: '#FA7272',
    backgroundColor: '#FFF5F5',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconSelected: {
    backgroundColor: '#FA7272',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: '#FA7272',
  },
  optionDesc: {
    fontSize: 12,
    color: '#888',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FA7272',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FA7272',
  },
  confirmBtn: {
    backgroundColor: '#FA7272',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
});

export default VerifyChannelDrawer;
