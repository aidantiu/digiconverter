// Simple in-memory cache for thumbnails and images
class ImageCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(url) {
        if (this.cache.has(url)) {
            const item = this.cache.get(url);
            // Move to end (most recently used)
            this.cache.delete(url);
            this.cache.set(url, item);
            return item;
        }
        return null;
    }

    set(url, data) {
        // Remove oldest item if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(url, data);
    }

    has(url) {
        return this.cache.has(url);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Create a global image cache instance
const imageCache = new ImageCache(50); // Cache up to 50 images

/**
 * Fetch an image with caching support
 * @param {string} url - Image URL to fetch
 * @returns {Promise<string>} - Promise resolving to blob URL
 */
export async function fetchImageWithCache(url) {
    // Check if image is already in cache
    const cached = imageCache.get(url);
    if (cached) {
        console.log(`📦 Cache hit for: ${url}`);
        return cached;
    }

    try {
        console.log(`🌐 Fetching: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Store in cache
        imageCache.set(url, blobUrl);
        console.log(`💾 Cached: ${url}`);
        
        return blobUrl;
    } catch (error) {
        console.error(`❌ Failed to fetch image: ${url}`, error);
        throw error;
    }
}

/**
 * Preload images for better UX
 * @param {string[]} urls - Array of image URLs to preload
 */
export async function preloadImages(urls) {
    const promises = urls.map(url => {
        if (!imageCache.has(url)) {
            return fetchImageWithCache(url).catch(error => {
                console.warn(`Failed to preload: ${url}`, error);
            });
        }
        return Promise.resolve();
    });
    
    await Promise.all(promises);
    console.log(`🚀 Preloaded ${urls.length} images`);
}

/**
 * Clear cached images and revoke blob URLs
 */
export function clearImageCache() {
    for (const [url, blobUrl] of imageCache.cache) {
        if (blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrl);
        }
    }
    imageCache.clear();
    console.log('🧹 Image cache cleared');
}

export default imageCache;
