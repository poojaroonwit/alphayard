/**
 * Admin OAuth Clients Management Routes
 * 
 * Allows administrators to manage OAuth clients that use AppKit as SSO provider.
 */

import { Router, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateAdmin, AdminRequest } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import SSOProvider from '../../services/SSOProviderService';
import { prisma } from '../../lib/prisma';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// ============================================================================
// List OAuth Clients
// ============================================================================

/**
 * Get all OAuth clients
 * GET /admin/oauth-clients
 */
router.get('/', requirePermission('settings', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        const { page = '1', limit = '20', search } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;
        
        // Filter by application if not super admin
        if (!req.admin?.isSuperAdmin && req.applicationId) {
            whereClause += ` AND (application_id = $${paramIndex} OR application_id IS NULL)`;
            params.push(req.applicationId);
            paramIndex++;
        }
        
        // Search filter
        if (search) {
            whereClause += ` AND (name ILIKE $${paramIndex} OR client_id ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        // Get total count
        const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) FROM oauth_clients ${whereClause}`,
            ...params
        );
        const total = parseInt(String(countResult[0].count));
        
        // Get clients
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT oc.*, 
                   a.name as application_name,
                   au.email as created_by_email,
                   (SELECT COUNT(*) FROM oauth_user_consents WHERE client_id = oc.id AND revoked_at IS NULL) as consent_count
            FROM oauth_clients oc
            LEFT JOIN core.applications a ON oc.application_id = a.id
            LEFT JOIN admin.admin_users au ON oc.created_by = au.id
            ${whereClause}
            ORDER BY oc.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, ...params, limit, offset);
        
        const clients = rows.map(row => ({
            id: row.id,
            client_id: row.client_id,
            client_type: row.client_type,
            name: row.name,
            description: row.description,
            logo_url: row.logo_url,
            homepage_url: row.homepage_url,
            redirect_uris: row.redirect_uris,
            grant_types: row.grant_types,
            allowed_scopes: row.allowed_scopes,
            default_scopes: row.default_scopes,
            access_token_lifetime: row.access_token_lifetime,
            refresh_token_lifetime: row.refresh_token_lifetime,
            require_pkce: row.require_pkce,
            require_consent: row.require_consent,
            first_party: row.first_party,
            is_active: row.is_active,
            application_name: row.application_name,
            created_by_email: row.created_by_email,
            consent_count: parseInt(row.consent_count),
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
        
        res.json({
            data: clients,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
        
    } catch (error) {
        console.error('Error fetching OAuth clients:', error);
        res.status(500).json({ error: 'Failed to fetch OAuth clients' });
    }
});

// ============================================================================
// Get Single OAuth Client
// ============================================================================

/**
 * Get OAuth client by ID
 * GET /admin/oauth-clients/:id
 */
router.get('/:id', [
    param('id').isUUID()
], requirePermission('settings', 'view'), async (req: AdminRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT oc.*, 
                   a.name as application_name,
                   au.email as created_by_email
            FROM oauth_clients oc
            LEFT JOIN core.applications a ON oc.application_id = a.id
            LEFT JOIN admin.admin_users au ON oc.created_by = au.id
            WHERE oc.id = $1
        `, req.params.id);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'OAuth client not found' });
        }
        
        // Get statistics
        const statsResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                (SELECT COUNT(*) FROM oauth_user_consents WHERE client_id = $1 AND revoked_at IS NULL) as active_consents,
                (SELECT COUNT(*) FROM oauth_access_tokens WHERE client_id = $1 AND is_revoked = false AND expires_at > NOW()) as active_tokens,
                (SELECT COUNT(*) FROM oauth_authorization_codes WHERE client_id = $1 AND used_at IS NULL AND expires_at > NOW()) as pending_codes
        `, req.params.id);
        
        const row = rows[0];
        
        res.json({
            id: row.id,
            client_id: row.client_id,
            client_type: row.client_type,
            name: row.name,
            description: row.description,
            logo_url: row.logo_url,
            homepage_url: row.homepage_url,
            privacy_policy_url: row.privacy_policy_url,
            terms_of_service_url: row.terms_of_service_url,
            redirect_uris: row.redirect_uris,
            grant_types: row.grant_types,
            response_types: row.response_types,
            allowed_scopes: row.allowed_scopes,
            default_scopes: row.default_scopes,
            access_token_lifetime: row.access_token_lifetime,
            refresh_token_lifetime: row.refresh_token_lifetime,
            id_token_lifetime: row.id_token_lifetime,
            require_pkce: row.require_pkce,
            require_consent: row.require_consent,
            first_party: row.first_party,
            is_active: row.is_active,
            application_id: row.application_id,
            application_name: row.application_name,
            created_by_email: row.created_by_email,
            created_at: row.created_at,
            updated_at: row.updated_at,
            stats: {
                active_consents: parseInt(String(statsResult[0].active_consents)),
                active_tokens: parseInt(String(statsResult[0].active_tokens)),
                pending_codes: parseInt(String(statsResult[0].pending_codes))
            }
        });
        
    } catch (error) {
        console.error('Error fetching OAuth client:', error);
        res.status(500).json({ error: 'Failed to fetch OAuth client' });
    }
});

// ============================================================================
// Create OAuth Client
// ============================================================================

/**
 * Create new OAuth client
 * POST /admin/oauth-clients
 */
router.post('/', [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('redirect_uris').isArray({ min: 1 }).withMessage('At least one redirect URI is required'),
    body('redirect_uris.*').isURL({ require_tld: false }).withMessage('Invalid redirect URI'),
    body('client_type').optional().isIn(['confidential', 'public']),
    body('grant_types').optional().isArray(),
    body('allowed_scopes').optional().isArray(),
    body('access_token_lifetime').optional().isInt({ min: 60, max: 86400 }),
    body('refresh_token_lifetime').optional().isInt({ min: 3600, max: 31536000 }),
    body('require_pkce').optional().isBoolean(),
    body('require_consent').optional().isBoolean(),
    body('first_party').optional().isBoolean()
], requirePermission('settings', 'manage'), async (req: AdminRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    try {
        const result = await SSOProvider.createClient({
            name: req.body.name,
            description: req.body.description,
            redirect_uris: req.body.redirect_uris,
            client_type: req.body.client_type,
            grant_types: req.body.grant_types,
            allowed_scopes: req.body.allowed_scopes,
            require_pkce: req.body.require_pkce,
            require_consent: req.body.require_consent,
            first_party: req.body.first_party,
            application_id: req.applicationId,
            created_by: req.admin?.adminId,
            logo_url: req.body.logo_url,
            homepage_url: req.body.homepage_url
        });
        
        // Update additional fields
        if (req.body.access_token_lifetime || req.body.refresh_token_lifetime || req.body.privacy_policy_url || req.body.terms_of_service_url) {
            await prisma.$executeRawUnsafe(`
                UPDATE oauth_clients SET
                    access_token_lifetime = COALESCE($1, access_token_lifetime),
                    refresh_token_lifetime = COALESCE($2, refresh_token_lifetime),
                    privacy_policy_url = COALESCE($3, privacy_policy_url),
                    terms_of_service_url = COALESCE($4, terms_of_service_url)
                WHERE id = $5
            `, [
                req.body.access_token_lifetime,
                req.body.refresh_token_lifetime,
                req.body.privacy_policy_url,
                req.body.terms_of_service_url,
                result.client.id
            ]);
        }
        
        res.status(201).json({
            message: 'OAuth client created successfully',
            client: {
                id: result.client.id,
                client_id: result.client.client_id,
                client_secret: result.client_secret, // Only returned on creation!
                name: result.client.name,
                redirect_uris: result.client.redirect_uris
            },
            warning: result.client_secret ? 'Store the client_secret securely. It will not be shown again.' : undefined
        });
        
    } catch (error) {
        console.error('Error creating OAuth client:', error);
        res.status(500).json({ error: 'Failed to create OAuth client' });
    }
});

// ============================================================================
// Update OAuth Client
// ============================================================================

/**
 * Update OAuth client
 * PUT /admin/oauth-clients/:id
 */
router.put('/:id', [
    param('id').isUUID(),
    body('name').optional().notEmpty().trim(),
    body('redirect_uris').optional().isArray({ min: 1 }),
    body('redirect_uris.*').optional().isURL({ require_tld: false }),
    body('allowed_scopes').optional().isArray(),
    body('access_token_lifetime').optional().isInt({ min: 60, max: 86400 }),
    body('refresh_token_lifetime').optional().isInt({ min: 3600, max: 31536000 }),
    body('require_pkce').optional().isBoolean(),
    body('require_consent').optional().isBoolean(),
    body('is_active').optional().isBoolean()
], requirePermission('settings', 'manage'), async (req: AdminRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    try {
        // Build update query dynamically
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        const allowedFields = [
            'name', 'description', 'logo_url', 'homepage_url', 'privacy_policy_url',
            'terms_of_service_url', 'redirect_uris', 'allowed_scopes', 'default_scopes',
            'access_token_lifetime', 'refresh_token_lifetime', 'id_token_lifetime',
            'require_pkce', 'require_consent', 'first_party', 'is_active'
        ];
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                const value = ['redirect_uris', 'allowed_scopes', 'default_scopes'].includes(field)
                    ? JSON.stringify(req.body[field])
                    : req.body[field];
                updates.push(`${field} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push('updated_at = NOW()');
        params.push(req.params.id);
        
        const rowCount = await prisma.$executeRawUnsafe(`
            UPDATE oauth_clients SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
        `, params);
        
        if (rowCount === 0) {
            return res.status(404).json({ error: 'OAuth client not found' });
        }
        
        res.json({ message: 'OAuth client updated successfully' });
        
    } catch (error) {
        console.error('Error updating OAuth client:', error);
        res.status(500).json({ error: 'Failed to update OAuth client' });
    }
});

// ============================================================================
// Regenerate Client Secret
// ============================================================================

/**
 * Regenerate client secret
 * POST /admin/oauth-clients/:id/regenerate-secret
 */
router.post('/:id/regenerate-secret', [
    param('id').isUUID()
], requirePermission('settings', 'manage'), async (req: AdminRequest, res: Response) => {
    try {
        // Check if client exists and is confidential
        const rows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT client_type FROM oauth_clients WHERE id = $1',
            req.params.id
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'OAuth client not found' });
        }
        
        if (rows[0].client_type === 'public') {
            return res.status(400).json({ error: 'Public clients do not have a secret' });
        }
        
        // Generate new secret
        const crypto = require('crypto');
        const bcrypt = require('bcryptjs');
        const newSecret = crypto.randomBytes(32).toString('base64url');
        const newSecretHash = await bcrypt.hash(newSecret, 12);
        
        await prisma.$executeRawUnsafe(
            'UPDATE oauth_clients SET client_secret_hash = $1, updated_at = NOW() WHERE id = $2',
            newSecretHash, req.params.id
        );
        
        res.json({
            message: 'Client secret regenerated successfully',
            client_secret: newSecret,
            warning: 'Store the client_secret securely. It will not be shown again.'
        });
        
    } catch (error) {
        console.error('Error regenerating client secret:', error);
        res.status(500).json({ error: 'Failed to regenerate client secret' });
    }
});

// ============================================================================
// Delete OAuth Client
// ============================================================================

/**
 * Delete OAuth client
 * DELETE /admin/oauth-clients/:id
 */
router.delete('/:id', [
    param('id').isUUID()
], requirePermission('settings', 'manage'), async (req: AdminRequest, res: Response) => {
    try {
        const rowCount = await prisma.$executeRawUnsafe(
            'DELETE FROM oauth_clients WHERE id = $1',
            req.params.id
        );
        
        if (rowCount === 0) {
            return res.status(404).json({ error: 'OAuth client not found' });
        }
        
        res.json({ message: 'OAuth client deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting OAuth client:', error);
        res.status(500).json({ error: 'Failed to delete OAuth client' });
    }
});

// ============================================================================
// Get Client Consents
// ============================================================================

/**
 * Get users who have granted consent to a client
 * GET /admin/oauth-clients/:id/consents
 */
router.get('/:id/consents', [
    param('id').isUUID()
], requirePermission('settings', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        const { page = '1', limit = '20' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT uc.*, u.email, u.first_name, u.last_name
            FROM oauth_user_consents uc
            JOIN core.users u ON uc.user_id = u.id
            WHERE uc.client_id = $1
            ORDER BY uc.granted_at DESC
            LIMIT $2 OFFSET $3
        `, [req.params.id, limit, offset]);
        
        const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            'SELECT COUNT(*) FROM oauth_user_consents WHERE client_id = $1',
            req.params.id
        );
        
        res.json({
            data: rows.map(row => ({
                id: row.id,
                user_id: row.user_id,
                user_email: row.email,
                user_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                granted_scopes: row.granted_scopes,
                granted_at: row.granted_at,
                revoked_at: row.revoked_at
            })),
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total: parseInt(String(countResult[0].count))
            }
        });
        
    } catch (error) {
        console.error('Error fetching consents:', error);
        res.status(500).json({ error: 'Failed to fetch consents' });
    }
});

/**
 * Revoke specific user consent
 * DELETE /admin/oauth-clients/:id/consents/:userId
 */
router.delete('/:id/consents/:userId', [
    param('id').isUUID(),
    param('userId').isUUID()
], requirePermission('settings', 'manage'), async (req: AdminRequest, res: Response) => {
    try {
        await SSOProvider.revokeUserConsent(req.params.userId, req.params.id);
        res.json({ message: 'User consent revoked successfully' });
    } catch (error) {
        console.error('Error revoking user consent:', error);
        res.status(500).json({ error: 'Failed to revoke user consent' });
    }
});

// ============================================================================
// Revoke All Tokens for Client
// ============================================================================

/**
 * Revoke all tokens for a client
 * POST /admin/oauth-clients/:id/revoke-all-tokens
 */
router.post('/:id/revoke-all-tokens', [
    param('id').isUUID()
], requirePermission('settings', 'manage'), async (req: AdminRequest, res: Response) => {
    try {
        // Revoke access tokens
        const atResult = await prisma.$executeRawUnsafe(`
            UPDATE oauth_access_tokens 
            SET is_revoked = true, revoked_at = NOW(), revoked_reason = 'Admin revocation'
            WHERE client_id = $1 AND is_revoked = false
        `, req.params.id);
        
        // Revoke refresh tokens
        const rtResult = await prisma.$executeRawUnsafe(`
            UPDATE oauth_refresh_tokens 
            SET is_revoked = true, revoked_at = NOW(), revoked_reason = 'Admin revocation'
            WHERE client_id = $1 AND is_revoked = false
        `, req.params.id);
        
        res.json({
            message: 'All tokens revoked',
            revoked: {
                access_tokens: atResult,
                refresh_tokens: rtResult
            }
        });
        
    } catch (error) {
        console.error('Error revoking tokens:', error);
        res.status(500).json({ error: 'Failed to revoke tokens' });
    }
});

// ============================================================================
// OAuth Audit Log
// ============================================================================

/**
 * Get OAuth audit log
 * GET /admin/oauth-clients/audit-log
 */
router.get('/audit-log', [
    query('client_id').optional().isUUID(),
    query('user_id').optional().isUUID(),
    query('event_type').optional()
], requirePermission('audit', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        const { page = '1', limit = '50', client_id, user_id, event_type } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;
        
        if (client_id) {
            whereClause += ` AND ol.client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }
        
        if (user_id) {
            whereClause += ` AND ol.user_id = $${paramIndex}`;
            params.push(user_id);
            paramIndex++;
        }
        
        if (event_type) {
            whereClause += ` AND ol.event_type = $${paramIndex}`;
            params.push(event_type);
            paramIndex++;
        }
        
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT ol.*, oc.name as client_name, u.email as user_email
            FROM oauth_audit_log ol
            LEFT JOIN oauth_clients oc ON ol.client_id = oc.id
            LEFT JOIN core.users u ON ol.user_id = u.id
            ${whereClause}
            ORDER BY ol.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, [...params, limit, offset]);
        
        const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) FROM oauth_audit_log ol ${whereClause}`,
            ...params
        );
        
        res.json({
            data: rows,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total: parseInt(String(countResult[0].count))
            }
        });
        
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

export default router;
