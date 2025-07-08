import { clearImageCache } from './cache';

/**
 * Cache management utilities for the DigiConverter app
 */

// Clear all caches when user logs out
export const clearAllCaches = async () => {
    // Clear image cache
    clearImageCache();
    
    // Clear browser caches if available
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('🧹 All browser caches cleared');
        } catch (error) {
            console.warn('Failed to clear browser caches:', error);
        }
    }
    
    // Clear localStorage cache timestamps
    localStorage.removeItem('cacheTimestamp');
    console.log('🧹 Cache management completed');
};

// Set cache timestamp for cache invalidation
export const setCacheTimestamp = () => {
    localStorage.setItem('cacheTimestamp', Date.now().toString());
};

// Check if cache should be invalidated (older than 1 hour)
export const shouldInvalidateCache = () => {
    const timestamp = localStorage.getItem('cacheTimestamp');
    if (!timestamp) return true;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const oneHour = 60 * 60 * 1000;
    return cacheAge > oneHour;
};

// Initialize cache on app start
export const initializeCache = () => {
    if (shouldInvalidateCache()) {
        clearAllCaches();
        setCacheTimestamp();
        console.log('🔄 Cache initialized with fresh timestamp');
    } else {
        console.log('📦 Using existing cache');
    }
};
