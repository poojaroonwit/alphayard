import { Router } from 'express';
import { appConfigController } from '../../controllers/admin/AppConfigController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();

/**
 * App Configuration Routes
 * Public routes for fetching app configuration
 * Admin routes for managing configuration
 */

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Get complete app configuration bundle
router.get('/config', appConfigController.getAppConfig.bind(appConfigController));

// Get specific screen configuration
router.get('/screens/:screenKey', appConfigController.getScreenConfig.bind(appConfigController));

// Get all themes
router.get('/themes', appConfigController.getThemes.bind(appConfigController));

// Get specific asset
router.get('/assets/:assetKey', appConfigController.getAsset.bind(appConfigController));

// Get assets by type
router.get('/assets/type/:assetType', appConfigController.getAssetsByType.bind(appConfigController));

// Get feature flags
router.get('/features', appConfigController.getFeatureFlags.bind(appConfigController));

// Get specific configuration value
router.get('/config/:configKey', appConfigController.getConfigValue.bind(appConfigController));

// ============================================================================
// ADMIN ROUTES (Authentication required)
// ============================================================================

// Update screen configuration
router.put('/screens/:screenKey', authenticateAdmin as any, requirePermission('settings', 'edit'), appConfigController.updateScreenConfig.bind(appConfigController));

// Update theme configuration
router.put('/themes/:themeKey', authenticateAdmin as any, requirePermission('settings', 'edit'), appConfigController.updateTheme.bind(appConfigController));

// Create or update asset
router.post('/assets', authenticateAdmin as any, requirePermission('settings', 'edit'), appConfigController.upsertAsset.bind(appConfigController));

// Update feature flag
router.patch('/features/:featureKey', authenticateAdmin as any, requirePermission('settings', 'edit'), appConfigController.updateFeatureFlag.bind(appConfigController));

// Update configuration value
router.put('/config/:configKey', authenticateAdmin as any, requirePermission('settings', 'edit'), appConfigController.updateConfigValue.bind(appConfigController));

export default router;

