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


const colors = {
  primary: '#FA7272',
  inputPlaceholder: '#999999',
  textSecondary: '#666666',
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { checkUserExists, requestOtp, loginWithSSO, isLoading, clearLoginError } = useAuth();
  const { logoUrl, flows } = useBranding();

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
      // Combine dial code and phone number (strip leading 0 if present usually, but basic concat for now)
      finalIdentifier = `${selectedCountry.dial_code}${phoneInput.trim()}`;
    }

    setError('');
    setIsSubmitting(true);
    if (clearLoginError) clearLoginError();

    try {
      // 1. Check if user exists
      console.log('[LOGIN] Checking existence for:', finalIdentifier);
      const exists = await checkUserExists(finalIdentifier);
      console.log('[LOGIN] User exists:', exists);

      // 2. Request OTP and Navigate to Verification
      console.log('[LOGIN] Requesting OTP for:', finalIdentifier);
      try {
        await requestOtp(finalIdentifier);
        // Navigate with appropriate mode based on existence
        navigation.navigate('TwoFactorMethod', { 
          identifier: finalIdentifier, 
          mode: exists ? 'login' : 'signup' 
        });
      } catch (otpErr: any) {
        console.error('[LOGIN] OTP request failed:', otpErr);
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      console.error('Login flow error:', err);
      // Determine if it's a "User not found" (which shouldn't happen here as checkUserExists should return false)
      // or a real connection error
      Alert.alert('Connection Issue', 'Unable to reach the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSOLogin = async (provider: 'google' | 'facebook' | 'apple') => {
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
                  <Text style={styles.logoText}>Bondarys</Text>
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
                          <TouchableOpacity style={[styles.socialButton, styles.facebookButton]} onPress={() => handleSSOLogin('facebook')}>
                            <Icon name="facebook" size={24} color="#1877F2" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.socialButton, styles.twitterButton]} onPress={() => handleSSOLogin('google')}>
                            <Icon name="twitter" size={24} color="#1DA1F2" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.socialButton, styles.googleButton]} onPress={() => handleSSOLogin('google')}>
                            <Icon name="google" size={24} color="#DB4437" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={() => handleSSOLogin('apple')}>
                            <Icon name="apple" size={24} color="#000000" />
                          </TouchableOpacity>
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
    </SafeAreaView>
  );
};

export default LoginScreen;