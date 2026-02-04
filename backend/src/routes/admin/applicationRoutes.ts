import express, { Response } from 'express';
import { ApplicationModel } from '../../models/ApplicationModel';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validation';

const router = express.Router();

// All application management routes require admin authentication
router.use(authenticateAdmin as any);

// List all applications
router.get('/', async (req: any, res: Response) => {
    try {
        const applications = await ApplicationModel.findAll();
        res.json({ applications });
    } catch (error) {
        console.error('List applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Create new application
router.post('/', [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('slug').trim().isLength({ min: 1 }).withMessage('Slug is required'),
], validateRequest, async (req: any, res: Response) => {
    try {
        const application = await ApplicationModel.create(req.body);
        res.status(201).json({ application });
    } catch (error: any) {
        console.error('Create application error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// Update application
router.put('/:id', async (req: any, res: Response) => {
    try {
        const application = await ApplicationModel.update(req.params.id, req.body);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ application });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

export default router;
