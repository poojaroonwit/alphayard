import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { FinanceDataService } from '../../services/financeDataService';

class FinanceController {
    // ── Categories ────────────────────────────────────────────────────────────

    static async getCategories(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { section } = req.query as { section?: string };
            await FinanceDataService.initializeDefaultsIfEmpty(userId);
            const categories = await FinanceDataService.getCategories(userId, section);
            res.json(categories);
        } catch (error) {
            console.error('[FinanceController] Failed to get categories:', error);
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    static async createCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { name, section, type, color, icon } = req.body;
            if (!name || !section || !type) {
                return res.status(400).json({ error: 'name, section, and type are required' });
            }
            const category = await FinanceDataService.createCategory(userId, {
                name, section, type,
                color: color || '#3B82F6',
                icon: icon || 'tag',
            });
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create category' });
        }
    }

    static async updateCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updated = await FinanceDataService.updateCategory(id, userId, req.body);
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to update category' });
        }
    }

    static async deleteCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await FinanceDataService.deleteCategory(id, userId);
            res.json({ message: 'Category deleted' });
        } catch (error: any) {
            if (error.message === 'Category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }

    // ── Sub-categories ────────────────────────────────────────────────────────

    static async createSubCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { categoryId } = req.params;
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'name is required' });
            const subCat = await FinanceDataService.createSubCategory(categoryId, userId, name);
            res.status(201).json(subCat);
        } catch (error: any) {
            if (error.message === 'Category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to create sub-category' });
        }
    }

    static async updateSubCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'name is required' });
            const updated = await FinanceDataService.updateSubCategory(id, userId, name);
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to update sub-category' });
        }
    }

    static async deleteSubCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await FinanceDataService.deleteSubCategory(id, userId);
            res.json({ message: 'Sub-category deleted' });
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to delete sub-category' });
        }
    }

    // ── Records ───────────────────────────────────────────────────────────────

    static async getRecords(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { subCatId } = req.params;
            const records = await FinanceDataService.getRecords(subCatId, userId);
            res.json(records);
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to get records' });
        }
    }

    static async createRecord(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { subCatId } = req.params;
            const { name, date, description } = req.body;
            if (!name || !date) {
                return res.status(400).json({ error: 'name and date are required' });
            }
            const record = await FinanceDataService.createRecord(userId, {
                subCategoryId: subCatId,
                name,
                date,
                description,
            });
            res.status(201).json(record);
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to create record' });
        }
    }

    static async updateRecord(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name, date, description, subCategoryId } = req.body;
            
            const updated = await FinanceDataService.updateRecord(id, userId, {
                name, date, description, subCategoryId
            });
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Record not found') return res.status(404).json({ error: error.message });
            if (error.message === 'Target sub-category not found') return res.status(400).json({ error: error.message });
            res.status(500).json({ error: 'Failed to update record' });
        }
    }

    static async deleteRecord(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await FinanceDataService.deleteRecord(id, userId);
            res.json({ message: 'Record deleted' });
        } catch (error: any) {
            if (error.message === 'Record not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to delete record' });
        }
    }

    // ── Net Worth ─────────────────────────────────────────────────────────────

    static async getNetWorth(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const summary = await FinanceDataService.getNetWorth(userId);
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get net worth' });
        }
    }
}

export default FinanceController;
