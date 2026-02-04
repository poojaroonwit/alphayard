import { Request, Response } from 'express';
import todosService from '../../services/todosService';

export class TodosController {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const result = await todosService.list(userId);
            res.json({ success: true, data: result.entities });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const todoData = { ...req.body, userId: (req as any).user.id };
            const todo = await todosService.create(todoData);
            res.status(201).json({ success: true, data: todo });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const todo = await todosService.update(req.params.id, req.body);
            res.json({ success: true, data: todo });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async remove(req: Request, res: Response) {
        try {
            await todosService.delete(req.params.id);
            res.json({ success: true, message: 'Todo deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async reorder(req: Request, res: Response) {
        try {
            const { orderedIds } = req.body;
            await todosService.reorder(orderedIds);
            res.json({ success: true, message: 'Todos reordered' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new TodosController();
