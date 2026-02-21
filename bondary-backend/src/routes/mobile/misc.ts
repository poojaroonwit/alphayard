
import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import { countryService } from '../../services/countryService';

const router = express.Router();

/**
 * GET /api/v1/misc/countries
 * Get all supported countries
 */
router.get('/countries', async (_req, res) => {
    try {
        const countries = await countryService.getAllCountries();
        res.json({ success: true, data: countries });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/sandbox
 * Sandbox endpoint for testing
 */
router.get('/sandbox', async (_req, res) => {
    try {
        res.json({ 
            success: true,
            message: 'Sandbox endpoint is working',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    } catch (error) {
        console.error('Error in sandbox:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
