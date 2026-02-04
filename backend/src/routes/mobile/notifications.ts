import { Router } from 'express';

const router = Router();

// Minimal notification routes to stop mobile 404s
router.get('/', (req, res) => {
  // Return empty list safely
  res.json({ success: true, data: [] });
});

router.get('/unread-count', (req, res) => {
  res.json({ success: true, data: { count: 0 } });
});

router.get('/settings/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      types: {
         info: true,
         success: true,
         warning: true,
         error: true,
         system: true,
         Circle: true,
         finance: true,
         health: true
      }
    }
  });
});

export default router;
