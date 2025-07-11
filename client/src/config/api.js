// API configuration
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    // Authentication
    register: `${baseURL}/api/auth/register`,
    login: `${baseURL}/api/auth/login`,
    validate: `${baseURL}/api/auth/validate`,
    
    // File conversion
    upload: `${baseURL}/api/conversions/upload`,
    batchUpload: `${baseURL}/api/conversions/batch-upload`,
    limits: `${baseURL}/api/conversions/limits`,
    status: (id) => `${baseURL}/api/conversions/status/${id}`,
    batchStatus: (batchId) => `${baseURL}/api/conversions/batch-status/${batchId}`,
    download: (id) => `${baseURL}/api/conversions/download/${id}`,
    history: `${baseURL}/api/conversions/history`,
    preview: (id) => `${baseURL}/api/conversions/preview/${id}`,
    
    // Thumbnails
    thumbnailImage: (id) => `${baseURL}/api/conversions/thumbnail/image/${id}`,
    thumbnailVideo: (id) => `${baseURL}/api/conversions/thumbnail/video/${id}`,
};

export default baseURL;

