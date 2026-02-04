import express from 'express';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import entityService from '../../services/EntityService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

// Get safety incidents
router.get('/incidents', requireCircleMember as any, async (req: any, res: any) => {
  try {
    const result = await entityService.queryEntities('safety_incident', {
        applicationId: req.circleId
    });
    res.json({ 
        incidents: result.entities.map((e: any) => ({ ...e.attributes, id: e.id, createdAt: e.createdAt })) 
    });
  } catch (error) {
    console.error('Get safety incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single safety incident
router.get('/incidents/:id', async (req: any, res: any) => {
  try {
    const incident = await entityService.getEntity(req.params.id);
    if (!incident || incident.type !== 'safety_incident') {
      return res.status(404).json({ error: 'Safety incident not found' });
    }
    res.json({ incident: { ...(incident as any).attributes, id: incident.id } });
  } catch (error) {
    console.error('Get safety incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge safety incident
router.patch('/incidents/:id/acknowledge', async (req: any, res: any) => {
  try {
    const updated = await entityService.updateEntity(req.params.id, {
        attributes: { acknowledgedAt: new Date().toISOString(), acknowledgedBy: req.user.id }
    });
    res.json({ success: true, incident: updated });
  } catch (error) {
    console.error('Acknowledge safety incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve safety incident
router.patch('/incidents/:id/resolve', async (req: any, res: any) => {
  try {
    const updated = await entityService.updateEntity(req.params.id, {
        attributes: { resolvedAt: new Date().toISOString(), isResolved: true }
    });
    res.json({ success: true, incident: updated });
  } catch (error) {
    console.error('Resolve safety incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
