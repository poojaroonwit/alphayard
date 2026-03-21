import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { styles } from './LoginScreen.styles';
import { ScreenBackground } from '../../components/ScreenBackground';
import { DynamicLogo, DynamicImage } from '../../components/DynamicImage';
import { useBranding } from '../../contexts/BrandingContext';
import { CountryPickerModal } from '../../components/CountryPickerModal';
import { Country } from '../../services/api/config';
import { ThemedButton } from '../../components/common/ThemedButton';
import VerifyChannelDrawer, { VerifyChannel } from '../../components/auth/VerifyChannelDrawer';


const colors = {
  primary: '#FA7272',
  inputPlaceholder: '#999999',
  textSecondary: '#666666',
};

// Map SSO provider names to MaterialCommunityIcons names
const getSSOProviderIcon = (providerName: string | undefined): string => {
  if (!providerName) return 'login';
  const iconMap: Record<string, string> = {
    google: 'google',
    facebook: 'facebook',
    apple: 'apple',
    github: 'github',
    microsoft: 'microsoft',
    twitter: 'twitter',
    x: 'twitter', // X uses Twitter icon
    linkedin: 'linkedin',
    discord: 'discord',
    slack: 'slack',
    line: 'message-text', // LINE uses message icon (closest available)
  };
  return iconMap[providerName.toLowerCase()] || 'login';
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { requestOtp, checkUserInfo, directLogin, loginWithSSO, isLoading, clearLoginError, ssoProviders, loadSSOProviders } = useAuth();
  const { logoUrl, flows } = useBranding();

  // Load SSO providers on mount if not already loaded
  useEffect(() => {
    if (ssoProviders.length === 0) {
      loadSSOProviders();
    }
  }, []);

  // State
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Separate states for persistence when switching
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [error, setError] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Channel selection drawer state
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [channelDrawerData, setChannelDrawerData] = useState<{
    availableChannels: VerifyChannel[];
    email?: string;
    phoneNumber?: string;
    identifier: string;
  } | null>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const cardScaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(cardScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNext = async () => {
    let finalIdentifier = '';

    if (loginMethod === 'email') {
      if (!emailInput.trim()) {
        setError('Please enter your email address');
        return;
      }
      finalIdentifier = emailInput.trim();
    } else {
      if (!phoneInput.trim()) {
        setError('Please enter your phone number');
        return;
      }
      finalIdentifier = `${selectedCountry.dial_code}${phoneInput.trim()}`;
    }

    setError('');
    setIsSubmitting(true);
    if (clearLoginError) clearLoginError();

    try {
      const userInfo: any = await checkUserInfo!(finalIdentifier);

      if (!userInfo.exists) {
        // User not registered — go to signup
        navigation.navigate('Signup', {
          email: loginMethod === 'email' ? finalIdentifier : undefined,
          phone: loginMethod === 'phone' ? finalIdentifier : undefined,
        });
        return;
      }

      if (userInfo.hasMfa && userInfo.availableChannels.length > 0) {
        // Show channel selection drawer
        setChannelDrawerData({
          availableChannels: userInfo.availableChannels,
          email: userInfo.email,
          phoneNumber: userInfo.phoneNumber,
          identifier: finalIdentifier,
        });
        setShowChannelDrawer(true);
        return;
      }

      // No MFA — log in directly without OTP
      await directLogin!(finalIdentifier);
      // AuthContext's directLogin calls syncAuthState which updates user + circles,
      // triggering the navigator to switch to the authenticated stack automatically.
    } catch (err: any) {
      console.error('[LOGIN] OTP request failed:', err);
      Alert.alert('Connection Issue', 'Unable to reach the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelConfirm = async (channel: VerifyChannel, identifier: string) => {
    setShowChannelDrawer(false);
    if (channel === 'totp') {
      navigation.navigate('TwoFactorVerify', {
        identifier,
        mode: 'login',
        channel: 'authenticator',
      });
      return;
    }
    const debugCode = await requestOtp(identifier);
    navigation.navigate('TwoFactorVerify', {
      identifier,
      mode: 'login',
      channel: channel as 'email' | 'sms',
      debugCode,
    });
  };

  const handleSSOLogin = async (provider: 'google' | 'facebook' | 'apple' | 'microsoft' | 'twitter' | 'x' | 'line' | string) => {
    try {
      await loginWithSSO(provider);
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      Alert.alert('Login Failed', error.message || `Failed to login with ${provider}.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenBackground screenId="login" style={styles.background}>


        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

              <View style={styles.logoHeader}>
                <View style={styles.logoContainer}>
                  {logoUrl ? (
                    <DynamicImage
                      source={{ uri: logoUrl }}
                      width={48}
                      height={48}
                      style={styles.logoIconWrapper}
                      resizeMode="contain"
                    />
                  ) : (
                    <DynamicLogo logoType="white" width={48} height={48} style={styles.logoIconWrapper} />
                  )}
                  <Text style={styles.logoText}>Boundary</Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.formCard}>
                  <View style={styles.formCardInner}>

                    <View style={styles.headerContainer}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Welcome</Text>
                      <Text style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Enter your email or phone to continue</Text>
                    </View>


                    {/* Identifier Input Section */}
                    <View style={[styles.inputContainer, { position: 'relative' }]}>
                      {/* Label and Toggle */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.inputLabel}>
                          {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setLoginMethod(prev => prev === 'email' ? 'phone' : 'email')}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ fontSize: 12, color: '#666', fontWeight: '500' }}>
                            Switch to {loginMethod === 'email' ? 'Phone' : 'Email'}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon
                              name={loginMethod === 'email' ? 'cellphone' : 'email-outline'}
                              size={16}
                              color="#666"
                            />
                            <Icon name="swap-horizontal" size={16} color="#999" />
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Inputs */}
                      {loginMethod === 'phone' ? (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {/* Country Code Selection */}
                          <TouchableOpacity
                            style={[
                              styles.inputWrapper,
                              { width: 90, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8 }
                            ]}
                            onPress={() => setShowCountryPicker(true)}
                          >
                            <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>{selectedCountry.dial_code}</Text>
                            <Icon name="chevron-down" size={16} color="#999" />
                          </TouchableOpacity>

                          {/* Phone Input */}
                          <View style={[styles.inputWrapper, { flex: 1 }, inputFocused && styles.inputWrapperFocused, error && styles.inputError ? { borderColor: 'red' } : {}]}>
                            <TextInput
                              style={styles.textInput}
                              placeholder="Phone Number"
                              placeholderTextColor={colors.inputPlaceholder}
                              value={phoneInput}
                              onChangeText={setPhoneInput}
                              onFocus={() => setInputFocused(true)}
                              onBlur={() => setInputFocused(false)}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="phone-pad"
                            />
                          </View>
                        </View>
                      ) : (
                        /* Email Input */
                        <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused, error && styles.inputError ? { borderColor: 'red' } : {}]}>
                          <TextInput
                            style={styles.textInput}
                            placeholder="name@example.com"
                            placeholderTextColor={colors.inputPlaceholder}
                            value={emailInput}
                            onChangeText={setEmailInput}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                          />
                        </View>
                      )}

                      {error ? <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
                    </View>

                    {/* Next Button */}
                    <ThemedButton
                      componentId="primary"
                      label={isLoading || isSubmitting ? "Loading..." : "Continue"}
                      onPress={handleNext}
                      isLoading={isLoading || isSubmitting}
                      disabled={isLoading || isSubmitting}
                      style={{ marginTop: 24, marginBottom: 24 }}
                    />

                    {/* Social Login Section */}
                    {flows?.login?.allowSocialLogin !== false && (
                      <View style={styles.socialSection}>
                        <Text style={styles.socialSectionText}>Or continue with</Text>
                        <View style={styles.socialButtons}>
                          {/* Dynamic SSO providers from backend */}
                          {ssoProviders.length > 0 ? (
                            ssoProviders.map((provider) => (
                              <TouchableOpacity
                                key={provider.id}
                                style={[styles.socialButton, { borderColor: provider.buttonColor || '#e5e5e5' }]}
                                onPress={() => handleSSOLogin((provider.providerName || provider.name) as any)}
                              >
                                <Icon
                                  name={getSSOProviderIcon(provider.providerName || provider.name)}
                                  size={24} 
                                  color={provider.buttonColor || '#333'} 
                                />
                              </TouchableOpacity>
                            ))
                          ) : (
                            // Fallback to default providers if none configured
                            <>
                              <TouchableOpacity style={[styles.socialButton, styles.googleButton]} onPress={() => handleSSOLogin('google')}>
                                <Icon name="google" size={24} color="#DB4437" />
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.socialButton, styles.facebookButton]} onPress={() => handleSSOLogin('facebook')}>
                                <Icon name="facebook" size={24} color="#1877F2" />
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={() => handleSSOLogin('apple')}>
                                <Icon name="apple" size={24} color="#000000" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    )}

                  </View>
                </View>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenBackground>

      {/* Country Picker Modal */}
      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={(country) => setSelectedCountry(country)}
        selectedCountryCode={selectedCountry.code}
      />

      {/* 2FA Channel Selection Drawer */}
      {channelDrawerData && (
        <VerifyChannelDrawer
          visible={showChannelDrawer}
          onClose={() => setShowChannelDrawer(false)}
          availableChannels={channelDrawerData.availableChannels}
          email={channelDrawerData.email}
          phoneNumber={channelDrawerData.phoneNumber}
          loginIdentifier={channelDrawerData.identifier}
          onConfirm={handleChannelConfirm}
        />
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;
