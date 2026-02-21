import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * POST /feedback/submit
 * Submit general feedback
 */
router.post('/submit', [
  body('type').isIn(['bug', 'feature', 'general', 'complaint', 'praise']).withMessage('Invalid feedback type'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('category').optional().isIn(['ui', 'performance', 'feature', 'bug', 'other'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type, message, category, rating } = req.body;

    // In a real implementation, this would save to database
    console.log('Feedback submitted:', { userId, type, message, category, rating });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: `FB_${Date.now()}`,
      response: 'Thank you for your feedback! We\'ll review it and get back to you if needed.'
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * POST /feedback/bug
 * Submit bug report
 */
router.post('/bug', [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('steps').optional().trim(),
  body('expected').optional().trim(),
  body('actual').optional().trim(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, description, steps, expected, actual, severity, deviceInfo } = req.body;

    // In a real implementation, this would save to database
    console.log('Bug report submitted:', { 
      userId, title, description, steps, expected, actual, severity, deviceInfo 
    });

    res.json({
      success: true,
      message: 'Bug report submitted successfully',
      bugId: `BUG_${Date.now()}`,
      response: 'Thank you for reporting this bug! Our team will investigate and fix it as soon as possible.'
    });
  } catch (error: any) {
    console.error('Error submitting bug report:', error);
    res.status(500).json({ error: 'Failed to submit bug report' });
  }
});

export default router;
