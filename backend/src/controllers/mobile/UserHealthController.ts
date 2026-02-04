import { Request, Response } from 'express';
import userHealthService from '../../services/userHealthService';

export class UserHealthController {
    async getMetrics(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { type } = req.query;
            const result = await userHealthService.getMetrics(userId, type as string);
            res.json({ success: true, data: result.entities });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async addMetric(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const metric = await userHealthService.addMetric(userId, req.body);
            res.status(201).json({ success: true, data: metric });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new UserHealthController();
