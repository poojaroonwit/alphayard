import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import authService, { User, LoginData, RegisterData } from '../services/auth/AuthService';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const user = await authService.getCurrentUser();
      setState({
        user: user || null,
        loading: false,
        isAuthenticated: !!user,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(async (credentials: LoginData) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.login(credentials);
      
      setState({
        user: response.user,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false }));
      
      // Handle specific error cases
      if (error.code === 'INVALID_CREDENTIALS') {
        Alert.alert('Login Failed', 'Invalid email or password');
      } else if (error.code === 'ACCOUNT_LOCKED') {
        Alert.alert('Account Locked', 'Your account has been temporarily locked');
      } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        Alert.alert('Email Not Verified', 'Please verify your email address');
      } else if (error.code === 'NETWORK_ERROR') {
        Alert.alert('Network Error', 'Please check your internet connection');
      } else {
        Alert.alert('Login Failed', error.message || 'An error occurred during login');
      }
      
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.register(data);
      
      setState({
        user: response.user,
        loading: false,
        isAuthenticated: true,
      });
      
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account'
      );
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false }));
      
      // Handle specific error cases
      if (error.code === 'EMAIL_EXISTS') {
        Alert.alert('Registration Failed', 'An account with this email already exists');
      } else if (error.code === 'WEAK_PASSWORD') {
        Alert.alert('Weak Password', 'Password must be at least 8 characters long');
      } else if (error.code === 'INVALID_EMAIL') {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
      } else if (error.code === 'NETWORK_ERROR') {
        Alert.alert('Network Error', 'Please check your internet connection');
      } else {
        Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
      }
      
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await authService.logout();
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
      }));
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, user might be logged out
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    setState(prev => ({
      ...prev,
      user,
    }));
    authService.updateCurrentUser(user);
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };
}; 
