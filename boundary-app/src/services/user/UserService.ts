import appkit from '../api/appkit';
import { AppKitUser } from '@alphayard/appkit';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
}

class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getProfile(): Promise<{ data: UserProfile }> {
    try {
        const appKitUser = await appkit.getUser();
        return { data: this.mapAppKitUser(appKitUser) };
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const appKitUser = await appkit.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phoneNumber,
        avatar: data.avatar
      });
      return this.mapAppKitUser(appKitUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  private mapAppKitUser(user: AppKitUser): UserProfile {
    return {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phoneNumber: user.phone,
      avatar: user.avatar,
      bio: (user.attributes?.bio as string) || ''
    };
  }
}

export const userService = UserService.getInstance();
