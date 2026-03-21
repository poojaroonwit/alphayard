export * from './AuthService.types';
import { User, AuthTokens, AuthResponse, LoginData, SignupData } from './AuthService.types';
import appkit from '../api/appkit';
import { AppKitUser } from '@alphayard/appkit';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await appkit.loginWithCredentials({
        email: data.email,
        password: data.password
      });

      if (!response.user) {
        throw new Error(response.message || 'Login failed');
      }

      const user = this.mapAppKitUser(response.user);
      const tokens: AuthTokens = {
        accessToken: response.accessToken || '',
        refreshToken: response.refreshToken || '',
        expiresIn: 3600 * 24
      };

      return { user, tokens };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register — uses AppKit SDK (domain driven by EXPO_PUBLIC_APPKIT_DOMAIN env var)
  async register(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await appkit.signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      if (!response.user) {
        throw new Error(response.message || 'Registration failed');
      }

      const user = this.mapAppKitUser(response.user);
      const tokens: AuthTokens = {
        accessToken: response.accessToken || '',
        refreshToken: response.refreshToken || '',
        expiresIn: 86400,
      };

      return { user, tokens };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await appkit.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!appkit.isAuthenticated()) {
        return null;
      }

      // Use bondary-backend's /users/profile via appkit.call() (routes to baseURL,
      // not domain — avoids sending local JWTs to the remote AppKit server).
      const response = await appkit.call<{ user: any }>('GET', '/users/profile');
      const raw = response.user;
      const user = this.mapAppKitUser(raw);
      // Bondary-backend returns these fields directly; patch them onto the mapped user.
      (user as any).isOnboardingComplete = raw.isOnboardingComplete ?? false;
      (user as any).preferences = raw.preferences ?? user.preferences;
      (user as any).userType = raw.userType;
      return user;
    } catch (error) {
       // If unauthorized, appkit might throw. We handle it as null user.
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Check if authenticated
  async isAuthenticated(): Promise<boolean> {
    return appkit.isAuthenticated();
  }

  // Refresh token
  async refreshToken(): Promise<AuthTokens | null> {
    try {
      const tokenSet = await appkit.refreshToken();
      if (!tokenSet) return null;

      return {
        accessToken: tokenSet.accessToken,
        refreshToken: tokenSet.refreshToken || '',
        expiresIn: 3600 * 24
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  // Forgot Password
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await appkit.forgotPassword({ email });
      if (!response.success) {
        throw new Error(response.message || 'Failed to request password reset');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset Password
  async resetPassword(newPassword: string, token?: string): Promise<void> {
    if (!token) throw new Error('Reset token required');
    
    try {
       const response = await appkit.resetPassword({ password: newPassword, token });
       if (!response.success) {
         throw new Error(response.message || 'Failed to reset password');
       }
    } catch (error) {
       console.error('Reset password error:', error);
       throw error;
    }
  }

  // Load available SSO providers
  async loadSSOProviders(): Promise<any[]> {
    try {
      const response = await appkit.branding.getSSOProviders();
      return response || [];
    } catch (error) {
      console.error('Load SSO providers error:', error);
      return [];
    }
  }

  // Social Login
  async socialLogin(provider: string, ssoData: any): Promise<AuthResponse> {
    try {
      const response = await appkit.verifySocialLogin(provider, ssoData);
      
      if (!response.user) {
        throw new Error(response.message || 'Social login failed');
      }

      const user = this.mapAppKitUser(response.user);
      const tokens: AuthTokens = {
        accessToken: response.accessToken || '',
        refreshToken: response.refreshToken || '',
        expiresIn: 3600 * 24,
      };

      return { user, tokens };
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  // Update Profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await appkit.call<{ user: any }>('PATCH', '/users/profile', {
        firstName: updates.firstName,
        lastName: updates.lastName,
        phone: updates.phoneNumber || updates.phone,
        avatar: updates.avatar,
      });
      return this.mapAppKitUser(response.user);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  // Get Circles (AppKit organizational units)
  async getCircles(): Promise<any[]> {
    try {
      return await appkit.getUserCircles();
    } catch (error) {
      console.error('Get circles error:', error);
      return [];
    }
  }

  // Join Circle
  async joinCircle(inviteCode: string, pinCode?: string): Promise<any> {
    try {
      const response = await appkit.joinCircle(inviteCode, pinCode);
      if (!response.success) {
        throw new Error('Failed to join circle');
      }
      return response.circle;
    } catch (error) {
      console.error('Join circle error:', error);
      throw error;
    }
  }

  // Direct login for users with no 2FA configured (no OTP step).
  // Calls bondary-backend so the token is signed with the same JWT_SECRET
  // used by the socket server, enabling real-time features after login.
  async directLogin(identifier: string): Promise<AuthResponse> {
    const isEmail = identifier.includes('@');
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
    const res = await fetch(`${baseUrl}/auth/direct-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      }),
    });
    const data: any = await res.json();
    if (!data.success || !data.user) {
      throw new Error(data.message || 'Login failed');
    }
    // Store tokens in the SDK's token storage so getAccessToken() works going forward
    try {
      (appkit as any).auth?.tokenStorage?.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + 24 * 3600 * 1000,
        refreshTokenExpiresAt: Date.now() + 7 * 24 * 3600 * 1000,
      });
      (appkit as any).auth?.emit?.('login', data.user);
    } catch (_) { /* non-fatal */ }

    const user = this.mapAppKitUser(data.user);
    return {
      user,
      tokens: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: 3600 * 24,
      },
    };
  }

  // Check if user exists
  async checkUserExists(identifier: string): Promise<boolean> {
    try {
      const isEmail = identifier.includes('@');
      const response = await appkit.checkUserExists({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      });
      return !!response.exists;
    } catch (error) {
      console.error('Check user exists error:', error);
      return false;
    }
  }

  // Check user and return full info including MFA methods
  async checkUserInfo(identifier: string): Promise<{
    exists: boolean;
    isActive: boolean;
    hasMfa: boolean;
    availableChannels: Array<'email' | 'sms' | 'totp'>;
    email?: string;
    phoneNumber?: string;
  }> {
    try {
      const isEmail = identifier.includes('@');
      // Cast to any — SDK type only exposes { exists } but server returns more
      const response = await appkit.checkUserExists({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      }) as any;
      return {
        exists: !!response.exists,
        isActive: !!response.isActive,
        hasMfa: !!response.hasMfa,
        availableChannels: Array.isArray(response.availableChannels) ? response.availableChannels : [],
        email: response.email,
        phoneNumber: response.phoneNumber,
      };
    } catch (error) {
      console.error('Check user info error:', error);
      return { exists: false, isActive: false, hasMfa: false, availableChannels: [] };
    }
  }

  // Request OTP — returns debug_otp when email/SMS is not configured
  async requestOtp(identifier: string): Promise<string | undefined> {
    try {
      const isEmail = identifier.includes('@');
      const response = await appkit.requestOtp({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to request OTP');
      }
      return (response as any).debug_otp as string | undefined;
    } catch (error) {
      console.error('Request OTP error:', error);
      throw error;
    }
  }

  // Login with OTP
  async loginWithOtp(identifier: string, otp: string): Promise<AuthResponse> {
    try {
      const isEmail = identifier.includes('@');
      const response = await appkit.loginWithOtp({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
        otp,
      });

      if (!response.user) {
        throw new Error(response.message || 'OTP login failed');
      }

      const user = this.mapAppKitUser(response.user);
      const tokens: AuthTokens = {
        accessToken: response.accessToken || '',
        refreshToken: response.refreshToken || '',
        expiresIn: 3600 * 24,
      };

      return { user, tokens };
    } catch (error) {
      console.error('OTP login error:', error);
      throw error;
    }
  }

  // Verify Email
  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    try {
      const response = await appkit.verifyEmail({ email, code });

      if (!response.user) {
        throw new Error(response.message || 'Email verification failed');
      }

      const user = this.mapAppKitUser(response.user);
      const tokens: AuthTokens = {
        accessToken: response.accessToken || '',
        refreshToken: response.refreshToken || '',
        expiresIn: 3600 * 24,
      };

      return { user, tokens };
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  updateCurrentUser(_user: User): void {
    // No longer needed as state is managed in SDK
  }

  /**
   * Maps an AppKitUser from the SDK to the mobile app's User interface.
   */
  private mapAppKitUser(appKitUser: AppKitUser): User {
    return {
      id: appKitUser.id,
      email: appKitUser.email,
      firstName: appKitUser.firstName || appKitUser.name?.split(' ')[0] || '',
      lastName: appKitUser.lastName || appKitUser.name?.split(' ').slice(1).join(' ') || '',
      phoneNumber: appKitUser.phone,
      phone: appKitUser.phone,
      avatar: appKitUser.avatar,
      // Default mappings for fields not yet in AppKitUser
      dateOfBirth: undefined,
      gender: undefined,
      preferences: appKitUser.attributes?.preferences || {},
      emergencyContacts: (appKitUser.attributes?.emergencyContacts as any[]) || [],
      createdAt: appKitUser.createdAt ? new Date(appKitUser.createdAt) : new Date(),
      updatedAt: appKitUser.updatedAt ? new Date(appKitUser.updatedAt) : new Date(),
      lastActiveAt: appKitUser.updatedAt || new Date().toISOString()
    };
  }
}

export default AuthService.getInstance();
