import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import entityService from '../../services/EntityService';

const router = express.Router();

// Map emotion_type strings to numeric values
const emotionTypeToNumber = (emotionType: string): number => {
    switch (emotionType) {
        case 'very_bad': return 1;
        case 'bad': return 2;
        case 'neutral': return 3;
        case 'good': return 4;
        case 'very_good': return 5;
        default: return 3;
    }
};

const numberToEmotionType = (num: number): string => {
    switch (num) {
        case 1: return 'very_bad';
        case 2: return 'bad';
        case 3: return 'neutral';
        case 4: return 'good';
        case 5: return 'very_good';
        default: return 'neutral';
    }
};

router.use(authenticateToken as any);

router.get('/history', async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        const days = parseInt(req.query.days as string) || 30;

        const result = await entityService.queryEntities('emotion_record', {
            ownerId: userId,
            limit: 100
        });

        const emotions = result.entities.map(e => ({
            id: e.id,
            user_id: e.ownerId,
            emotion: emotionTypeToNumber(e.attributes.emotion_type),
            date: new Date(e.createdAt).toISOString().split('T')[0],
            created_at: e.createdAt,
            notes: e.attributes.notes,
        }));

        res.json({
            success: true,
            data: {
                emotions,
                summary: { totalEntries: result.total, averageMood: 3, moodTrend: 'stable', topEmotions: [] },
                period: { days, startDate: new Date().toISOString(), endDate: new Date().toISOString() }
            }
        });
    } catch (error) {
        console.error('Get emotion history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        const { emotion, notes } = req.body;

        const entity = await entityService.createEntity({
            typeName: 'emotion_record',
            ownerId: userId,
            applicationId: req.user.circleId,
            attributes: {
                emotion_type: numberToEmotionType(emotion),
                notes
            }
        });

        res.json({
            success: true,
            message: 'Emotion logged successfully',
            entry: {
                id: entity.id,
                user_id: entity.ownerId,
                emotion: emotionTypeToNumber(entity.attributes.emotion_type),
                date: new Date(entity.createdAt).toISOString().split('T')[0],
                notes: entity.attributes.notes,
                timestamp: entity.createdAt,
            }
        });
    } catch (error: any) {
        console.error('Log emotion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/stats', async (req: any, res: any) => {
    try {
        res.json({
            success: true,
            stats: { totalEntries: 0, streakDays: 0, averageMood: null, mostFrequentEmotion: null, lastEntry: null }
        });
    } catch (error) {
        console.error('Get emotion stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
