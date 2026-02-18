
import { Request, Response } from 'express';

export class AdminSSOController {
  
  /**
   * SSO Login
   */
  async ssoLogin(req: Request, res: Response) {
    // Check if provider is supported
    const { provider } = req.params;
    
    // For now, return 501 Not Implemented or similar
    // This stubs the controller so imports don't fail
    return res.status(501).json({ 
        error: 'Not Implemented', 
        message: `SSO login for ${provider} is not yet implemented.` 
    });
  }
}

export const adminSSOController = new AdminSSOController();
