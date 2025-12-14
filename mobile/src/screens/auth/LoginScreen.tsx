import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { styles } from './LoginScreen.styles';
import { DynamicBackground } from '../../components/DynamicBackground';
import { DynamicLogo } from '../../components/DynamicImage';
import { useLoginBackground } from '../../hooks/useAppConfig';

// Import colors for inline styles
const colors = {
  primary: '#FA7272',
  inputPlaceholder: '#999999',
  textSecondary: '#666666',
};

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, loginWithSSO, isLoading, isAuthenticated, user } = useAuth();

  // Get dynamic background from CMS
  const { background, loading: backgroundLoading } = useLoginBackground();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const cardScaleAnim = React.useRef(new Animated.Value(0.95)).current;

  // Monitor authentication state changes
  useEffect(() => {
    console.log('[LoginScreen] Auth state changed - isAuthenticated:', isAuthenticated, 'user:', !!user);
    if (isAuthenticated && user) {
      console.log('[LoginScreen] User is authenticated, should navigate to main app');
    }
  }, [isAuthenticated, user]);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleEmailChange = (text: string) => {
    console.log('Email input changed:', text);
    setFormData(prev => ({ ...prev, email: text }));
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setFormData(prev => ({ ...prev, password: text }));
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setApiError(null);
      setErrors({}); // Clear previous errors
      await login(formData.email, formData.password);
    } catch (error: any) {
      console.error('Login error:', error);

      // Extract error message from ApiError object or fallback to default
      let errorMessage = 'Invalid email or password. Please try again.';

      // Handle ApiError structure (from apiClient)
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      // Always display error in UI - show both banner and field-specific errors
      setApiError(errorMessage);

      // Set specific field errors based on error message
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('password') || lowerMessage.includes('incorrect password') || lowerMessage.includes('incorrect')) {
        setErrors(prev => ({ ...prev, password: errorMessage }));
      }
      if (lowerMessage.includes('email') || lowerMessage.includes('user not found') || lowerMessage.includes('incorrect')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }

      // If it's a general authentication error, show it on both fields
      if (error?.code === 'UNAUTHORIZED' || lowerMessage.includes('incorrect')) {
        setErrors(prev => ({
          ...prev,
          email: errorMessage,
          password: errorMessage,
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSOLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      await loginWithSSO(provider);
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      Alert.alert(
        'Login Failed',
        error.message || `Failed to login with ${provider}. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <DynamicBackground
        background={background}
        loading={backgroundLoading}
        style={styles.background}
      >
        {/* Subtle overlay for depth - only if image background */}
        {background?.type === 'image' && background?.overlay_opacity === undefined && (
          <View style={styles.backgroundOverlay} />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* App Logo and Name - Outside Card */}
              <View style={styles.logoHeader}>
                <View style={styles.logoContainer}>
                  <DynamicLogo
                    logoType="white"
                    width={48}
                    height={48}
                    style={styles.logoIconWrapper}
                  />
                  <Text style={styles.logoText}>Bondarys</Text>
                </View>
              </View>

              {/* Login Form */}
              <View style={styles.formContainer}>
                <View style={styles.formCard}>
                  <View style={styles.formCardInner}>
                    {/* Header with Back Button */}
                    <View style={styles.formHeader}>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Icon name="arrow-left" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      <View style={styles.backButtonPlaceholder} />
                    </View>

                    {/* General API Error Banner */}
                    {apiError && (
                      <View style={styles.apiErrorBanner}>
                        <Icon name="alert-circle" size={20} color="#FF4757" style={styles.apiErrorIcon} />
                        <Text style={styles.apiErrorText}>{apiError}</Text>
                      </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          emailFocused && styles.inputWrapperFocused,
                          errors.email && styles.inputError
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter Email"
                          placeholderTextColor={colors.inputPlaceholder}
                          value={formData.email}
                          onChangeText={handleEmailChange}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="email"
                          underlineColorAndroid="transparent"
                          testID="email-input"
                        />
                      </View>
                      {errors.email && (
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>{errors.email}</Text>
                        </View>
                      )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          passwordFocused && styles.inputWrapperFocused,
                          errors.password && styles.inputError
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter Password"
                          placeholderTextColor={colors.inputPlaceholder}
                          value={formData.password}
                          onChangeText={handlePasswordChange}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          underlineColorAndroid="transparent"
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() => setShowPassword(!showPassword)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icon
                            name={showPassword ? "eye-off" : "eye"}
                            size={20}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.password && (
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>{errors.password}</Text>
                        </View>
                      )}
                    </View>

                    {/* Remember Me and Forgot Password */}
                    <View style={styles.rememberForgotContainer}>
                      <TouchableOpacity
                        style={styles.rememberMeContainer}
                        onPress={() => setRememberMe(!rememberMe)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                          {rememberMe && (
                            <Icon name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.rememberMeText}>Remember me</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleForgotPassword}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (isLoading || isSubmitting) && styles.loginButtonDisabled
                      ]}
                      onPress={handleLogin}
                      disabled={isLoading || isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isLoading || isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign in</Text>
                      )}
                    </TouchableOpacity>

                    {/* Social Login Section */}
                    <View style={styles.socialSection}>
                      <Text style={styles.socialSectionText}>Sign in with</Text>
                      <View style={styles.socialButtons}>
                        <TouchableOpacity
                          style={[styles.socialButton, styles.facebookButton]}
                          onPress={() => handleSSOLogin('facebook')}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <Icon name="facebook" size={24} color="#1877F2" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.socialButton, styles.twitterButton]}
                          onPress={() => handleSSOLogin('google')}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <Icon name="twitter" size={24} color="#1DA1F2" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.socialButton, styles.googleButton]}
                          onPress={() => handleSSOLogin('google')}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <Icon name="google" size={24} color="#DB4437" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.socialButton, styles.appleButton]}
                          onPress={() => handleSSOLogin('apple')}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <Icon name="apple" size={24} color="#000000" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sign Up Link */}
                    <View style={styles.signupContainer}>
                      <Text style={styles.signupText}>Don't have an account? </Text>
                      <TouchableOpacity onPress={handleSignup} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                        <Text style={styles.signupLink}>Sign up</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </DynamicBackground>
    </SafeAreaView>
  );
};


export default LoginScreen;