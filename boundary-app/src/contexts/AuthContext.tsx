import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient } from '../services/api/apiClient';
import { logger } from '../utils/logger';
import { isDev } from '../utils/isDev';
import authService from '../services/auth/AuthService';
import { User, SignupData } from '../services/auth/AuthService.types';

// Conditional imports for optional dependencies
let GoogleSignin: any = null;
let LoginManager: any = null;
let AccessToken: any = null;
let appleAuth: any = null;

const initializeNativeModules = () => {
  if (Platform.OS === 'web') return;

  try {
    const googleModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleModule.GoogleSignin;
  } catch (error) {
    console.warn('Google Sign-In not available:', error);
  }

  try {
    const fbModule = require('react-native-fbsdk-next');
    LoginManager = fbModule.LoginManager;
    AccessToken = fbModule.AccessToken;
  } catch (error) {
    console.warn('Facebook SDK not available:', error);
  }
};

// Apple Authentication is optional and not installed
appleAuth = null;



// Use apiClient directly
const api = apiClient;

// SSO Provider from backend
interface SSOProvider {
  id: string;
  name: string;
  displayName: string;
  providerType: string;
  iconUrl?: string;
  buttonColor?: string;
  displayOrder: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  forceUpdate: number;
  login: (email: string, password: string) => Promise<void>;
  loginWithSSO: (provider: 'google' | 'facebook' | 'apple' | string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  devBypassLogin?: () => Promise<void>;
  // Direct dev functions
  _devSetUser?: (user: User) => void;
  _devSetOnboarding?: (complete: boolean) => void;
  // Navigation reference for forced navigation
  setNavigationRef?: (ref: any) => void;
  checkUserExists: (identifier: string) => Promise<boolean>;
  checkUserInfo: (identifier: string) => Promise<{ exists: boolean; isActive: boolean; hasMfa: boolean; availableChannels: Array<'email' | 'sms' | 'totp'>; email?: string; phoneNumber?: string }>;
  requestOtp: (identifier: string) => Promise<string | undefined>;
  loginWithOtp: (identifier: string, otp: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  loginError: string | null;
  clearLoginError: () => void;
  // Circles
  circles: any[];
  activeCircleId: string | null;
  setActiveCircleId: (id: string | null) => void;
  loadCircles: () => Promise<void>;
  // SSO Providers
  ssoProviders: SSOProvider[];
  loadSSOProviders: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  try {
    const context = useContext(AuthContext);
    if (!context) {
      console.error('useAuth must be used within an AuthProvider');
      // Return a fallback context to prevent crashes
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isOnboardingComplete: false,
        forceUpdate: 0,
        login: async () => { throw new Error('Auth context not available'); },
        loginWithSSO: async () => { throw new Error('Auth context not available'); },
        signup: async () => { throw new Error('Auth context not available'); },
        logout: async () => { throw new Error('Auth context not available'); },
        refreshToken: async () => { throw new Error('Auth context not available'); },
        updateUser: async () => { throw new Error('Auth context not available'); },
        completeOnboarding: async () => { throw new Error('Auth context not available'); },
        devBypassLogin: undefined,
        _devSetUser: undefined,
        _devSetOnboarding: undefined,
        setNavigationRef: undefined,
        loginError: null,
        clearLoginError: () => { },
        checkUserExists: async () => false,
        checkUserInfo: async () => ({ exists: false, isActive: false, hasMfa: false, availableChannels: [] }),
        requestOtp: async () => { },
        loginWithOtp: async () => { },
        ssoProviders: [],
        loadSSOProviders: async () => { },
      };
    }
    return context;
  } catch (error) {
    console.error('Error accessing auth context:', error);
    // Return a fallback context to prevent crashes
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboardingComplete: false,
      forceUpdate: 0,
      login: async () => { throw new Error('Auth context not available'); },
      loginWithSSO: async () => { throw new Error('Auth context not available'); },
      signup: async () => { throw new Error('Auth context not available'); },
      logout: async () => { throw new Error('Auth context not available'); },
      refreshToken: async () => { throw new Error('Auth context not available'); },
      updateUser: async () => { throw new Error('Auth context not available'); },
      completeOnboarding: async () => { throw new Error('Auth context not available'); },
      devBypassLogin: undefined,
      _devSetUser: undefined,
      _devSetOnboarding: undefined,
      setNavigationRef: undefined,
      loginError: null,
      clearLoginError: () => { },
      checkUserExists: async () => false,
      requestOtp: async () => { },
      loginWithOtp: async () => { },
      verifyEmail: async () => { },
      ssoProviders: [],
      loadSSOProviders: async () => { },
    };
  }
};

interface AuthProviderProps {
  children: ReactNode;
}



export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔧 AuthProvider rendering...');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [circles, setCircles] = useState<any[]>([]);
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
  const navigationRef = useRef<any>(null);

  const clearLoginError = () => setLoginError(null);

  console.log('🔧 AuthProvider - Initial state:', { user: !!user, isLoading, isOnboardingComplete, forceUpdate });

  // Initialize native modules on mount
  useEffect(() => {
    initializeNativeModules();
  }, []);

  // Initialize Google Sign-In only if available
  useEffect(() => {
    // Register unauthorized callback with apiClient
    // Register unauthorized callback with apiClient
    if (apiClient && apiClient.setOnLogout) {
      apiClient.setOnLogout(() => {
        console.log('[AUTH] 🛑 Received logout signal from API client');
        setUser(null);
      });
    }

    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (error) {
        console.warn('Failed to configure Google Sign-In:', error);
      }
    }
  }, []);

  // Load available SSO providers from backend
  const loadSSOProviders = async () => {
    try {
      console.log('[AUTH] Loading SSO providers...');
      const providers = await authService.loadSSOProviders();
      setSsoProviders(providers || []);
    } catch (error) {
      console.warn('[AUTH] Failed to load SSO providers:', error);
      setSsoProviders([]);
    }
  };

  // Check for existing session on app start
  // Only run once on mount, and don't run if user is already set
  const hasCheckedAuthRef = useRef(false);
  useEffect(() => {
    if (!hasCheckedAuthRef.current && !user) {
      hasCheckedAuthRef.current = true;
      checkAuthState();
      // Also load SSO providers on app start
      loadSSOProviders();
    }
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      console.log('[AUTH] Checking auth state...');
      
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser as any);
        setIsOnboardingComplete(currentUser.isOnboardingComplete || false);
        
        // Fetch circles
        const userCircles = await authService.getCircles();
        setCircles(userCircles);
        if (userCircles.length > 0) {
          const storedCircleId = await AsyncStorage.getItem('activeCircleId');
          setActiveCircleId(storedCircleId || userCircles[0].id);
        }
      }
    } catch (error) {
      console.error('[AUTH] Auth state check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setLoginError(null);

      console.log('[AUTH] Starting login for:', email);
      const { user: userData } = await authService.login({ email, password });

      if (!userData) {
        throw new Error('Invalid login response');
      }

      setUser(userData as any);
      setIsOnboardingComplete(userData.isOnboardingComplete || false);

      // Fetch circles
      const userCircles = await authService.getCircles();
      setCircles(userCircles);
      if (userCircles.length > 0) {
        setActiveCircleId(userCircles[0].id);
      }

      setIsLoading(false);
      setForceUpdate(prev => prev + 1);
      console.log('[AUTH] ✅ Login successful');
      logger.info('User logged in successfully:', userData?.email);
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
      throw error;
    }
  };

  const devBypassLogin = async () => {
    console.log('🔧 devBypassLogin called!');
    if (!isDev) {
      throw new Error('Development bypass is only available in development mode');
    }

    try {
      console.log('🔧 devBypassLogin - Creating mock user...');
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'dev@boundary.com',
        firstName: 'Developer',
        lastName: 'User',
        avatar: 'https://placehold.co/150',
        phone: '+1234567890',
        userType: 'Circle',
        subscriptionTier: 'premium',
        circleIds: ['dev-Circle-123'],
        isOnboardingComplete: true,
        preferences: {
          notifications: true,
          locationSharing: true,
          popupSettings: {
            enabled: true,
            frequency: 'daily',
            maxPerDay: 5,
            categories: ['news', 'entertainment', 'health'],
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set fake tokens to persist auth state
      console.log('🔧 devBypassLogin - Setting fake tokens...');
      await AsyncStorage.multiSet([
        ['accessToken', 'dev-access-token-bypass'],
        ['refreshToken', 'dev-refresh-token-bypass'],
      ]);
      api.setAuthToken('dev-access-token-bypass');

      console.log('🔧 devBypassLogin - Setting user state...');
      setUser(mockUser);
      console.log('🔧 devBypassLogin - Setting onboarding complete...');
      setIsOnboardingComplete(true);
      console.log('🔧 devBypassLogin - Setting loading to false...');
      setIsLoading(false);

      console.log('🔧 devBypassLogin - Force updating context...');
      // Force context update to ensure RootNavigator re-renders
      setForceUpdate(prev => {
        const newValue = prev + 1;
        console.log('🔧 devBypassLogin - forceUpdate from', prev, 'to', newValue);
        return newValue;
      });
      console.log('🔧 devBypassLogin - All state changes completed!');

      // Removed manual navigation reset as it conflicts with RootNavigator's state-based switching
    } catch (e) {
      console.error('🔧 devBypassLogin failed:', e);
      throw e;
    }
  };

  const loginWithSSO = async (provider: 'google' | 'facebook' | 'apple' | 'microsoft' | 'twitter' | 'x' | 'line' | string) => {
    try {
      setIsLoading(true);

      let ssoData: any = {};
      let normalizedProvider = provider.toLowerCase();
      
      // Normalize 'x' to 'twitter' for backend compatibility
      if (normalizedProvider === 'x') {
        normalizedProvider = 'twitter';
      }

      switch (normalizedProvider) {
        case 'google':
          if (!GoogleSignin) {
            throw new Error('Google Sign-In is not available in this environment');
          }
          ssoData = await handleGoogleSignIn();
          break;
        case 'facebook':
          if (!LoginManager || !AccessToken) {
            throw new Error('Facebook Sign-In is not available in this environment');
          }
          ssoData = await handleFacebookSignIn();
          break;
        case 'apple':
          if (!appleAuth) {
            throw new Error('Apple Sign-In is not available in this environment');
          }
          ssoData = await handleAppleSignIn();
          break;
        case 'microsoft':
          ssoData = await handleMicrosoftSignIn();
          break;
        case 'twitter':
          ssoData = await handleTwitterSignIn();
          break;
        case 'line':
          ssoData = await handleLineSignIn();
          break;
        default:
          // For custom/unknown providers, attempt a generic OAuth flow
          throw new Error(`SSO provider '${provider}' is not yet implemented on this platform`);
      }

      // Send SSO data to backend via AuthService
      const { user: userData } = await authService.socialLogin(normalizedProvider as any, ssoData);

      // Update state
      await syncAuthState(userData);
      logger.info('SSO login successful:', provider);
    } catch (error) {
      logger.error('SSO login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Microsoft Sign-In handler
  const handleMicrosoftSignIn = async () => {
    // Microsoft authentication using MSAL or web-based OAuth
    // For React Native, you would typically use @azure/msal-react-native
    // For now, we'll use a web-based OAuth flow on mobile web or throw for native
    if (Platform.OS === 'web') {
      // Web-based Microsoft OAuth flow would be handled here
      throw new Error('Microsoft Sign-In requires additional setup. Please configure MSAL.');
    }
    
    // For native apps, MSAL SDK should be integrated
    throw new Error('Microsoft Sign-In is not yet configured for this platform. Please install @azure/msal-react-native');
  };

  // Twitter/X Sign-In handler
  const handleTwitterSignIn = async () => {
    // Twitter OAuth 2.0 with PKCE
    // For React Native, you would typically use react-native-twitter-signin or expo-auth-session
    if (Platform.OS === 'web') {
      throw new Error('Twitter/X Sign-In requires additional setup. Please configure Twitter OAuth.');
    }
    
    throw new Error('Twitter/X Sign-In is not yet configured for this platform');
  };

  // LINE Sign-In handler
  const handleLineSignIn = async () => {
    // LINE Login SDK
    // For React Native, you would typically use @xmartlabs/react-native-line
    if (Platform.OS === 'web') {
      throw new Error('LINE Sign-In requires additional setup. Please configure LINE Login.');
    }
    
    throw new Error('LINE Sign-In is not yet configured for this platform. Please install @xmartlabs/react-native-line');
  };

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In not available');
    }

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      return {
        idToken: userInfo.idToken,
        accessToken: userInfo.accessToken,
        email: userInfo.user.email,
        firstName: userInfo.user.givenName,
        lastName: userInfo.user.circleName,
        avatar: userInfo.user.photo,
      };
    } catch (error) {
      logger.error('Google sign-in failed:', error);
      throw new Error('Google sign-in failed');
    }
  };

  const handleFacebookSignIn = async () => {
    if (!LoginManager || !AccessToken) {
      throw new Error('Facebook Sign-In not available');
    }

    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('Facebook sign-in was cancelled');
      }

      const data = await AccessToken.getCurrentAccessToken();

      return {
        accessToken: data.accessToken,
        userId: data.userID,
      };
    } catch (error) {
      logger.error('Facebook sign-in failed:', error);
      throw new Error('Facebook sign-in failed');
    }
  };

  const handleAppleSignIn = async () => {
    if (!appleAuth) {
      throw new Error('Apple Authentication not available');
    }

    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken, authorizationCode, fullName } = appleAuthRequestResponse;

      if (!identityToken) {
        throw new Error('Apple sign-in failed: No identity token');
      }

      return {
        identityToken,
        authorizationCode,
        email: fullName?.emailAddress,
        firstName: fullName?.givenName,
        lastName: fullName?.circleName,
      };
    } catch (error) {
      logger.error('Apple sign-in failed:', error);
      throw new Error('Apple sign-in failed');
    }
  };

  const syncAuthState = async (userData: any) => {
    setUser(userData as any);
    setIsOnboardingComplete(userData.isOnboardingComplete || false);
    
    // Fetch circles
    try {
      const userCircles = await authService.getCircles();
      setCircles(userCircles);
      if (userCircles.length > 0) {
        const storedCircleId = await AsyncStorage.getItem('activeCircleId');
        setActiveCircleId(storedCircleId || userCircles[0].id);
      }
    } catch (e) {
      console.warn('[AUTH] Failed to fetch circles during sync:', e);
    }
    
    setForceUpdate(prev => prev + 1);
  };

  const signup = async (userData: SignupData) => {
    try {
      setIsLoading(true);
      setLoginError(null);

      // Map SignupData to RegisterData for AuthService
      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        // userType and dateOfBirth can be added to profile after signup or if supported by register
      };

      const { user: newUser } = await authService.register(registerData);
      
      // If backend requires additional profile data (like userType)
      if (userData.userType || userData.dateOfBirth) {
        await authService.updateProfile({
          userType: userData.userType,
          dateOfBirth: userData.dateOfBirth
        });
      }

      await syncAuthState(newUser);
      logger.info('User signed up successfully');
    } catch (error: any) {
      setLoginError(error.message || 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsOnboardingComplete(false);
      setCircles([]);
      setActiveCircleId(null);
      logger.info('User logged out');
    }
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      logger.info('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      console.log('[AUTH] Updating user profile...', updates);
      const updatedUser = await authService.updateProfile(updates);
      if (updatedUser) {
        setUser(updatedUser as any);
        setIsOnboardingComplete(updatedUser.isOnboardingComplete || false);
        logger.info('User profile updated');
      }
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('[AUTH] Completing onboarding...');
      // AppKit might not have a specific 'complete onboarding' but we can update profile
      const updatedUser = await authService.updateProfile({ isOnboardingComplete: true });
      if (updatedUser) {
        setUser(updatedUser as any);
        setIsOnboardingComplete(true);
        logger.info('Onboarding completed');
      }
    } catch (error) {
      logger.error('Onboarding completion failed:', error);
      throw error;
    }
  };

  const checkUserExists = async (identifier: string): Promise<boolean> => {
    return authService.checkUserExists(identifier);
  };

  const checkUserInfo = async (identifier: string) => {
    return authService.checkUserInfo(identifier);
  };

  const requestOtp = async (identifier: string): Promise<string | undefined> => {
    return authService.requestOtp(identifier);
  };

  const loginWithOtp = async (identifier: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      setLoginError(null);
      const { user: userData } = await authService.loginWithOtp(identifier, otp);
      setUser(userData as any);
      setIsOnboardingComplete(userData.isOnboardingComplete || false);
      logger.info('User logged in via OTP successfully');
    } catch (error: any) {
      setLoginError(error.message || 'OTP login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { user: userData } = await authService.verifyEmail(email, code);
      setUser(userData as any);
      setIsOnboardingComplete(userData.isOnboardingComplete || false);
    } finally {
      setIsLoading(false);
    }
  };

  // Create fresh context value for each render to ensure updates propagate
  console.log('🔧 Creating context value - user:', !!user, 'isAuthenticated:', !!user, 'forceUpdate:', forceUpdate);
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isOnboardingComplete,
    forceUpdate,
    login,
    loginWithSSO,
    signup,
    logout,
    refreshToken,
    updateUser,
    completeOnboarding,
    devBypassLogin: isDev ? devBypassLogin : undefined,
    _devSetUser: isDev ? (user: User) => {
      console.log('🔧 _devSetUser called with:', user?.email);
      setUser(user);
      setForceUpdate(prev => prev + 1);
    } : undefined,
    _devSetOnboarding: isDev ? (complete: boolean) => {
      console.log('🔧 _devSetOnboarding called with:', complete);
      setIsOnboardingComplete(complete);
      setForceUpdate(prev => prev + 1);
    } : undefined,
    setNavigationRef: (ref: any) => {
      console.log('🔧 Setting navigation ref:', !!ref);
      console.log('🔧 Navigation ref object:', ref);
      navigationRef.current = ref;
      console.log('🔧 Navigation ref set to:', !!navigationRef.current);
    },
    loginError,
    clearLoginError,
    checkUserExists,
    checkUserInfo,
    requestOtp,
    loginWithOtp,
    verifyEmail,
    ssoProviders,
    loadSSOProviders,
    circles,
    activeCircleId,
    setActiveCircleId,
    loadCircles: async () => {
      const userCircles = await authService.getCircles();
      setCircles(userCircles);
    }
  };

  // Simple auth state logging
  if (isDev) {
    console.log('Auth state:', !!user ? 'authenticated' : 'not authenticated');
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

