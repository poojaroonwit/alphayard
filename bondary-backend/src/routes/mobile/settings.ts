import { Router, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import userSettingsService from '../../services/userSettingsService';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * GET /api/v1/settings
 * Get all user settings
 */
router.get('/', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.getSettings(userId);
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[Settings] Error getting settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/settings
 * Update user settings
 */
router.put('/', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { theme, language, timezone, notificationSettings, privacySettings, displaySettings, appSettings } = req.body;

    const settings = await userSettingsService.updateSettings(userId, {
      theme,
      language,
      timezone,
      notificationSettings,
      privacySettings,
      displaySettings,
      appSettings,
    });

    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[Settings] Error updating settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/settings/theme
 * Update theme setting
 */
router.patch('/theme', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    if (!['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ success: false, error: 'Invalid theme. Must be light, dark, or system' });
    }

    const settings = await userSettingsService.updateSettings(userId, { theme });
    res.json({ success: true, theme: settings.theme });
  } catch (error: any) {
    console.error('[Settings] Error updating theme:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/settings/language
 * Update language setting
 */
router.patch('/language', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;

    if (!language || typeof language !== 'string') {
      return res.status(400).json({ success: false, error: 'Language code is required' });
    }

    const settings = await userSettingsService.updateSettings(userId, { language });
    res.json({ success: true, language: settings.language });
  } catch (error: any) {
    console.error('[Settings] Error updating language:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/settings/timezone
 * Update timezone setting
 */
router.patch('/timezone', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { timezone } = req.body;

    const settings = await userSettingsService.updateSettings(userId, { timezone });
    res.json({ success: true, timezone: settings.timezone });
  } catch (error: any) {
    console.error('[Settings] Error updating timezone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/settings/notifications
 * Get notification settings
 */
router.get('/notifications', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.getSettings(userId);
    res.json({ success: true, notificationSettings: settings.notificationSettings });
  } catch (error: any) {
    console.error('[Settings] Error getting notification settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/settings/notifications
 * Update notification settings
 */
router.patch('/notifications', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const notificationSettings = req.body;

    const settings = await userSettingsService.updateNotificationSettings(userId, notificationSettings);
    res.json({ success: true, notificationSettings: settings.notificationSettings });
  } catch (error: any) {
    console.error('[Settings] Error updating notification settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/settings/privacy
 * Get privacy settings
 */
router.get('/privacy', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.getSettings(userId);
    res.json({ success: true, privacySettings: settings.privacySettings });
  } catch (error: any) {
    console.error('[Settings] Error getting privacy settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/settings/privacy
 * Update privacy settings
 */
router.patch('/privacy', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const privacySettings = req.body;

    const settings = await userSettingsService.updatePrivacySettings(userId, privacySettings);
    res.json({ success: true, privacySettings: settings.privacySettings });
  } catch (error: any) {
    console.error('[Settings] Error updating privacy settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/settings/display
 * Get display settings
 */
router.get('/display', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.getSettings(userId);
    res.json({ success: true, displaySettings: settings.displaySettings });
  } catch (error: any) {
    console.error('[Settings] Error getting display settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/settings/display
 * Update display settings
 */
router.patch('/display', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const displaySettings = req.body;

    const settings = await userSettingsService.updateDisplaySettings(userId, displaySettings);
    res.json({ success: true, displaySettings: settings.displaySettings });
  } catch (error: any) {
    console.error('[Settings] Error updating display settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/settings/reset
 * Reset all settings to defaults
 */
router.post('/reset', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.resetToDefaults(userId);
    res.json({ success: true, settings, message: 'Settings reset to defaults' });
  } catch (error: any) {
    console.error('[Settings] Error resetting settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/settings/languages
 * Get available languages
 */
router.get('/languages', (req: any, res: Response) => {
  const languages = userSettingsService.getAvailableLanguages();
  res.json({ success: true, languages });
});

/**
 * GET /api/v1/settings/timezones
 * Get available timezones
 */
router.get('/timezones', (req: any, res: Response) => {
  const timezones = userSettingsService.getAvailableTimezones();
  res.json({ success: true, timezones });
});

/**
 * GET /api/v1/settings/export
 * Export all user settings and data preferences
 */
router.get('/export', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.getSettings(userId);

    // Remove internal IDs for export
    const exportData = {
      theme: settings.theme,
      language: settings.language,
      timezone: settings.timezone,
      notifications: settings.notificationSettings,
      privacy: settings.privacySettings,
      display: settings.displaySettings,
      app: settings.appSettings,
      exportedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: exportData });
  } catch (error: any) {
    console.error('[Settings] Error exporting settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/settings/import
 * Import user settings from export data
 */
router.post('/import', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'Export data is required' });
    }

    const settings = await userSettingsService.updateSettings(userId, {
      theme: data.theme,
      language: data.language,
      timezone: data.timezone,
      notificationSettings: data.notifications,
      privacySettings: data.privacy,
      displaySettings: data.display,
      appSettings: data.app,
    });

    res.json({ success: true, settings, message: 'Settings imported successfully' });
  } catch (error: any) {
    console.error('[Settings] Error importing settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
