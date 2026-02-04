import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { Platform } from 'react-native';
import { apiClient } from '../services/api/apiClient';
import { logger } from '../utils/logger';
import { isDev } from '../utils/isDev';
import axios from 'axios';

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



// Create a fallback axios instance in case apiClient fails to load
const fallbackApi = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Use apiClient if available, otherwise use fallback
const api = apiClient || {
  post: (url: string, data: any) => fallbackApi.post(url, data).then(r => r.data),
  get: (url: string) => fallbackApi.get(url).then(r => r.data),
  put: (url: string, data: any) => fallbackApi.put(url, data).then(r => r.data),
  setAuthToken: (token: string) => { fallbackApi.defaults.headers.common.Authorization = `Bearer ${token}`; },
  removeAuthToken: () => { delete fallbackApi.defaults.headers.common.Authorization; }
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  userType: 'Circle' | 'children' | 'seniors' | 'workplace';
  subscriptionTier: 'free' | 'premium' | 'elite';
  circleIds: string[];
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
  checkUserExists: (identifier: string) => Promise<boolean>;
  requestOtp: (identifier: string) => Promise<void>;
  loginWithOtp: (identifier: string, otp: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  loginError: string | null;
  clearLoginError: () => void;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  userType: 'Circle' | 'children' | 'seniors' | 'workplace';
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
        requestOtp: async () => { },
        loginWithOtp: async () => { },
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
    };
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

const parseUserDates = (userData: any): User => {
  if (!userData) return userData;
  
  // Consolidate property mapping
  const id = userData.id || userData._id;
  const email = userData.email || userData.emailAddress;
  
  if (!id || !email) {
    console.warn('[AUTH] parseUserDates - Missing id or email!', { id, email, keys: Object.keys(userData) });
  }

  return {
    ...userData,
    id,
    email,
    firstName: userData.firstName || userData.first_name || '',
    lastName: userData.lastName || userData.last_name || '',
    avatar: userData.avatar || userData.avatar_url,
    isOnboardingComplete: !!(userData.isOnboardingComplete ?? userData.is_onboarding_complete),
    dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
    createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
    updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔧 AuthProvider rendering...');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
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

      // Check if user has valid authentication
      if (accessToken) {
        // First, try to restore user from local storage (fast path)
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = parseUserDates(JSON.parse(storedUser));
            console.log('[AUTH] Restored user from storage:', userData.email);
            setUser(userData);
            setIsOnboardingComplete(userData.isOnboardingComplete || false);

            // Optionally validate token in background (non-blocking)
            api.get('/auth/me').then((response: any) => {
              const freshUserData = response?.user || response?.data?.user;
              if (freshUserData) {
                const parsedUser = parseUserDates(freshUserData);
                setUser(parsedUser);
                AsyncStorage.setItem('user', JSON.stringify(parsedUser));
                console.log('[AUTH] User data refreshed from server');
              }
            }).catch(async (err: any) => {
              console.log('[AUTH] Background refresh failed');
              // If 401, it means our token is stale despite having user data
              if (err?.response?.status === 401) {
                console.log('[AUTH] Token invalid (401) during background check - attempting refresh');
                try {
                  // Attempt to refresh the token
                  await refreshToken();
                } catch (refreshErr) {
                  console.log('[AUTH] Refresh failed during background check - session will be cleared by refreshToken');
                }
              } else {
                console.log('[AUTH] Non-critical background error, using cached data');
              }
            });

            return; // Session restored successfully
          } catch (parseError) {
            console.log('[AUTH] Failed to parse stored user, clearing...');
            await AsyncStorage.removeItem('user');
          }
        }

        // No stored user, try to fetch from API
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 3000)
          );
          const response = await Promise.race([
            api.get('/auth/me'),
            timeoutPromise
          ]).catch(() => null);
          const responseData = response as any;
          if (responseData && (responseData.user || responseData.data?.user)) {
            const userData = parseUserDates(responseData.user || responseData.data?.user);
            setUser(userData);
            setIsOnboardingComplete(userData.isOnboardingComplete || false);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            console.log('[AUTH] Valid token found - user authenticated and cached');
          } else {
            console.log('[AUTH] /auth/me not available or no user data');
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
      setLoginError(null); // Clear any previous error

      console.log('[AUTH] Starting login for:', email);
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      // Handle both flat response (backend) and nested data (if wrapper changes)
      const responseData = response as any;
      const userData = responseData.user || responseData.data?.user;
      const accessToken = responseData.accessToken || responseData.data?.accessToken;
      const refreshToken = responseData.refreshToken || responseData.data?.refreshToken;

      if (!userData || !accessToken) {
        throw new Error('Invalid login response from server');
      }

      setIsOnboardingComplete(userData.isOnboardingComplete ?? true);

      // Store auth data
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(userData)],
      ]);

      api.setAuthToken(accessToken);
      setUser(userData);

      console.log('[AUTH] User data and tokens stored in AsyncStorage');

      setIsLoading(false);

      // Immediately force a re-render to ensure RootNavigator sees the change
      setForceUpdate(prev => {
        const newValue = prev + 1;
        console.log('[AUTH] Force update (immediate):', newValue);
        return newValue;
      });

      console.log('[AUTH] ✅✅✅ All states set - isAuthenticated should now be: true');
      console.log('[AUTH] ✅✅✅ Loading set to false, navigation should switch to AppNavigator');

      logger.info('User logged in successfully:', userData?.email);

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

      // CRITICAL: Set loading to false FIRST to ensure spinner stops immediately
      setIsLoading(false);

      // Wrap error formatting in try-catch to prevent secondary errors
      try {
        console.log('🔧 Error response:', error?.response);
        console.log('🔧 Error response data:', error?.response?.data);
        console.log('🔧 Error message:', error?.message);
      } catch (formatError) {
        console.error('🔧 Error formatting login error:', formatError);
      }
      logger.error('Login failed:', error);

      // Extract user-friendly error message
      const errorMessage = error.message || error.error || 'Login failed. Please check your credentials.';
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
        email: 'dev@bondarys.com',
        firstName: 'Developer',
        lastName: 'User',
        avatar: 'https://via.placeholder.com/150',
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

  const signup = async (userData: SignupData) => {
    try {
      // setIsLoading(true); // Removed to prevent RootNavigator from unmounting AuthNavigator

      // Validate required fields (Allow either email or phone)
      if ((!userData.email && !userData.phone) || !userData.password || !userData.firstName || !userData.lastName) {
        throw new Error('An identifier (email or phone), password, first name, and last name are required');
      }

      // Transform data to match backend expectations
      const backendData = {
        ...userData,
        email: userData.email || `${userData.phone}@bondarys.local`, // Fallback for backend email requirement
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        phoneNumber: userData.phone, // Backend sometimes expects phoneNumber
        dateOfBirth: userData.dateOfBirth,
      };

      console.log('🔧 Signup data being sent:', JSON.stringify(backendData, null, 2));

      try {
        // API client returns response.data directly, not the full response object
        const responseData = await api.post('/auth/register', backendData) as any;

        console.log('🔧 Signup initiated:', responseData);

        // Response should just be success message now
        if (!responseData.success) {
          throw new Error(responseData.message || 'Signup failed');
        }

        // New flow: Backend returns tokens for immediate login
        const { user, accessToken } = responseData;

        if (user && accessToken) {
          console.log('🔧 Signup successful - Setting up immediate session');
          await handleAuthResponse(responseData);
          console.log('🔧 Immediate session set - RootNavigator should now switch');
        } else {
          console.warn('🔧 Signup successful but tokens not found - check backend response');
        }

      } catch (innerError: any) {
        console.error('🔧 Inner signup error:', innerError);
        throw innerError;
      }
    } catch (error: any) {
      // Extremely defensive logging to find the exact crash point
      console.log('🔧 [DEBUG] Signup catch block entered');
      try {
        console.error('🔧 Signup error summary:', {
          type: typeof error,
          message: error?.message,
          code: error?.code,
          hasResponse: !!error?.response,
          hasDetails: !!error?.details
        });
      } catch (e) {
        console.error('🔧 Failed to log error summary safely');
      }

      // Extract helpful error message with total safety
      let errorMessage = 'Failed to create account. Please try again.';

      try {
        if (error && typeof error === 'object') {
          // Use a sequence of fallback attempts, each guarded
          errorMessage = error.message || errorMessage;

          // Try to get message from details (ApiClient format)
          if (error.details) {
            if (typeof error.details === 'string') {
              errorMessage = error.details;
            } else if (typeof error.details === 'object') {
              errorMessage = error.details.message || error.details.error || errorMessage;
            }
          }

          // Try to get message from response (Axios format)
          const responseData = error.response?.data;
          if (responseData) {
            if (typeof responseData === 'string') {
              errorMessage = responseData;
            } else if (typeof responseData === 'object' && responseData !== null) {
              errorMessage = responseData.message || responseData.error || errorMessage;
            }
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      } catch (extractionError) {
        console.error('🔧 Error during message extraction:', extractionError);
      }

      // Create a clean error object to throw
      const enhancedError = new Error(String(errorMessage));
      try {
        (enhancedError as any).originalError = error;
        (enhancedError as any).code = error?.code;
      } catch (e) { }

      // Log only the message string to avoids issues with complex objects in loggers
      if (typeof logger !== 'undefined' && logger.error) {
        try {
          logger.error('Signup failed:', String(errorMessage));
        } catch (e) {
          console.error('Logger failed:', e);
        }
      } else {
        console.error('Signup failed:', errorMessage);
      }

      throw enhancedError;
    } finally {
      // setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      if (logger && logger.error) {
        logger.error('Logout API call failed:', error);
      } else {
        console.error('Logout API call failed:', error);
      }
    } finally {
      // Clear local data
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      api.removeAuthToken();

      setUser(null);
      setIsOnboardingComplete(false);

      if (logger && logger.info) {
        logger.info('User logged out');
      } else {
        console.log('[AUTH] User logged out');
      }
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
      console.log('[AUTH] Updating user profile...', updates);
      const response = await api.put('/auth/profile', updates) as any;
      
      // Handle various response structures defensively
      const userData = response.user || response.data?.user || (response.data && response.data.data?.user);
      
      if (!userData) {
        console.warn('[AUTH] updateUser - No user data returned from profile update');
        return;
      }

      const transformedUser = parseUserDates(userData);
      
      // Ensure we don't clear critical fields if missing from update response
      // parseUserDates already handles mapping, so we just set state
      console.log('[AUTH] User profile updated successfully:', transformedUser.email);
      setUser(transformedUser);
      setIsOnboardingComplete(transformedUser.isOnboardingComplete);
      
      await AsyncStorage.setItem('user', JSON.stringify(transformedUser));
      
      setForceUpdate(prev => prev + 1);
      logger.info('User profile updated');
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('[AUTH] Completing onboarding...');
      const response = await api.post('/auth/onboarding/complete') as any;
      
      // Handle various response structures defensively
      const userData = response.user || response.data?.user;
      
      if (!userData) {
        console.error('[AUTH] completeOnboarding - CRITICAL: No user data returned!');
        // Fallback: If we know it succeeded but user is missing, at least update state if we have current user
        if (user) {
          const updatedUser = { ...user, isOnboardingComplete: true };
          setUser(updatedUser);
          setIsOnboardingComplete(true);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          setForceUpdate(prev => prev + 1);
        }
        return;
      }

      const transformedUser = parseUserDates(userData);
      // Ensure onboarding is marked complete
      transformedUser.isOnboardingComplete = true;

      console.log('[AUTH] Onboarding completed successfully for:', transformedUser.email);
      
      // Update state atomically where possible
      setUser(transformedUser);
      setIsOnboardingComplete(true);
      
      await AsyncStorage.setItem('user', JSON.stringify(transformedUser));
      
      setForceUpdate(prev => prev + 1);
      logger.info('Onboarding completed');

      // Note: Removed manual navigation reset as RootNavigator now handles the state switch more gracefully.


    } catch (error) {
      logger.error('Onboarding completion failed:', error);
      throw error;
    }
  };

  const checkUserExists = async (identifier: string): Promise<boolean> => {
    try {
      const isEmail = identifier.includes('@');
      console.log('[AuthContext] checkUserExists called with:', identifier, 'isEmail:', isEmail);
      const response = await api.post('/auth/check-user', {
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      }) as any;
      console.log('[AuthContext] checkUserExists response:', JSON.stringify(response));
      return response.exists;
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      };
      console.error('[AuthContext] checkUserExists failed:', errorDetails);
      const msg = `Login Debug Error:\n${JSON.stringify(errorDetails, null, 2)}`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        // Alert.alert('Login Debug Error', msg);
      }
      throw error;
    }
  };

  const requestOtp = async (identifier: string): Promise<void> => {
    try {
      // setIsLoading(true);
      const isEmail = identifier.includes('@');
      await api.post('/auth/otp/request', {
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      });
    } catch (error: any) {
      console.error('Request OTP failed:', error);
      throw error;
    } finally {
      // setIsLoading(false);
    }
  };

  // Helper to handle successful auth response
  const handleAuthResponse = async (data: any) => {
    console.log('[AUTH] handleAuthResponse - Raw data received:', {
      hasUser: !!data.user,
      hasDataUser: !!data.data?.user,
      hasAccessToken: !!data.accessToken,
      hasRefreshToken: !!data.refreshToken,
      keys: Object.keys(data)
    });

    const userData = data.user || data.data?.user;
    const accessToken = data.accessToken || data.data?.accessToken;
    const refreshToken = data.refreshToken || data.data?.refreshToken;

    if (!userData || !accessToken) {
      console.error('[AUTH] handleAuthResponse - CRITICAL: Missing user or token!', { 
        hasUser: !!userData, 
        hasToken: !!accessToken 
      });
      return;
    }

    console.log('[AUTH] handleAuthResponse - User keys:', Object.keys(userData));

    // Store tokens
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);

    // Set token in API headers
    api.setAuthToken(accessToken);

    // Use parseUserDates for robust transformation
    const transformedUser = parseUserDates(userData);
    
    console.log('[AUTH] handleAuthResponse - Setting user state:', transformedUser.email);
    setUser(transformedUser);
    setIsOnboardingComplete(transformedUser.isOnboardingComplete);
    
    await AsyncStorage.setItem('user', JSON.stringify(transformedUser));

    setForceUpdate(prev => {
      console.log('[AUTH] handleAuthResponse - forceUpdate from', prev, 'to', prev + 1);
      return prev + 1;
    });
  };

  const loginWithOtp = async (identifier: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      setLoginError(null);

      const isEmail = identifier.includes('@');
      const response = await api.post('/auth/otp/login', {
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
        otp
      });

      console.log('[AUTH] loginWithOtp success. Calling handleAuthResponse...');
      await handleAuthResponse(response);
      logger.info('User logged in via OTP successfully');

      // FORCE NAVIGATION RESET
      // Sometimes RootNavigator's automatic state detection is delayed
      // This ensures the UI moves forward immediately
      console.log('[AUTH] Forcing navigation reset to App');
      setTimeout(() => {
        try {
          const navigation = navigationRef.current;
          if (navigation) {
            console.log('[AUTH] Navigation ref found, resetting to App');
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'App' }],
              })
            );
          } else {
            console.log('[AUTH] Navigation ref NOT FOUND for reset');
          }
        } catch (err) {
          console.error('[AUTH] Reset navigation failed:', err);
        }
      }, 500);

    } catch (error: any) {
      console.error('Login with OTP failed:', error);
      setLoginError(error.message || 'Invalid OTP');
      throw error;
    } finally {
      console.log('[AUTH] loginWithOtp finally - setting isLoading false');
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/verify-email', { email, code });
      await handleAuthResponse(response);
      logger.info('Email verified successfully');
    } catch (error: any) {
      console.error('Verify email failed:', error);
      throw error;
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
    requestOtp,
    loginWithOtp,
    verifyEmail,
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



