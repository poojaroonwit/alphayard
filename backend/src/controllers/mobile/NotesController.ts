import { Request, Response } from 'express';
import notesService from '../../services/notesService';

export class NotesController {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const result = await notesService.list(userId);
            res.json({ success: true, data: result.entities });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const noteData = { ...req.body, userId: (req as any).user.id };
            const note = await notesService.create(noteData);
            res.status(201).json({ success: true, data: note });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const note = await notesService.update(req.params.id, req.body);
            res.json({ success: true, data: note });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async remove(req: Request, res: Response) {
        try {
            await notesService.delete(req.params.id);
            res.json({ success: true, message: 'Note deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new NotesController();
