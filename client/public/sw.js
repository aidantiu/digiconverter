// Simple Service Worker - Does nothing to prevent API interference
console.log('SW: Simple service worker loaded - no caching or request interference');

// Install immediately
self.addEventListener('install', event => {
    console.log('SW: Installing simple SW');
    self.skipWaiting();
});

// Activate and take control immediately
self.addEventListener('activate', event => {
    console.log('SW: Activating simple SW');
    event.waitUntil(
        // Clear any existing caches
        caches.keys().then(cacheNames => {
            return Promise.all(cacheNames.map(name => caches.delete(name)));
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Do not intercept any fetch requests - let everything pass through normally
self.addEventListener('fetch', event => {
    // Don't call event.respondWith() - let all requests pass through naturally
    return;
});
