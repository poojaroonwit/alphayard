import express from 'express';
import { authenticateToken, optionalCircleMember } from '../../middleware/auth';
// import SocialController from '../../controllers/mobile/SocialController';

const router = express.Router();

router.use(authenticateToken as any);
router.use(optionalCircleMember as any);

// Temporarily disabled - controller needs more methods
// TODO: Implement all required SocialController methods

// Mock endpoint to prevent 404s
router.get('/', (req, res) => {
  res.json({ success: true, posts: [], message: 'Social endpoint temporarily disabled' });
});

router.get('/posts', (req, res) => {
  res.json({ success: true, posts: [], message: 'Social endpoint temporarily disabled' });
});

export default router;
