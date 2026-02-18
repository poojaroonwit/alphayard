import { Router, Response } from 'express';
import { authenticateAdmin, AdminRequest } from '../../middleware/adminAuth';
import { prisma } from '../../lib/prisma';

const router = Router();

// Ensure preferences table exists and has correct schema
const ensurePreferencesTable = async () => {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS admin_user_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                preference_key VARCHAR(255) NOT NULL,
                preference_value JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, preference_key)
            );
            CREATE INDEX IF NOT EXISTS idx_preferences_user ON admin_user_preferences(user_id);
            CREATE INDEX IF NOT EXISTS idx_preferences_key ON admin_user_preferences(preference_key);
        `);

        // Migration: Ensure user_id is VARCHAR (handle legacy UUID columns)
        // Temporarily disabled to prevent server hanging
        /*
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                -- Check if user_id is UUID via information_schema or try casting
                -- Simpler approach: Try to alter, if it fails because of cast issues, we might need a more complex migration
                -- But since we likely don't have production data yet, we can try to alter type.
                BEGIN
                    ALTER TABLE admin_user_preferences ALTER COLUMN user_id TYPE VARCHAR(255);
                EXCEPTION WHEN OTHERS THEN
                    NULL; -- Ignore if already converted or compatible
                END;
            END $$;
        `);
        */
    } catch (err) {
        console.log('Preferences table setup error:', err);
    }
};

// Initialize table on first load
ensurePreferencesTable();

// Get a preference by key
router.get('/:key', authenticateAdmin as any, async (req: AdminRequest, res: Response) => {
    try {
        const { key } = req.params;
        const userId = req.admin?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT preference_value FROM admin_user_preferences WHERE user_id = $1 AND preference_key = $2`,
            userId, key
        );

        if (rows.length === 0) {
            return res.json({ value: null });
        }

        res.json({ value: rows[0].preference_value });
    } catch (error: any) {
        console.error('Get preference error:', error);
        res.status(500).json({ error: 'Failed to get preference' });
    }
});

// Set a preference
router.put('/:key', authenticateAdmin as any, async (req: AdminRequest, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const userId = req.admin?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        await prisma.$executeRawUnsafe(
            `INSERT INTO admin_user_preferences (user_id, preference_key, preference_value)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, preference_key) 
             DO UPDATE SET preference_value = $3, updated_at = NOW()`,
            userId, key, JSON.stringify(value)
        );

        res.json({ success: true, key, value });
    } catch (error: any) {
        console.error('Set preference error:', error);
        res.status(500).json({ error: 'Failed to set preference' });
    }
});

// Delete a preference
router.delete('/:key', authenticateAdmin as any, async (req: AdminRequest, res: Response) => {
    try {
        const { key } = req.params;
        const userId = req.admin?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        await prisma.$executeRawUnsafe(
            `DELETE FROM admin_user_preferences WHERE user_id = $1 AND preference_key = $2`,
            userId, key
        );

        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete preference error:', error);
        res.status(500).json({ error: 'Failed to delete preference' });
    }
});

// Get all preferences for current user
router.get('/', authenticateAdmin as any, async (req: AdminRequest, res: Response) => {
    try {
        const userId = req.admin?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT preference_key, preference_value FROM admin_user_preferences WHERE user_id = $1`,
            userId
        );

        const preferences: Record<string, any> = {};
        rows.forEach(row => {
            preferences[row.preference_key] = row.preference_value;
        });

        res.json({ preferences });
    } catch (error: any) {
        console.error('Get all preferences error:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});

export default router;
