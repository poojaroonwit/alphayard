import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { HealthDataService } from '../../services/healthDataService';

class HealthOverviewController {
    // ── Categories ────────────────────────────────────────────────────────────

    static async getCategories(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { section } = req.query as { section?: string };
            await HealthDataService.initializeDefaultsIfEmpty(userId);
            const categories = await HealthDataService.getCategories(userId, section);
            res.json(categories);
        } catch (error) {
            console.error('[HealthOverview] Error getting categories:', error);
            res.status(500).json({ error: 'Failed to get health categories' });
        }
    }

    static async createCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { name, section, type, color, icon } = req.body;
            if (!name || !section || !type) {
                return res.status(400).json({ error: 'name, section, and type are required' });
            }
            const category = await HealthDataService.createCategory(userId, {
                name, section, type,
                color: color || '#10B981',
                icon: icon || 'heart',
            });
            res.status(201).json(category);
        } catch (error) {
            console.error('[HealthOverview] Error creating category:', error);
            res.status(500).json({ error: 'Failed to create health category' });
        }
    }

    static async updateCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updated = await HealthDataService.updateCategory(id, userId, req.body);
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error updating category:', error);
            res.status(500).json({ error: 'Failed to update health category' });
        }
    }

    static async deleteCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await HealthDataService.deleteCategory(id, userId);
            res.json({ message: 'Category deleted' });
        } catch (error: any) {
            if (error.message === 'Category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error deleting category:', error);
            res.status(500).json({ error: 'Failed to delete health category' });
        }
    }

    // ── Sub-categories ────────────────────────────────────────────────────────

    static async createSubCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { categoryId } = req.params;
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'name is required' });
            const subCat = await HealthDataService.createSubCategory(categoryId, userId, name);
            res.status(201).json(subCat);
        } catch (error: any) {
            if (error.message === 'Category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error creating sub-category:', error);
            res.status(500).json({ error: 'Failed to create health sub-category' });
        }
    }

    static async updateSubCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'name is required' });
            const updated = await HealthDataService.updateSubCategory(id, userId, name);
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error updating sub-category:', error);
            res.status(500).json({ error: 'Failed to update health sub-category' });
        }
    }

    static async deleteSubCategory(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await HealthDataService.deleteSubCategory(id, userId);
            res.json({ message: 'Sub-category deleted' });
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error deleting sub-category:', error);
            res.status(500).json({ error: 'Failed to delete health sub-category' });
        }
    }

    // ── Records ───────────────────────────────────────────────────────────────

    static async getRecords(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { subCatId } = req.params;
            const records = await HealthDataService.getRecords(subCatId, userId);
            res.json(records);
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error getting records:', error);
            res.status(500).json({ error: 'Failed to get health records' });
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
            const record = await HealthDataService.createRecord(userId, {
                subCategoryId: subCatId,
                name,
                date,
                description,
            });
            res.status(201).json(record);
        } catch (error: any) {
            if (error.message === 'Sub-category not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error creating record:', error);
            res.status(500).json({ error: 'Failed to create health record' });
        }
    }

    static async updateRecord(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name, date, description, subCategoryId } = req.body;
            
            const updated = await HealthDataService.updateRecord(id, userId, {
                name, date, description, subCategoryId
            });
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Record not found') return res.status(404).json({ error: error.message });
            if (error.message === 'Target sub-category not found') return res.status(400).json({ error: error.message });
            console.error('[HealthOverview] Error updating record:', error);
            res.status(500).json({ error: 'Failed to update health record' });
        }
    }

    static async deleteRecord(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await HealthDataService.deleteRecord(id, userId);
            res.json({ message: 'Record deleted' });
        } catch (error: any) {
            if (error.message === 'Record not found') return res.status(404).json({ error: error.message });
            console.error('[HealthOverview] Error deleting record:', error);
            res.status(500).json({ error: 'Failed to delete health record' });
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    static async getSummary(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const summary = await HealthDataService.getHealthSummary(userId);
            res.json(summary);
        } catch (error) {
            console.error('[HealthOverview] Error getting summary:', error);
            res.status(500).json({ error: 'Failed to get health summary' });
        }
    }
}

export default HealthOverviewController;
