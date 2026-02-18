import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

// Demo fallback data for environments without DB configured
const demoLanguages = [
  { id: 'en', code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_active: true, is_default: true, flag_emoji: '🇺🇸' },
  { id: 'es', code: 'es', name: 'Spanish', native_name: 'Español', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇪🇸' },
  { id: 'fr', code: 'fr', name: 'French', native_name: 'Français', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇫🇷' },
  { id: 'de', code: 'de', name: 'German', native_name: 'Deutsch', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇩🇪' },
  { id: 'th', code: 'th', name: 'Thai', native_name: 'ไทย', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇹🇭' },
];

const demoKeys = [
  { key: 'ui.welcome.title', category: 'ui', description: 'Welcome screen title' },
  { key: 'ui.welcome.subtitle', category: 'ui', description: 'Welcome screen subtitle' },
  { key: 'ui.button.save', category: 'ui', description: 'Save button text' },
  { key: 'ui.button.cancel', category: 'ui', description: 'Cancel button text' },
  { key: 'nav.home', category: 'navigation', description: 'Home' },
  { key: 'nav.settings', category: 'navigation', description: 'Settings' },
];

const demoEnMap: Record<string, string> = {
  'ui.welcome.title': 'Welcome to AppKit',
  'ui.welcome.subtitle': 'Connect with your circle safely',
  'ui.button.save': 'Save',
  'ui.button.cancel': 'Cancel',
  'nav.home': 'Home',
  'nav.settings': 'Settings',
};

const router = Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Helper to check if table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      tableName
    );
    return result[0]?.exists === true;
  } catch {
    return false;
  }
}

// GET /cms/localization/languages
router.get('/languages', requirePermission('localization', 'view'), async (_req, res) => {
  try {
    const exists = await tableExists('languages');
    if (!exists) {
      const sorted = [...demoLanguages].sort((a, b) => 
        (b.is_default === true ? 1 : 0) - (a.is_default === true ? 1 : 0) || a.code.localeCompare(b.code)
      );
      return res.json({ languages: sorted });
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, code, name, native_name, direction, is_active, is_default, flag_emoji 
       FROM core.languages ORDER BY is_default DESC, code ASC`
    );

    const result = rows.length > 0 ? rows : demoLanguages;
    return res.json({ languages: result });
  } catch (e: any) {
    console.error('Error loading languages:', e);
    return res.json({ languages: demoLanguages });
  }
});

// POST /cms/localization/languages
router.post('/languages', async (req, res) => {
  try {
    const { code, name, native_name, direction = 'ltr', is_active = true, is_default = false, flag_emoji } = req.body || {};

    if (!code || !name) return res.status(400).json({ error: 'code and name are required' });

    // Ensure only one default language
    if (is_default) {
      await prisma.$executeRawUnsafe('UPDATE core.languages SET is_default = false WHERE code != $1', code);
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO core.languages (code, name, native_name, direction, is_active, is_default, flag_emoji)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (code) DO UPDATE SET 
         name = EXCLUDED.name, native_name = EXCLUDED.native_name, direction = EXCLUDED.direction,
         is_active = EXCLUDED.is_active, is_default = EXCLUDED.is_default, flag_emoji = EXCLUDED.flag_emoji
       RETURNING id, code, name, native_name, direction, is_active, is_default, flag_emoji`,
      code, name, native_name || name, direction, is_active, is_default, flag_emoji
    );

    return res.status(201).json({ language: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to create language' });
  }
});

// PUT /cms/localization/languages/:id
router.put('/languages/:id', requirePermission('localization', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, native_name, direction, is_active, is_default, flag_emoji } = req.body || {};

    if (is_default === true) {
      await prisma.$executeRawUnsafe('UPDATE core.languages SET is_default = false WHERE id != $1', id);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(name); }
    if (native_name !== undefined) { updates.push(`native_name = $${paramIndex++}`); params.push(native_name); }
    if (direction !== undefined) { updates.push(`direction = $${paramIndex++}`); params.push(direction); }
    if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(is_active); }
    if (is_default !== undefined) { updates.push(`is_default = $${paramIndex++}`); params.push(is_default); }
    if (flag_emoji !== undefined) { updates.push(`flag_emoji = $${paramIndex++}`); params.push(flag_emoji); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE core.languages SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} 
       RETURNING id, code, name, native_name, direction, is_active, is_default, flag_emoji`,
      ...params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Language not found' });
    }

    return res.json({ language: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to update language' });
  }
});

// DELETE /cms/localization/languages/:id
router.delete('/languages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$executeRawUnsafe('DELETE FROM core.languages WHERE id = $1', id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to delete language' });
  }
});

// GET /cms/localization/categories
router.get('/categories', requirePermission('localization', 'view'), async (_req, res) => {
  try {
    const exists = await tableExists('translation_keys');
    if (!exists) {
      const unique = Array.from(new Set(demoKeys.map(k => k.category)));
      const categories = unique.map((name: string) => ({ id: name, name, description: '', color: '#6B7280' }));
      return res.json(categories);
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT DISTINCT category FROM translation_keys WHERE is_active = true'
    );

    const unique = rows.map((r: any) => r.category).filter(Boolean);
    const categories = unique.map((name: string) => ({ id: name, name, description: '', color: '#6B7280' }));
    return res.json(categories.length > 0 ? categories : [{ id: 'general', name: 'general', description: '', color: '#6B7280' }]);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to load categories' });
  }
});

// GET /cms/localization/keys
router.get('/keys', async (req, res) => {
  try {
    const exists = await tableExists('translation_keys');
    const { category, search, active_only } = req.query as any;

    if (!exists) {
      const filtered = demoKeys
        .filter(k => !category || k.category === category)
        .filter(k => !search || k.key.toLowerCase().includes(String(search).toLowerCase()));
      return res.json({ keys: filtered });
    }

    let sql = 'SELECT id, key, category, description, context, is_active FROM translation_keys WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) { sql += ` AND category = $${paramIndex++}`; params.push(category); }
    if (active_only === 'true') { sql += ' AND is_active = true'; }
    if (search) { sql += ` AND key ILIKE $${paramIndex++}`; params.push(`%${search}%`); }

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    return res.json({ keys: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to load translation keys' });
  }
});

// GET /cms/timezones
router.get('/timezones', requirePermission('localization', 'view'), async (_req, res) => {
  const timezones = [
    { id: 'America/New_York', name: 'Eastern Time', offset: 'UTC-05:00', region: 'North America' },
    { id: 'America/Los_Angeles', name: 'Pacific Time', offset: 'UTC-08:00', region: 'North America' },
    { id: 'Europe/London', name: 'Greenwich Mean Time', offset: 'UTC+00:00', region: 'Europe' },
    { id: 'Asia/Tokyo', name: 'Japan Standard Time', offset: 'UTC+09:00', region: 'Asia' },
    { id: 'Asia/Bangkok', name: 'Thailand Time', offset: 'UTC+07:00', region: 'Asia' },
  ];
  return res.json({ timezones });
});

// GET /cms/localization/translations
router.get('/translations', async (req, res) => {
  try {
    const exists = await tableExists('translations');
    const { language_id: languageId, category, page = '1', page_size = '50', search } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(page_size) || 50, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    if (!exists) {
      // Return demo data
      const filtered = demoKeys
        .filter(k => !category || category === 'all' || k.category === category)
        .filter(k => !search || k.key.toLowerCase().includes(search.toLowerCase()));
      const slice = filtered.slice(offset, offset + pageSize);
      const translations = slice.map(k => ({
        id: `${k.key}-en`,
        value: demoEnMap[k.key] || '',
        is_approved: true,
        translation_keys: { key: k.key, category: k.category, description: k.description },
        languages: { id: 'en', code: 'en' },
      }));
      return res.json({ translations });
    }

    let sql = `
      SELECT t.id, t.value, t.is_approved, t.approved_at, t.created_at, t.updated_at,
             json_build_object('id', tk.id, 'key', tk.key, 'category', tk.category, 'description', tk.description) as translation_keys,
             json_build_object('id', l.id, 'code', l.code) as languages
      FROM translations t
      JOIN translation_keys tk ON t.key_id = tk.id
      JOIN core.languages l ON t.language_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (languageId) { sql += ` AND t.language_id = $${paramIndex++}`; params.push(languageId); }
    if (category && category !== 'all') { sql += ` AND tk.category = $${paramIndex++}`; params.push(category); }
    if (search) { sql += ` AND tk.key ILIKE $${paramIndex++}`; params.push(`%${search}%`); }

    sql += ` ORDER BY t.updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(pageSize, offset);

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    return res.json({ translations: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to load translations' });
  }
});

// GET /cms/localization/translations/:langCode
router.get('/translations/:langCode', requirePermission('localization', 'view'), async (req, res) => {
  try {
    const { langCode } = req.params;
    const exists = await tableExists('translations');

    if (!exists) {
      return res.json({ translations: langCode === 'en' ? demoEnMap : {} });
    }

    const langRows = await prisma.$queryRawUnsafe<any[]>('SELECT id FROM core.languages WHERE code = $1', langCode);
    if (langRows.length === 0) {
      return res.json({ translations: langCode === 'en' ? demoEnMap : {} });
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT tk.key, t.value FROM translations t
       JOIN translation_keys tk ON t.key_id = tk.id
       WHERE t.language_id = $1 AND (t.is_approved IS NULL OR t.is_approved = true)`,
      langRows[0].id
    );

    const map: Record<string, string> = {};
    rows.forEach((row: any) => { map[row.key] = row.value; });

    if (Object.keys(map).length === 0 && langCode === 'en') {
      return res.json({ translations: demoEnMap });
    }

    return res.json({ translations: map });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to load translations' });
  }
});

// POST /cms/localization/translations
router.post('/translations', requirePermission('localization', 'create'), async (req, res) => {
  try {
    const { key, value, language, category, description, isActive, isApproved } = req.body || {};
    if (!key || !value || !language) {
      return res.status(400).json({ error: 'key, value, and language are required' });
    }

    // Upsert key
    const keyRows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO translation_keys (key, category, description, is_active, context)
       VALUES ($1, $2, $3, $4, 'mobile_app')
       ON CONFLICT (key) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description
       RETURNING id`,
      key, category || 'general', description || null, isActive !== false
    );

    // Find language id
    const langRows = await prisma.$queryRawUnsafe<any[]>('SELECT id FROM core.languages WHERE code = $1', language);
    if (langRows.length === 0) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    // Upsert translation
    const txRows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO translations (key_id, language_id, value, is_approved)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key_id, language_id) DO UPDATE SET value = EXCLUDED.value, is_approved = EXCLUDED.is_approved
       RETURNING id, value, is_approved, key_id, language_id`,
      keyRows[0].id, langRows[0].id, value, Boolean(isApproved)
    );

    return res.status(201).json({ translation: txRows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to create translation' });
  }
});

// PUT /cms/localization/translations/:id
router.put('/translations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { value, isApproved } = req.body || {};

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (value !== undefined) { updates.push(`value = $${paramIndex++}`); params.push(value); }
    if (isApproved !== undefined) { updates.push(`is_approved = $${paramIndex++}`); params.push(isApproved); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE translations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      ...params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    return res.json({ translation: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to update translation' });
  }
});

// DELETE /cms/localization/translations/:id
router.delete('/translations/:id', requirePermission('localization', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$executeRawUnsafe('DELETE FROM translations WHERE id = $1', id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to delete translation' });
  }
});

export default router;
