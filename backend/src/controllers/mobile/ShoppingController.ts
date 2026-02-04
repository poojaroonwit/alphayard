import { Request, Response } from 'express';
import shoppingService from '../../services/shoppingService';

export class ShoppingController {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const result = await shoppingService.list(userId);
            res.json({ success: true, data: result.entities });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const itemData = { ...req.body, userId: (req as any).user.id };
            const item = await shoppingService.create(itemData);
            res.status(201).json({ success: true, data: item });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const item = await shoppingService.update(req.params.id, req.body);
            res.json({ success: true, data: item });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async remove(req: Request, res: Response) {
        try {
            await shoppingService.delete(req.params.id);
            res.json({ success: true, message: 'Item deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new ShoppingController();
