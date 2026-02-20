import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import entityService from '../../services/EntityService';

const router = express.Router();

// Development mock removed as we now have a working EntityService

// All other routes require auth
router.use(authenticateToken as any);

// Get events
router.get(
  '/events',
  [
    queryValidator('startDate').optional().isISO8601(),
    queryValidator('endDate').optional().isISO8601(),
    queryValidator('type').optional().isString(),
    queryValidator('circleId').optional().isUUID(),
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { startDate, endDate, type, circleId: querycircleId } = req.query as Record<string, string>;
      const circleId = querycircleId || req.user?.circleId;

      if (!circleId) {
        return res.json({ events: [] });
      }

      const filters: any = {
          applicationId: circleId,
          status: 'active'
      };

      if (type) filters['data->>type'] = type;
      if (startDate) filters['data->>startDate'] = { '>=': startDate };
      if (endDate) filters['data->>endDate'] = { '<=': endDate };

      const result = await entityService.queryEntities('event', {
          ...filters,
          sortBy: 'data->>startDate',
          sortOrder: 'ASC'
      } as any);

      return res.json({ 
          events: result.entities.map(e => ({ ...e.attributes, id: e.id, createdAt: e.createdAt })) 
      });
    } catch (error) {
      console.error('Get events error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get single event
router.get('/events/:eventId', requireCircleMember as any, async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    const entity = await entityService.getEntity(eventId);
    if (!entity) return res.status(404).json({ error: 'Event not found' });
    return res.json({ ...entity.attributes, id: entity.id });
  } catch (error) {
    console.error('Get event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event
router.post(
  '/events',
  [
    requireCircleMember as any,
    body('title').isString().isLength({ min: 1 }),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const circleId = req.user.circleId;
      const entity = await entityService.createEntity({
          typeName: 'event',
          ownerId: req.user.id,
          applicationId: circleId,
          attributes: {
              ...req.body
          }
      });

      return res.status(201).json({ event: { ...entity.attributes, id: entity.id } });
    } catch (error) {
      console.error('Create event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update event
router.put(
  '/events/:eventId',
  [
    requireCircleMember as any,
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { eventId } = req.params;
      const updated = await entityService.updateEntity(eventId, { attributes: req.body });

      if (!updated) return res.status(404).json({ error: 'Event not found' });

      return res.json({ event: { ...updated.attributes, id: updated.id } });
    } catch (error) {
      console.error('Update event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete event
router.delete('/events/:eventId', requireCircleMember as any, async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    await entityService.deleteEntity(eventId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendees
router.post('/events/:eventId/attendees', requireCircleMember as any, async (req: any, res: any) => {
    try {
        const { eventId } = req.params;
        const { attendeeId } = req.body;
        const entity = await entityService.getEntity(eventId);
        if (!entity) return res.status(404).json({ error: 'Event not found' });
        
        const attendees = entity.attributes.attendees || [];
        if (!attendees.includes(attendeeId)) {
            attendees.push(attendeeId);
            await entityService.updateEntity(eventId, { attributes: { attendees } });
        }
        
        return res.json({ ...entity.attributes, attendees, id: entity.id });
    } catch (error) {
        console.error('Add attendee error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/events/:eventId/attendees/:attendeeId', requireCircleMember as any, async (req: any, res: any) => {
    try {
        const { eventId, attendeeId } = req.params;
        const entity = await entityService.getEntity(eventId);
        if (!entity) return res.status(404).json({ error: 'Event not found' });
        
        let attendees = entity.attributes.attendees || [];
        attendees = attendees.filter((id: string) => id !== attendeeId);
        await entityService.updateEntity(eventId, { attributes: { attendees } });
        
        return res.json({ ...entity.attributes, attendees, id: entity.id });
    } catch (error) {
        console.error('Remove attendee error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Reminders
router.post('/events/:eventId/reminders', requireCircleMember as any, async (req: any, res: any) => {
    try {
        const { eventId } = req.params;
        const reminder = req.body;
        const entity = await entityService.getEntity(eventId);
        if (!entity) return res.status(404).json({ error: 'Event not found' });
        
        const reminders = entity.attributes.reminders || [];
        reminders.push(reminder);
        await entityService.updateEntity(eventId, { attributes: { reminders } });
        
        return res.json({ ...entity.attributes, reminders, id: entity.id });
    } catch (error) {
        console.error('Add reminder error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/events/:eventId/reminders/:index', requireCircleMember as any, async (req: any, res: any) => {
    try {
        const { eventId, index } = req.params;
        const entity = await entityService.getEntity(eventId);
        if (!entity) return res.status(404).json({ error: 'Event not found' });
        
        let reminders = entity.attributes.reminders || [];
        reminders.splice(parseInt(index, 10), 1);
        await entityService.updateEntity(eventId, { attributes: { reminders } });
        
        return res.json({ ...entity.attributes, reminders, id: entity.id });
    } catch (error) {
        console.error('Remove reminder error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;



