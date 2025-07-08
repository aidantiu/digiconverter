// Service Worker for caching thumbnails and API responses
const CACHE_NAME = 'digiconverter-cache-v1';
const THUMBNAIL_CACHE = 'thumbnails-v1';

// URLs to cache
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
];

// Install event - cache essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - intercept network requests
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Cache thumbnails aggressively
    if (url.pathname.includes('/thumbnail/')) {
        event.respondWith(
            caches.open(THUMBNAIL_CACHE).then(cache => {
                return cache.match(request).then(response => {
                    if (response) {
                        console.log('Serving thumbnail from cache:', url.pathname);
                        return response;
                    }
                    
                    // Fetch and cache the thumbnail
                    return fetch(request).then(fetchResponse => {
                        // Check if we received a valid response
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }
                        
                        const responseToCache = fetchResponse.clone();
                        cache.put(request, responseToCache);
                        console.log('Cached thumbnail:', url.pathname);
                        return fetchResponse;
                    });
                });
            })
        );
        return;
    }
    
    // For other requests, use network first strategy
    event.respondWith(
        fetch(request)
            .then(response => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                
                // Clone the response
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request, responseToCache);
                    });
                
                return response;
            })
            .catch(() => {
                // If network fails, try to serve from cache
                return caches.match(request);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== THUMBNAIL_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
