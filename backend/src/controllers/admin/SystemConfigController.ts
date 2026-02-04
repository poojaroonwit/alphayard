import { Request, Response } from 'express';
import { SystemConfigModel } from '../../models/SystemConfigModel';
import { CountryModel } from '../../models/CountryModel';
import { pool } from '../../config/database';

export class SystemConfigController {
    private countryModel: CountryModel;

    constructor() {
        this.countryModel = new CountryModel(pool);
    }

    async getCountries(req: Request, res: Response) {
        try {
            const countries = await this.countryModel.getAllActive();
            res.json(countries);
        } catch (error) {
            console.error('Error fetching countries:', error);
            res.status(500).json({ error: 'Failed to fetch countries' });
        }
    }

    // Get OTP Configuration
    async getOtpConfig(req: Request, res: Response) {
        try {
            const config = await SystemConfigModel.get('otp_config');
            res.json({
                success: true,
                data: config || {
                    emailProvider: 'mock',
                    smsProvider: 'mock',
                    emailTemplate: { subject: 'Your Code', body: 'Your code is {{otp}}' },
                    smsTemplate: 'Your code is {{otp}}'
                }
            });
        } catch (error) {
            console.error('Failed to get OTP config:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve configuration' });
        }
    }

    // Update OTP Configuration
    async updateOtpConfig(req: Request, res: Response) {
        try {
            const { emailProvider, smsProvider, emailTemplate, smsTemplate, emailProviderSettings, smsProviderSettings } = req.body;
            const userId = (req as any).user?.id; // Assuming auth middleware

            const value = {
                emailProvider,
                smsProvider,
                emailTemplate,
                smsTemplate,
                emailProviderSettings, // Make sure to sanitize secrets if needed, generally stored here for internal use
                smsProviderSettings
            };

            await SystemConfigModel.set('otp_config', value, 'Configuration for OTP (Email/SMS)', userId);

            res.json({ success: true, message: 'OTP Configuration updated successfully' });
        } catch (error) {
            console.error('Failed to update OTP config:', error);
            res.status(500).json({ success: false, message: 'Failed to update configuration' });
        }
    }

    // Get Manager Signup Configuration
    async getManagerSignupConfig(req: Request, res: Response) {
        try {
            const config = await SystemConfigModel.get('manager_signup_config');
            res.json({
                success: true,
                data: config || {
                    allowSignup: false,
                    requireApproval: true,
                    domainsAllowed: []
                }
            });
        } catch (error) {
            console.error('Failed to get Manager Signup config:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve configuration' });
        }
    }

    // Update Manager Signup Configuration
    async updateManagerSignupConfig(req: Request, res: Response) {
        try {
            const { allowSignup, requireApproval, domainsAllowed } = req.body;
            const userId = (req as any).user?.id;

            const value = {
                allowSignup,
                requireApproval,
                domainsAllowed
            };

            await SystemConfigModel.set('manager_signup_config', value, 'Configuration for Manager Signups', userId);

            res.json({ success: true, message: 'Manager Signup Configuration updated successfully' });
        } catch (error) {
            console.error('Failed to update Manager Signup config:', error);
            res.status(500).json({ success: false, message: 'Failed to update configuration' });
        }
    }

    // Generic CRUD for config routes
    async getAllConfigs(req: Request, res: Response) {
        try {
            const configs = await SystemConfigModel.getAll();
            res.json({ success: true, data: configs });
        } catch (error) {
            console.error('Failed to get all configs:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve configurations' });
        }
    }

    async getConfig(req: Request, res: Response) {
        try {
            const { key } = req.params;
            const config = await SystemConfigModel.get(key);
            res.json({ success: true, data: config });
        } catch (error) {
            console.error(`Failed to get config ${req.params.key}:`, error);
            res.status(500).json({ success: false, message: 'Failed to retrieve configuration' });
        }
    }

    async updateConfig(req: Request, res: Response) {
        try {
            const { key } = req.params;
            const { value, description } = req.body;
            const userId = (req as any).user?.id;
            await SystemConfigModel.set(key, value, description, userId);
            res.json({ success: true, message: 'Configuration updated successfully' });
        } catch (error) {
            console.error(`Failed to update config ${req.params.key}:`, error);
            res.status(500).json({ success: false, message: 'Failed to update configuration' });
        }
    }

    async deleteConfig(req: Request, res: Response) {
        // Note: SystemConfigModel doesn't have a delete method, so this is a placeholder
        res.status(501).json({ success: false, message: 'Delete not implemented' });
    }
}
