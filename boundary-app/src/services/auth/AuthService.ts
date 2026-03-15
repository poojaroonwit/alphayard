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

  // Register — calls AppKit server (deployed on Railway, shares the same DB as admin panel)
  async register(data: SignupData): Promise<AuthResponse> {
    try {
      const appkitUrl = 'https://appkits.up.railway.app';
      const res = await fetch(`${appkitUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || 'Registration failed');
      }

      const rawUser = json.user;
      const tokens = { accessToken: json.accessToken, refreshToken: json.refreshToken, expiresIn: 86400 };

      // Inject the token into the AppKit SDK so subsequent SDK calls are authenticated
      const tokenSet = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + (tokens.expiresIn || 86400) * 1000,
      };
      (appkit as any).tokenStorage?.setTokens?.(tokenSet);

      const user: User = {
        id: rawUser.id,
        email: rawUser.email,
        firstName: rawUser.firstName,
        lastName: rawUser.lastName,
        phoneNumber: rawUser.phoneNumber,
        phone: rawUser.phoneNumber,
        avatar: rawUser.avatarUrl || undefined,
        dateOfBirth: undefined,
        gender: undefined,
        preferences: {},
        emergencyContacts: [],
        createdAt: rawUser.createdAt ? new Date(rawUser.createdAt) : new Date(),
        updatedAt: rawUser.updatedAt ? new Date(rawUser.updatedAt) : new Date(),
        lastActiveAt: rawUser.updatedAt || new Date().toISOString(),
      };

      return {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
      };
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

      const appKitUser = await appkit.getUser();
      const user = this.mapAppKitUser(appKitUser);
      
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
      // Map local User updates to AppKitUser update interface
      const appKitUpdates = {
        firstName: updates.firstName,
        lastName: updates.lastName,
        phone: updates.phoneNumber || updates.phone,
        avatar: updates.avatar,
      };

      const appKitUser = await appkit.updateProfile(appKitUpdates);
      const user = this.mapAppKitUser(appKitUser);
      return user;
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
