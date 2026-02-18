const API_BASE = ''

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
        return localStorage.getItem('auth_token')
    } catch {
        return null
    }
}

export const configService = {
    async getOtpConfig() {
        try {
            const token = getAuthToken()
            if (!token) return null;

            const res = await fetch(`${API_BASE}/api/config/otp`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch OTP config');
            const data = await res.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async updateOtpConfig(config: any) {
        try {
            const token = getAuthToken()
            if (!token) throw new Error('No auth token');

            const res = await fetch(`${API_BASE}/api/config/otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            })
            if (!res.ok) throw new Error('Failed to update OTP config');
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async getManagerSignupConfig() {
        try {
            const token = getAuthToken()
            if (!token) return null;

            const res = await fetch(`${API_BASE}/api/config/manager-signup`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch Manager Signup config');
            const data = await res.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async updateManagerSignupConfig(config: any) {
        try {
            const token = getAuthToken()
            if (!token) throw new Error('No auth token');

            const res = await fetch(`${API_BASE}/api/config/manager-signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            })
            if (!res.ok) throw new Error('Failed to update config');
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
