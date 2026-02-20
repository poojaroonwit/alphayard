import express, { Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import UserHealthController from '../../controllers/mobile/UserHealthController';
import healthService from '../../services/healthService';

const router = express.Router();

router.use(authenticateToken as any);

// Legacy endpoints (using entity service)
router.get('/metrics', UserHealthController.getMetrics);
router.post('/metrics', UserHealthController.addMetric);

// ==================
// ENHANCED METRICS ROUTES
// ==================

/**
 * GET /api/v1/health/metrics/enhanced
 * Get health metrics with advanced filtering
 */
router.get('/metrics/enhanced', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { metricType, startDate, endDate, limit, offset } = req.query;

    const result = await healthService.getMetrics(userId, {
      metricType: metricType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Health] Error getting metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/health/metrics/:id
 * Get a specific health metric
 */
router.get('/metrics/:id', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const metric = await healthService.getMetricById(id, userId);

    if (!metric) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }

    res.json({ success: true, metric });
  } catch (error: any) {
    console.error('[Health] Error getting metric:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/health/metrics/enhanced
 * Create a new health metric with enhanced features
 */
router.post('/metrics/enhanced', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { metricType, value, unit, secondaryValue, source, notes, recordedAt } = req.body;

    if (!metricType || value === undefined) {
      return res.status(400).json({ success: false, error: 'metricType and value are required' });
    }

    const metric = await healthService.createMetric({
      userId,
      metricType,
      value,
      unit,
      secondaryValue,
      source,
      notes,
      recordedAt,
    });

    if (!metric) {
      return res.status(500).json({ success: false, error: 'Failed to create metric' });
    }

    res.status(201).json({ success: true, metric });
  } catch (error: any) {
    console.error('[Health] Error creating metric:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/health/metrics/:id
 * Update a health metric
 */
router.put('/metrics/:id', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { value, secondaryValue, notes, recordedAt } = req.body;

    const metric = await healthService.updateMetric(id, userId, {
      value,
      secondaryValue,
      notes,
      recordedAt,
    });

    if (!metric) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }

    res.json({ success: true, metric });
  } catch (error: any) {
    console.error('[Health] Error updating metric:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/health/metrics/:id
 * Delete a health metric
 */
router.delete('/metrics/:id', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await healthService.deleteMetric(id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Health] Error deleting metric:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================
// GOALS ROUTES
// ==================

/**
 * GET /api/v1/health/goals
 * Get health goals for the authenticated user
 */
router.get('/goals', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { activeOnly } = req.query;

    const goals = await healthService.getGoals(userId, activeOnly !== 'false');

    res.json({ success: true, goals });
  } catch (error: any) {
    console.error('[Health] Error getting goals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/health/goals
 * Create a new health goal
 */
router.post('/goals', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { metricType, targetValue, period } = req.body;

    if (!metricType || targetValue === undefined) {
      return res.status(400).json({ success: false, error: 'metricType and targetValue are required' });
    }

    const goal = await healthService.createGoal({
      userId,
      metricType,
      targetValue,
      period,
    });

    if (!goal) {
      return res.status(500).json({ success: false, error: 'Failed to create goal' });
    }

    res.status(201).json({ success: true, goal });
  } catch (error: any) {
    console.error('[Health] Error creating goal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/health/goals/:id
 * Update a health goal
 */
router.put('/goals/:id', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { targetValue, isActive } = req.body;

    const goal = await healthService.updateGoal(id, userId, {
      targetValue,
      isActive,
    });

    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    res.json({ success: true, goal });
  } catch (error: any) {
    console.error('[Health] Error updating goal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/health/goals/:id
 * Delete a health goal
 */
router.delete('/goals/:id', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await healthService.deleteGoal(id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Health] Error deleting goal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================
// ANALYTICS ROUTES
// ==================

/**
 * GET /api/v1/health/dashboard
 * Get health dashboard with summary data
 */
router.get('/dashboard', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const dashboard = await healthService.getDashboard(userId);

    res.json({ success: true, ...dashboard });
  } catch (error: any) {
    console.error('[Health] Error getting dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/health/metrics/:metricType/summary
 * Get summary statistics for a specific metric type
 */
router.get('/metrics/:metricType/summary', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { metricType } = req.params;
    const { period } = req.query;

    const summary = await healthService.getMetricSummary(
      userId,
      metricType,
      (period as string) || 'week'
    );

    res.json({ success: true, summary });
  } catch (error: any) {
    console.error('[Health] Error getting metric summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/health/metrics/batch
 * Create multiple metrics at once (useful for syncing from health apps)
 */
router.post('/metrics/batch', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { metrics } = req.body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ success: false, error: 'metrics array is required' });
    }

    const results = await Promise.all(
      metrics.map(m => healthService.createMetric({
        userId,
        metricType: m.metricType,
        value: m.value,
        unit: m.unit,
        secondaryValue: m.secondaryValue,
        source: m.source || 'sync',
        notes: m.notes,
        recordedAt: m.recordedAt,
      }))
    );

    const created = results.filter(Boolean);

    res.status(201).json({
      success: true,
      created: created.length,
      failed: metrics.length - created.length,
    });
  } catch (error: any) {
    console.error('[Health] Error batch creating metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/health/supported-metrics
 * Get list of supported metric types with their details
 */
router.get('/supported-metrics', (req: any, res: Response) => {
  const supportedMetrics = [
    { type: 'steps', name: 'Steps', unit: 'steps', icon: 'footprints', color: '#3B82F6' },
    { type: 'heart_rate', name: 'Heart Rate', unit: 'bpm', icon: 'heart', color: '#EF4444' },
    { type: 'sleep', name: 'Sleep', unit: 'hours', icon: 'moon', color: '#8B5CF6' },
    { type: 'weight', name: 'Weight', unit: 'kg', icon: 'scale', color: '#10B981' },
    { type: 'blood_pressure', name: 'Blood Pressure', unit: 'mmHg', icon: 'activity', color: '#F59E0B', hasSecondary: true },
    { type: 'blood_glucose', name: 'Blood Glucose', unit: 'mg/dL', icon: 'droplet', color: '#EC4899' },
    { type: 'water', name: 'Water Intake', unit: 'ml', icon: 'droplets', color: '#06B6D4' },
    { type: 'calories', name: 'Calories', unit: 'kcal', icon: 'flame', color: '#F97316' },
    { type: 'distance', name: 'Distance', unit: 'km', icon: 'map-pin', color: '#14B8A6' },
    { type: 'active_minutes', name: 'Active Minutes', unit: 'minutes', icon: 'timer', color: '#6366F1' },
  ];

  res.json({ success: true, metrics: supportedMetrics });
});

export default router;
