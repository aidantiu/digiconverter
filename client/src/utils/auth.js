import { API_ENDPOINTS } from '../config/api';

// Authentication utility functions
export const authUtils = {
    // Check if user is logged in based on localStorage (quick check)
    isLoggedIn() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        return !!(token && token !== 'undefined' && token !== 'null' && user);
    },

    // Get stored user data
    getUser() {
        try {
            const userString = localStorage.getItem('user');
            if (!userString || userString === 'undefined' || userString === 'null') {
                return null;
            }
            return JSON.parse(userString);
        } catch (error) {
            console.warn('Error parsing stored user:', error);
            this.clearAuth();
            return null;
        }
    },

    // Get stored token
    getToken() {
        const token = localStorage.getItem('authToken');
        return (token && token !== 'undefined' && token !== 'null') ? token : null;
    },

    // Validate token with server (only call when needed)
    async validateToken() {
        const token = this.getToken();
        if (!token) {
            return { valid: false, reason: 'no_token' };
        }

        try {
            const response = await fetch(API_ENDPOINTS.validate, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                // Update user data if it has changed
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                return { valid: true, user: data.user };
            } else {
                // Token is invalid or expired
                this.clearAuth();
                return { 
                    valid: false, 
                    reason: data.expired ? 'expired' : 'invalid',
                    message: data.message 
                };
            }
        } catch (error) {
            console.error('Error validating token:', error);
            return { valid: false, reason: 'network_error', error };
        }
    },

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('justLoggedIn');
    },

    // Set authentication data
    setAuth(token, user) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Quick auth status (no server validation - for UI display)
    getQuickAuthStatus() {
        if (!this.isLoggedIn()) {
            return { authenticated: false, reason: 'not_logged_in' };
        }
        
        const user = this.getUser();
        return { authenticated: true, user };
    },

    // Validate auth when performing actions (with server check)
    async validateForAction() {
        if (!this.isLoggedIn()) {
            return { valid: false, reason: 'not_logged_in' };
        }

        const validation = await this.validateToken();
        
        if (validation.valid) {
            return { valid: true, user: validation.user };
        } else {
            return { 
                valid: false, 
                reason: validation.reason,
                message: validation.message,
                expired: validation.reason === 'expired'
            };
        }
    }
};

export default authUtils;
