import { Request, Response } from 'express';
import { prisma } from '@/server/lib/prisma';

export class AdminSSOController {
  
  /**
   * SSO Login
   */
  async ssoLogin(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      
      const oauthProvider = await prisma.oAuthProvider.findFirst({
        where: { providerName: provider, isEnabled: true }
      });

      if (!oauthProvider) {
        return res.status(404).json({ error: 'OAuth provider not found or disabled' });
      }

      // In a real implementation, this would redirect to the provider's auth URL
      // For now, we return the configuration to the client
      return res.json({ 
        authUrl: oauthProvider.authorizationUrl,
        clientId: oauthProvider.clientId,
        scopes: oauthProvider.scopes,
        provider: oauthProvider.providerName
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const adminSSOController = new AdminSSOController();
