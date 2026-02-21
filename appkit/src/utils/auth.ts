// Simple authentication utilities for admin panel
export const ADMIN_TOKEN_KEY = 'admin_token';

// Simple admin credentials (in production, this should be more secure)
const ADMIN_CREDENTIALS = {
  email: 'admin@appkit.com',
  password: 'admin123' // Change this in production!
};

export const loginAdmin = async (email: string, password: string): Promise<boolean> => {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    // Generate a simple token (in production, use proper JWT)
    const token = btoa(`${email}:${Date.now()}:${Math.random()}`);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    return true;
  }
  return false;
};

export const logoutAdmin = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const isAdminAuthenticated = (): boolean => {
  const token = getAdminToken();
  return !!token;
};

// Simple token validation (in production, validate with backend)
export const validateAdminToken = (token: string): boolean => {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    return parts.length === 3 && parts[0] === ADMIN_CREDENTIALS.email;
  } catch {
    return false;
  }
};
