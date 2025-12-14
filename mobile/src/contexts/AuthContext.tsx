import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

// Conditional imports for optional dependencies
let GoogleSignin: any;
let LoginManager: any, AccessToken: any;
let appleAuth: any;

try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.warn('Google Sign-In not available:', error);
  GoogleSignin = null;
}

try {
  const fbModule = require('react-native-fbsdk-next');
  LoginManager = fbModule.LoginManager;
  AccessToken = fbModule.AccessToken;
} catch (error) {
  console.warn('Facebook SDK not available:', error);
}

// Apple Authentication is optional and not installed
appleAuth = null;

import { apiClient } from '../services/api/apiClient';
import { logger } from '../utils/logger';

// Use apiClient directly instead of the barrel export (fixes undefined api issue)
const api = apiClient;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  userType: 'hourse' | 'children' | 'seniors';
  subscriptionTier: 'free' | 'premium' | 'elite';
  familyIds: string[];
  isOnboardingComplete: boolean;
  preferences: {
    notifications: boolean;
    locationSharing: boolean;
    popupSettings: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      maxPerDay: number;
      categories: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  forceUpdate: number;
  login: (email: string, password: string) => Promise<void>;
  loginWithSSO: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
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
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  userType: 'hourse' | 'children' | 'seniors';
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
  const navigationRef = useRef<any>(null);

  console.log('🔧 AuthProvider - Initial state:', { user: !!user, isLoading, isOnboardingComplete, forceUpdate });

  // Initialize Google Sign-In only if available
  useEffect(() => {
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

  // Check for existing session on app start
  // Only run once on mount, and don't run if user is already set
  const hasCheckedAuthRef = useRef(false);
  useEffect(() => {
    if (!hasCheckedAuthRef.current && !user) {
      hasCheckedAuthRef.current = true;
      checkAuthState();
    }
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      console.log('[AUTH] Checking auth state...');

      // Check for existing tokens first
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log('[AUTH] Existing token found:', !!accessToken);

      // CRITICAL: If user is already set, don't clear it - just validate token
      if (user && accessToken) {
        console.log('[AUTH] User already set, skipping checkAuthState to prevent clearing');
        setIsLoading(false);
        return;
      }

      if (accessToken && !__DEV__) {
        // In production, try to validate token
        console.log('[AUTH] Production mode - validating token');
        // Add token validation logic here if needed
      }

      // Check if user has valid authentication
      if (accessToken) {
        try {
          // Try to validate the token by making a request to get user profile
          // Note: This endpoint might not exist, so we'll handle the error gracefully
          const response = await api.get('/auth/me').catch(() => null);
          const responseData = response as any;
          if (responseData && (responseData.user || responseData.data?.user)) {
            const userData = responseData.user || responseData.data?.user;
            setUser(userData);
            setIsOnboardingComplete(userData.isOnboardingComplete || false);
            console.log('[AUTH] Valid token found - user authenticated');
          } else {
            // If /auth/me doesn't exist or returns no user, don't clear tokens
            // Just log and keep the existing state
            console.log('[AUTH] /auth/me endpoint not available or no user data - keeping existing state');
            // Don't clear tokens - user might have just logged in
          }
        } catch (error: any) {
          // Token validation failed - but don't clear if it's just a 404
          console.log('[AUTH] Token validation failed:', error?.response?.status || error?.message);

          // Only clear tokens if it's an authentication error (401), not if endpoint doesn't exist (404)
          if (error?.response?.status === 401) {
            try {
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken');
              setUser(null);
              console.log('[AUTH] 401 Unauthorized - cleared tokens and user');
            } catch (clearError) {
              console.error('Failed to clear tokens:', clearError);
            }
          } else {
            console.log('[AUTH] Non-auth error (likely endpoint missing) - keeping tokens');
          }
        }
      } else {
        console.log('[AUTH] No token found - staying logged out');
      }

    } catch (error) {
      console.error('Auth state check failed:', error);
      console.log('❌ Auth state check failed - staying logged out');
    } finally {
      console.log('[AUTH] checkAuthState completed - setting loading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      // Handle both flat response (backend) and nested data (if wrapper changes)
      const responseData = response as any;
      const userData = responseData.user || responseData.data?.user;
      const accessToken = responseData.accessToken || responseData.token || responseData.data?.accessToken;
      const refreshToken = responseData.refreshToken || responseData.data?.refreshToken;

      // Backend returns `token` (access token) + `refreshToken`. Support both shapes.
      const resolvedAccessToken = accessToken;

      // Store tokens
      await AsyncStorage.multiSet([
        ['accessToken', resolvedAccessToken],
        ['refreshToken', refreshToken],
      ]);

      // Set token in API headers
      api.setAuthToken(resolvedAccessToken);

      // Transform user data to match our interface
      const transformedUser: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        avatar: userData.avatarUrl || userData.avatar,
        phone: userData.phoneNumber || userData.phone,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
        userType: 'hourse',
        subscriptionTier: 'free',
        familyIds: userData.families?.map((f: any) => f.id) || (userData.familyIds || []),
        isOnboardingComplete: userData.isOnboardingComplete ?? true,
        preferences: userData.preferences || {
          notifications: true,
          locationSharing: true,
          popupSettings: {
            enabled: true,
            frequency: 'daily',
            maxPerDay: 3,
            categories: ['announcement', 'promotion'],
          },
        },
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
      };

      // CRITICAL: Mark that we've logged in to prevent checkAuthState from interfering
      hasCheckedAuthRef.current = true;

      console.log('[AUTH] ✅ Login successful - setting user state');
      console.log('[AUTH] ✅ User object:', JSON.stringify(transformedUser, null, 2));
      console.log('[AUTH] ✅ User ID:', transformedUser.id);
      console.log('[AUTH] ✅ User email:', transformedUser.email);

      // CRITICAL: Set user state FIRST - this will make isAuthenticated true
      // Set all states together to minimize re-renders
      setUser(transformedUser);
      setIsOnboardingComplete(userData.isOnboardingComplete ?? true);
      setIsLoading(false);

      // Immediately force a re-render to ensure RootNavigator sees the change
      setForceUpdate(prev => {
        const newValue = prev + 1;
        console.log('[AUTH] Force update (immediate):', newValue);
        return newValue;
      });

      console.log('[AUTH] ✅✅✅ All states set - isAuthenticated should now be: true');
      console.log('[AUTH] ✅✅✅ Loading set to false, navigation should switch to AppNavigator');

      logger.info('User logged in successfully:', userData.email);

      // Force navigation reset if navigation ref is available
      setTimeout(() => {
        if (navigationRef.current?.isReady()) {
          console.log('[AUTH] Forcing navigation reset to App');
          try {
            navigationRef.current.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'App' }],
              })
            );
          } catch (error) {
            console.error('[AUTH] Error forcing navigation reset:', error);
          }
        }
      }, 100);
    } catch (error: any) {
      console.log('🔧 Login error caught:', error);
      console.log('🔧 Error type:', typeof error);
      console.log('🔧 Error response:', error?.response);
      console.log('🔧 Error response data:', error?.response?.data);
      console.log('🔧 Error message:', error?.message);
      logger.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const devBypassLogin = async () => {
    console.log('🔧 devBypassLogin called!');
    if (!__DEV__) {
      throw new Error('Development bypass is only available in development mode');
    }

    try {
      console.log('🔧 devBypassLogin - Creating mock user...');
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'dev@bondarys.com',
        firstName: 'Developer',
        lastName: 'User',
        avatar: 'https://via.placeholder.com/150',
        phone: '+1234567890',
        userType: 'hourse',
        subscriptionTier: 'premium',
        familyIds: ['dev-hourse-123'],
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

  const loginWithSSO = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setIsLoading(true);

      let ssoData: any = {};

      switch (provider) {
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
      }

      // Send SSO data to backend
      const response = await api.post('/auth/sso', {
        provider,
        ...ssoData,
      });

      const { user: userData, accessToken, refreshToken } = response.data;

      // Store tokens
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);

      // Set token in API headers
      api.setAuthToken(accessToken);

      setUser(userData);
      setIsOnboardingComplete(userData.isOnboardingComplete);

      logger.info('SSO login successful:', provider);
    } catch (error) {
      logger.error('SSO login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
        lastName: userInfo.user.familyName,
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
        lastName: fullName?.familyName,
      };
    } catch (error) {
      logger.error('Apple sign-in failed:', error);
      throw new Error('Apple sign-in failed');
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        throw new Error('Email, password, first name, and last name are required');
      }

      // Transform data to match backend expectations
      const backendData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phone, // Backend expects phoneNumber, not phone
        dateOfBirth: userData.dateOfBirth,
        // Include additional fields that might be expected
        ...(userData as any)
      };

      console.log('🔧 Signup data being sent:', JSON.stringify(backendData, null, 2));

      try {
        // API client returns response.data directly, not the full response object
        const responseData = await api.post('/auth/register', backendData);

        console.log('🔧 Signup response:', typeof responseData === 'string' ? responseData.substring(0, 200) : JSON.stringify(responseData, null, 2));
        console.log('🔧 Response type:', typeof responseData);

        // Check if response is HTML (Metro bundler or wrong endpoint)
        if (typeof responseData === 'string' && (responseData.trim().startsWith('<!DOCTYPE') || responseData.trim().startsWith('<html'))) {
          console.error('🔧 ERROR: Received HTML instead of JSON!');
          console.error('🔧 This means the backend is not running or using wrong port');
          const apiBaseURL = (api as any)?.defaults?.baseURL || (api as any)?.baseURL || 'unknown';
          console.error('🔧 Current API URL:', apiBaseURL);
          throw new Error('Backend server not found. Received HTML response instead of JSON. Please check if backend is running on port 3000.');
        }

        // Check if responseData exists
        if (!responseData) {
          console.error('🔧 ResponseData is falsy:', responseData);
          throw new Error('Invalid response from server: response is undefined or null');
        }

        // Check if responseData is an object (JSON)
        if (typeof responseData !== 'object' || Array.isArray(responseData)) {
          console.error('🔧 ResponseData is not an object:', typeof responseData, responseData);
          throw new Error('Invalid response format: expected JSON object');
        }

        // Handle different response structures
        const responseDataAny = responseData as any;
        const newUser = responseDataAny.user || responseDataAny.data?.user;
        const accessToken = responseDataAny.accessToken || responseDataAny.token;
        const refreshToken = responseDataAny.refreshToken;

        if (!newUser) {
          console.error('🔧 Response data structure:', JSON.stringify(responseData, null, 2));
          throw new Error('User data not found in response');
        }

        if (!accessToken) {
          throw new Error('Access token not found in response');
        }

        // Store tokens
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);

        // Set token in API headers
        api.setAuthToken(accessToken);

        // Transform user data to match our interface
        const transformedUser: User = {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          avatar: newUser.avatarUrl,
          phone: newUser.phoneNumber,
          dateOfBirth: newUser.dateOfBirth ? new Date(newUser.dateOfBirth) : undefined,
          userType: userData.userType,
          subscriptionTier: 'free',
          familyIds: [],
          isOnboardingComplete: newUser.isOnboardingComplete,
          preferences: newUser.preferences || {
            notifications: true,
            locationSharing: true,
            popupSettings: {
              enabled: true,
              frequency: 'daily',
              maxPerDay: 3,
              categories: ['announcement', 'promotion'],
            },
          },
          createdAt: new Date(newUser.createdAt),
          updatedAt: new Date(newUser.updatedAt),
        };

        setUser(transformedUser);
        setIsOnboardingComplete(newUser.isOnboardingComplete);

        logger.info('User signed up successfully:', newUser.email);
      } catch (innerError: any) {
        console.error('🔧 Inner signup error:', innerError);
        throw innerError;
      }
    } catch (error: any) {
      console.error('🔧 Signup error details:', error);
      console.error('🔧 Error type:', typeof error);
      console.error('🔧 Error message:', error?.message);
      console.error('🔧 Error code:', error?.code);
      console.error('🔧 Error details:', error?.details);
      console.error('🔧 Error response:', error?.response);
      console.error('🔧 Error response data:', error?.response?.data);

      // Extract more helpful error message
      let errorMessage = error?.message || 'Failed to create account. Please try again.';

      // If we have details, try to extract more info
      if (error?.details) {
        if (typeof error.details === 'string') {
          errorMessage = error.details;
        } else if (error.details?.message) {
          errorMessage = error.details.message;
        } else if (error.details?.error) {
          errorMessage = error.details.error;
        }
      }

      // Check for common backend errors
      if (error?.response?.data) {
        const responseData = error.response.data;
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      }

      // Create a more informative error - ensure we can spread safely
      const errorObj = (error && typeof error === 'object') ? error : {};
      const enhancedError = {
        ...errorObj,
        message: errorMessage,
        originalMessage: error?.message,
      };

      logger.error('Signup failed:', enhancedError);
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      logger.error('Logout API call failed:', error);
    } finally {
      // Clear local data
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      api.removeAuthToken();

      setUser(null);
      setIsOnboardingComplete(false);

      logger.info('User logged out');
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      // Update stored tokens
      await AsyncStorage.multiSet([
        ['accessToken', newAccessToken],
        ['refreshToken', newRefreshToken],
      ]);

      // Update API headers
      api.setAuthToken(newAccessToken);

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
      const response = await api.put('/auth/profile', updates);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      setIsOnboardingComplete(updatedUser.isOnboardingComplete);

      logger.info('User profile updated');
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      const response = await api.post('/auth/onboarding/complete');
      const updatedUser = response.data.user;

      setUser(updatedUser);
      setIsOnboardingComplete(true);

      logger.info('Onboarding completed');
    } catch (error) {
      logger.error('Onboarding completion failed:', error);
      throw error;
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
    devBypassLogin: __DEV__ ? devBypassLogin : undefined,
    _devSetUser: __DEV__ ? (user: User) => {
      console.log('🔧 _devSetUser called with:', user?.email);
      setUser(user);
      setForceUpdate(prev => prev + 1);
    } : undefined,
    _devSetOnboarding: __DEV__ ? (complete: boolean) => {
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
  };

  // Simple auth state logging
  if (__DEV__) {
    console.log('Auth state:', !!user ? 'authenticated' : 'not authenticated');
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


