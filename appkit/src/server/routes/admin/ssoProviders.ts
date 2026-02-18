import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(authenticateAdmin as any);

// Supported provider types
const PROVIDER_TYPES = ['google', 'facebook', 'apple', 'github', 'microsoft', 'twitter', 'x', 'linkedin', 'discord', 'slack', 'line', 'custom', 'saml', 'oidc'];

// Get all SSO providers
router.get('/', requirePermission('settings', 'view'), async (req: Request, res: Response) => {
  try {
    const { enabled } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (enabled !== undefined) {
      whereClause = 'WHERE is_enabled = $1';
      params.push(enabled === 'true');
    }
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, provider_name as name, display_name, is_enabled as enabled,
        client_id, 
        CASE WHEN client_secret IS NOT NULL AND client_secret != '' THEN '********' ELSE NULL END as client_secret,
        authorization_url, token_url, userinfo_url, jwks_url,
        scopes, claims_mapping, icon_url, button_color, display_order,
        allow_signup as auto_create_users, allowed_domains, default_role,
        created_at, updated_at
      FROM core.oauth_providers
      ${whereClause}
      ORDER BY display_order ASC, provider_name ASC
    `, ...params);
    
    res.json({
      success: true,
      providers: result.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        providerType: row.name, // Mapping provider_name to providerType
        enabled: row.enabled,
        clientId: row.client_id,
        clientSecret: row.client_secret,
        authorizationUrl: row.authorization_url,
        tokenUrl: row.token_url,
        userinfoUrl: row.userinfo_url,
        jwksUrl: row.jwks_url,
        scopes: row.scopes,
        claimsMapping: row.claims_mapping,
        iconUrl: row.icon_url,
        buttonColor: row.button_color,
        displayOrder: row.display_order,
        autoCreateUsers: row.auto_create_users,
        allowedDomains: row.allowed_domains,
        defaultRole: row.default_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching SSO providers:', error);
    res.status(500).json({ error: 'Failed to fetch SSO providers' });
  }
});

// Get a single SSO provider
router.get('/:id', requirePermission('settings', 'view'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, provider_name as name, display_name, is_enabled as enabled,
        client_id, 
        CASE WHEN client_secret IS NOT NULL AND client_secret != '' THEN '********' ELSE NULL END as client_secret,
        authorization_url, token_url, userinfo_url, jwks_url,
        scopes, claims_mapping, icon_url, button_color, display_order,
        allow_signup as auto_create_users, allowed_domains, default_role,
        created_at, updated_at
      FROM core.oauth_providers
      WHERE id = $1::uuid
    `, id);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const row = result[0];
    res.json({
      success: true,
      provider: {
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        providerType: row.name,
        enabled: row.enabled,
        clientId: row.client_id,
        clientSecret: row.client_secret,
        authorizationUrl: row.authorization_url,
        tokenUrl: row.token_url,
        userinfoUrl: row.userinfo_url,
        jwksUrl: row.jwks_url,
        scopes: row.scopes,
        claimsMapping: row.claims_mapping,
        iconUrl: row.icon_url,
        buttonColor: row.button_color,
        displayOrder: row.display_order,
        autoCreateUsers: row.auto_create_users,
        allowedDomains: row.allowed_domains,
        defaultRole: row.default_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching SSO provider:', error);
    res.status(500).json({ error: 'Failed to fetch SSO provider' });
  }
});

// Create a new SSO provider
router.post('/', [
  requirePermission('settings', 'edit'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('providerType').isIn(PROVIDER_TYPES).withMessage('Invalid provider type'), // Assuming name from frontend is providerType
  body('clientId').optional().trim(),
  body('clientSecret').optional().trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name, // providerName from frontend
      displayName,
      providerType, // redundant if name is providerType? Front end sends providerType.
      enabled = false,
      clientId,
      clientSecret,
      authorizationUrl,
      tokenUrl,
      userinfoUrl,
      jwksUrl,
      scopes,
      claimsMapping,
      iconUrl,
      buttonColor,
      displayOrder,
      autoCreateUsers = true,
      allowedDomains,
      defaultRole = 'user'
    } = req.body;
    
    const id = uuidv4();
    
    // Use providerType as provider_name if available, else name
    const providerName = providerType || name || 'custom';

    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO core.oauth_providers (
        id, provider_name, display_name, is_enabled,
        client_id, client_secret, authorization_url, token_url, userinfo_url, jwks_url,
        scopes, claims_mapping, icon_url, button_color, display_order,
        allow_signup, allowed_domains, default_role,
        created_at, updated_at
      ) VALUES (
        $1::uuid, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11::jsonb, $12::jsonb, $13, $14, $15,
        $16, $17, $18,
        NOW(), NOW()
      )
      RETURNING *
    `,
      id, providerName, displayName || providerName, enabled,
      clientId || '', clientSecret || '', authorizationUrl, tokenUrl, userinfoUrl, jwksUrl,
      JSON.stringify(scopes || []), JSON.stringify(claimsMapping || {}), iconUrl, buttonColor, displayOrder || 0,
      autoCreateUsers, allowedDomains || [], defaultRole
    );
    
    const row = result[0];
    res.status(201).json({
      success: true,
      message: 'SSO provider created',
      provider: {
        id: row.id,
        name: row.provider_name,
        displayName: row.display_name,
        providerType: row.provider_name,
        enabled: row.is_enabled
      }
    });
  } catch (error: any) {
    console.error('Error creating SSO provider:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A provider with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create SSO provider' });
  }
});

// Update an SSO provider
router.put('/:id', [
  requirePermission('settings', 'edit'),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      displayName,
      providerType,
      enabled,
      clientId,
      clientSecret,
      authorizationUrl,
      tokenUrl,
      userinfoUrl,
      jwksUrl,
      scopes,
      claimsMapping,
      iconUrl,
      buttonColor,
      displayOrder,
      autoCreateUsers,
      allowedDomains,
      defaultRole
    } = req.body;
    
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined) { updates.push(`provider_name = $${paramIndex++}`); params.push(name); }
    if (displayName !== undefined) { updates.push(`display_name = $${paramIndex++}`); params.push(displayName); }
    if (enabled !== undefined) { updates.push(`is_enabled = $${paramIndex++}`); params.push(enabled); }
    if (clientId !== undefined) { updates.push(`client_id = $${paramIndex++}`); params.push(clientId); }
    // Only update client_secret if it's not the masked value
    if (clientSecret !== undefined && clientSecret !== '********') {
      updates.push(`client_secret = $${paramIndex++}`);
      params.push(clientSecret);
    }
    if (authorizationUrl !== undefined) { updates.push(`authorization_url = $${paramIndex++}`); params.push(authorizationUrl); }
    if (tokenUrl !== undefined) { updates.push(`token_url = $${paramIndex++}`); params.push(tokenUrl); }
    if (userinfoUrl !== undefined) { updates.push(`userinfo_url = $${paramIndex++}`); params.push(userinfoUrl); }
    if (jwksUrl !== undefined) { updates.push(`jwks_url = $${paramIndex++}`); params.push(jwksUrl); }
    if (scopes !== undefined) { updates.push(`scopes = $${paramIndex++}::jsonb`); params.push(JSON.stringify(scopes)); }
    if (claimsMapping !== undefined) { updates.push(`claims_mapping = $${paramIndex++}::jsonb`); params.push(JSON.stringify(claimsMapping)); }
    if (iconUrl !== undefined) { updates.push(`icon_url = $${paramIndex++}`); params.push(iconUrl); }
    if (buttonColor !== undefined) { updates.push(`button_color = $${paramIndex++}`); params.push(buttonColor); }
    if (displayOrder !== undefined) { updates.push(`display_order = $${paramIndex++}`); params.push(displayOrder); }
    if (autoCreateUsers !== undefined) { updates.push(`allow_signup = $${paramIndex++}`); params.push(autoCreateUsers); }
    if (allowedDomains !== undefined) { updates.push(`allowed_domains = $${paramIndex++}`); params.push(allowedDomains); }
    if (defaultRole !== undefined) { updates.push(`default_role = $${paramIndex++}`); params.push(defaultRole); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(id); // ID is the last param
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE core.oauth_providers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}::uuid
      RETURNING *
    `, ...params);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const row = result[0];
    res.json({
      success: true,
      message: 'SSO provider updated',
      provider: {
        id: row.id,
        name: row.provider_name,
        displayName: row.display_name,
        enabled: row.is_enabled
      }
    });
  } catch (error) {
    console.error('Error updating SSO provider:', error);
    res.status(500).json({ error: 'Failed to update SSO provider' });
  }
});

// Delete an SSO provider
router.delete('/:id', [
  requirePermission('settings', 'edit'),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM core.oauth_providers
      WHERE id = $1::uuid
    `, id);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({
      success: true,
      message: 'SSO provider deleted'
    });
  } catch (error) {
    console.error('Error deleting SSO provider:', error);
    res.status(500).json({ error: 'Failed to delete SSO provider' });
  }
});

// Toggle provider status
router.patch('/:id/toggle', [
  requirePermission('settings', 'edit'),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Toggle the boolean value
    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE core.oauth_providers
      SET is_enabled = NOT is_enabled, updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING is_enabled
    `, id);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({
      success: true,
      enabled: result[0].is_enabled
    });
  } catch (error) {
    console.error('Error toggling SSO provider:', error);
    res.status(500).json({ error: 'Failed to toggle SSO provider' });
  }
});

export default router;
