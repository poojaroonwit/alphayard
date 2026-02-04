import { Request, Response } from 'express';
import { ApplicationModel } from '../../models/ApplicationModel';

export class PublicApplicationController {
    
    async getConfig(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            
            const app = await ApplicationModel.findBySlug(slug);
            
            if (!app) {
                return res.status(404).json({ error: 'Application not found' });
            }

            // Map to format expected by mobile app (ThemeConfigService)
            // Expects: { componentStyles: { branding, categories, ... } }
            // Our Schema: branding, settings: { componentStyles: { categories: ... } }
            
            const componentStyles = {
                branding: app.branding,
                categories: app.settings?.componentStyles?.categories || [],
                updatedAt: app.updatedAt
            };

            res.json({ componentStyles });
        } catch (error: any) {
            console.error('Get public app config error:', error);
            res.status(500).json({ error: 'Failed to fetch application config' });
        }
    }
}

export const publicApplicationController = new PublicApplicationController();
