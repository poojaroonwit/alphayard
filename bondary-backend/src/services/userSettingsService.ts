import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string | null;
  notificationSettings: {
    push: boolean;
    email: boolean;
    sms: boolean;
    circleUpdates: boolean;
    mentions: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  privacySettings: {
    showLocation: boolean;
    showOnline: boolean;
    allowMessages: 'all' | 'circles' | 'none';
    shareActivity: boolean;
    publicProfile: boolean;
  };
  displaySettings: {
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    showAvatars: boolean;
    autoPlayVideos: boolean;
  };
  appSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SETTINGS = {
  theme: 'system',
  language: 'en',
  timezone: null,
  notificationSettings: {
    push: true,
    email: true,
    sms: false,
    circleUpdates: true,
    mentions: true,
    reminders: true,
    marketing: false,
  },
  privacySettings: {
    showLocation: true,
    showOnline: true,
    allowMessages: 'all',
    shareActivity: true,
    publicProfile: false,
  },
  displaySettings: {
    fontSize: 'medium',
    compactMode: false,
    showAvatars: true,
    autoPlayVideos: true,
  },
  appSettings: {},
};

class UserSettingsService {
  /**
   * Get user settings (creates default if not exists)
   */
  async getSettings(userId: string, applicationId: string | null = null): Promise<UserSettings> {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: {
          userId_applicationId: {
            userId,
            applicationId: applicationId ?? null as any,
          },
        },
      });

      if (!settings) {
        // Create default settings
        return this.createDefaultSettings(userId, applicationId);
      }

      return this.mapSettings(settings);
    } catch (error) {
      console.error('Error getting user settings:', error);
      // Return in-memory defaults if table doesn't exist yet
      return {
        id: uuidv4(),
        userId,
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserSettings;
    }
  }

  /**
   * Create default settings for a user
   */
  async createDefaultSettings(userId: string, applicationId: string | null = null): Promise<UserSettings> {
    try {
      const settings = await prisma.userSettings.upsert({
        where: {
          userId_applicationId: {
            userId,
            applicationId: applicationId ?? null as any,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          userId,
          applicationId: applicationId || null,
          theme: DEFAULT_SETTINGS.theme,
          languageCode: DEFAULT_SETTINGS.language,
          timezone: DEFAULT_SETTINGS.timezone || 'UTC',
          notificationPreferences: DEFAULT_SETTINGS.notificationSettings as any,
          privacySettings: DEFAULT_SETTINGS.privacySettings as any,
          settings: {
            displaySettings: DEFAULT_SETTINGS.displaySettings,
            appSettings: DEFAULT_SETTINGS.appSettings,
          } as any,
        },
      });

      return this.mapSettings(settings);
    } catch (error) {
      console.error('Error creating default settings:', error);
      return {
        id: uuidv4(),
        userId,
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserSettings;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, updates: Partial<{
    theme: string;
    language: string;
    timezone: string;
    notificationSettings: Partial<UserSettings['notificationSettings']>;
    privacySettings: Partial<UserSettings['privacySettings']>;
    displaySettings: Partial<UserSettings['displaySettings']>;
    appSettings: Record<string, any>;
  }>, applicationId: string | null = null): Promise<UserSettings> {
    try {
      // First ensure settings exist
      const existing = await this.getSettings(userId, applicationId);

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.theme !== undefined) {
        updateData.theme = updates.theme;
      }

      if (updates.language !== undefined) {
        updateData.languageCode = updates.language;
      }

      if (updates.timezone !== undefined) {
        updateData.timezone = updates.timezone;
      }

      if (updates.notificationSettings !== undefined) {
        const merged = { ...existing.notificationSettings, ...updates.notificationSettings };
        updateData.notificationPreferences = merged as any;
      }

      if (updates.privacySettings !== undefined) {
        const merged = { ...existing.privacySettings, ...updates.privacySettings };
        updateData.privacySettings = merged as any;
      }

      if (updates.displaySettings !== undefined || updates.appSettings !== undefined) {
        const currentSettings = existing.appSettings || {};
        const currentDisplaySettings = existing.displaySettings || {};
        
        updateData.settings = {
          displaySettings: { ...currentDisplaySettings, ...(updates.displaySettings || {}) },
          appSettings: { ...currentSettings, ...(updates.appSettings || {}) },
        } as any;
      }

      const settings = await prisma.userSettings.upsert({
        where: {
          userId_applicationId: {
            userId,
            applicationId: applicationId ?? null as any,
          },
        },
        update: updateData,
        create: {
          userId,
          applicationId: applicationId || null,
          theme: updates.theme || DEFAULT_SETTINGS.theme,
          languageCode: updates.language || DEFAULT_SETTINGS.language,
          timezone: updates.timezone || DEFAULT_SETTINGS.timezone || 'UTC',
          notificationPreferences: (updates.notificationSettings 
            ? { ...DEFAULT_SETTINGS.notificationSettings, ...updates.notificationSettings }
            : DEFAULT_SETTINGS.notificationSettings) as any,
          privacySettings: (updates.privacySettings
            ? { ...DEFAULT_SETTINGS.privacySettings, ...updates.privacySettings }
            : DEFAULT_SETTINGS.privacySettings) as any,
          settings: {
            displaySettings: updates.displaySettings
              ? { ...DEFAULT_SETTINGS.displaySettings, ...updates.displaySettings }
              : DEFAULT_SETTINGS.displaySettings,
            appSettings: updates.appSettings
              ? { ...DEFAULT_SETTINGS.appSettings, ...updates.appSettings }
              : DEFAULT_SETTINGS.appSettings,
          } as any,
        },
      });

      return this.mapSettings(settings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Create settings with specific values
   */
  private async createSettingsWithValues(userId: string, values: any, applicationId: string | null = null): Promise<UserSettings> {
    const settings = await prisma.userSettings.create({
      data: {
        userId,
        applicationId: applicationId || null,
        theme: values.theme || DEFAULT_SETTINGS.theme,
        languageCode: values.language || DEFAULT_SETTINGS.language,
        timezone: values.timezone || DEFAULT_SETTINGS.timezone || 'UTC',
        notificationPreferences: { ...DEFAULT_SETTINGS.notificationSettings, ...values.notificationSettings } as any,
        privacySettings: { ...DEFAULT_SETTINGS.privacySettings, ...values.privacySettings } as any,
        settings: {
          displaySettings: { ...DEFAULT_SETTINGS.displaySettings, ...values.displaySettings },
          appSettings: { ...DEFAULT_SETTINGS.appSettings, ...values.appSettings },
        } as any,
      },
    });

    return this.mapSettings(settings);
  }

  /**
   * Update specific notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<UserSettings['notificationSettings']>,
    applicationId: string | null = null
  ): Promise<UserSettings> {
    return this.updateSettings(userId, { notificationSettings: settings }, applicationId);
  }

  /**
   * Update specific privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<UserSettings['privacySettings']>,
    applicationId: string | null = null
  ): Promise<UserSettings> {
    return this.updateSettings(userId, { privacySettings: settings }, applicationId);
  }

  /**
   * Update specific display settings
   */
  async updateDisplaySettings(
    userId: string,
    settings: Partial<UserSettings['displaySettings']>,
    applicationId: string | null = null
  ): Promise<UserSettings> {
    return this.updateSettings(userId, { displaySettings: settings }, applicationId);
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(userId: string, applicationId: string | null = null): Promise<UserSettings> {
    try {
      await prisma.userSettings.delete({
        where: {
          userId_applicationId: {
            userId,
            applicationId: applicationId ?? null as any,
          },
        },
      });
      return this.createDefaultSettings(userId, applicationId);
    } catch (error) {
      console.error('Error resetting user settings:', error);
      throw error;
    }
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    ];
  }

  /**
   * Get common timezones
   */
  getAvailableTimezones(): Array<{ value: string; label: string; offset: string }> {
    return [
      { value: 'Asia/Bangkok', label: 'Bangkok', offset: '+07:00' },
      { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
      { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
      { value: 'Asia/Shanghai', label: 'Shanghai', offset: '+08:00' },
      { value: 'Asia/Seoul', label: 'Seoul', offset: '+09:00' },
      { value: 'America/New_York', label: 'New York', offset: '-05:00' },
      { value: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00' },
      { value: 'America/Chicago', label: 'Chicago', offset: '-06:00' },
      { value: 'Europe/London', label: 'London', offset: '+00:00' },
      { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
      { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00' },
      { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00' },
      { value: 'Pacific/Auckland', label: 'Auckland', offset: '+13:00' },
    ];
  }

  private mapSettings(row: any): UserSettings {
    // Handle Prisma model structure
    const settingsJson = row.settings || {};
    const displaySettings = settingsJson.displaySettings || DEFAULT_SETTINGS.displaySettings;
    const appSettings = settingsJson.appSettings || DEFAULT_SETTINGS.appSettings;

    return {
      id: row.id,
      userId: row.userId,
      theme: (row.theme || DEFAULT_SETTINGS.theme) as 'light' | 'dark' | 'system',
      language: row.languageCode || DEFAULT_SETTINGS.language,
      timezone: row.timezone || DEFAULT_SETTINGS.timezone,
      notificationSettings: row.notificationPreferences || DEFAULT_SETTINGS.notificationSettings,
      privacySettings: row.privacySettings || DEFAULT_SETTINGS.privacySettings,
      displaySettings: displaySettings,
      appSettings: appSettings,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const userSettingsService = new UserSettingsService();
export default userSettingsService;
