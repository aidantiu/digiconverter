// Simple in-memory cache for thumbnails and images
class ImageCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.pendingRequests = new Map(); // Track ongoing requests
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
            const oldValue = this.cache.get(firstKey);
            if (oldValue && oldValue.startsWith('blob:')) {
                URL.revokeObjectURL(oldValue);
            }
            this.cache.delete(firstKey);
        }
        this.cache.set(url, data);
    }

    has(url) {
        return this.cache.has(url);
    }

    hasPendingRequest(url) {
        return this.pendingRequests.has(url);
    }

    setPendingRequest(url, promise) {
        this.pendingRequests.set(url, promise);
        return promise;
    }

    removePendingRequest(url) {
        this.pendingRequests.delete(url);
    }

    getPendingRequest(url) {
        return this.pendingRequests.get(url);
    }

    clear() {
        // Clean up blob URLs before clearing
        for (const [url, blobUrl] of this.cache) {
            if (blobUrl && blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        }
        this.cache.clear();
        this.pendingRequests.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Create a global image cache instance
const imageCache = new ImageCache(50); // Cache up to 50 images

/**
 * Fetch an image with caching support and request deduplication
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

    // Check if there's already a pending request for this URL
    const pendingRequest = imageCache.getPendingRequest(url);
    if (pendingRequest) {
        console.log(`⏳ Waiting for existing request: ${url}`);
        return pendingRequest;
    }

    try {
        console.log(`🌐 Fetching: ${url}`);
        
        // Create and store the pending request
        const requestPromise = fetch(url)
            .then(async response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Store in cache
                imageCache.set(url, blobUrl);
                console.log(`💾 Cached: ${url}`);
                
                return blobUrl;
            })
            .finally(() => {
                // Remove from pending requests
                imageCache.removePendingRequest(url);
            });

        // Store the pending request
        imageCache.setPendingRequest(url, requestPromise);
        
        return await requestPromise;
    } catch (error) {
        imageCache.removePendingRequest(url);
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
