// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    // Authentication
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    
    // File conversion
    upload: `${API_BASE_URL}/api/conversions/upload`,
    limits: `${API_BASE_URL}/api/conversions/limits`,
    status: (id) => `${API_BASE_URL}/api/conversions/status/${id}`,
    download: (id) => `${API_BASE_URL}/api/conversions/download/${id}`,
    history: `${API_BASE_URL}/api/conversions/history`,
};

export default API_BASE_URL;
