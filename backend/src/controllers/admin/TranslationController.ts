import { Request, Response } from 'express';
import { Pool } from 'pg';
import { pool } from '../../config/database';

export class TranslationController {
    private pool: Pool;

    constructor() {
        this.pool = pool;
    }

    // GET /api/v1/translations
    // Fetch all translations as a key-value map for each language
    public getAllTranslations = async (req: Request, res: Response) => {
        try {
            const result = await this.pool.query('SELECT key, en, th FROM translations');

            const en: Record<string, string> = {};
            const th: Record<string, string> = {};

            result.rows.forEach(row => {
                if (row.en) en[row.key] = row.en;
                if (row.th) th[row.key] = row.th;
            });

            res.json({
                success: true,
                data: { en, th }
            });
        } catch (error) {
            console.error('Error fetching translations:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };

    // POST /api/v1/translations
    // Create or Update a translation
    public upsertTranslation = async (req: Request, res: Response) => {
        const { key, en, th } = req.body;

        if (!key) {
            return res.status(400).json({ success: false, message: 'Key is required' });
        }

        try {
            const query = `
        INSERT INTO translations (key, en, th)
        VALUES ($1, $2, $3)
        ON CONFLICT (key)
        DO UPDATE SET en = EXCLUDED.en, th = EXCLUDED.th, updated_at = NOW()
        RETURNING *;
      `;

            const result = await this.pool.query(query, [key, en, th]);

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error upserting translation:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };

    // DELETE /api/v1/translations/:key
    // Delete a translation by key
    public deleteTranslation = async (req: Request, res: Response) => {
        const { key } = req.params;

        try {
            await this.pool.query('DELETE FROM translations WHERE key = $1', [key]);
            res.json({ success: true, message: 'Translation deleted' });
        } catch (error) {
            console.error('Error deleting translation:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
}
