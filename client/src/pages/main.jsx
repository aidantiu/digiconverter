import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/styles.css'
import App from '../App.jsx'
import { initializeCache } from '../utils/cacheManager'

// Initialize cache system
initializeCache();

// Service Worker management - Unregister existing SW to fix API issues
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // First, unregister any existing service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                console.log('Unregistering existing SW:', registration);
                await registration.unregister();
            }
            
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('Cleared all SW caches');
            }
            
            console.log('All Service Workers unregistered and caches cleared');
            
            // For now, don't register any new service worker to prevent API interference
            // TODO: Re-enable SW later with proper API request handling
            
        } catch (error) {
            console.error('SW cleanup failed:', error);
        }
    });
    
    // Listen for messages from the Service Worker (if any)
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'SW_UNREGISTERED') {
            console.log('Service Worker has been unregistered');
            // Optionally reload the page to ensure clean state
            // window.location.reload();
        }
    });
}

// Global localStorage cleanup function
const cleanupLocalStorage = () => {
    try {
        // Test if user data is valid JSON
        const userString = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');
        
        // Check for various forms of corrupted data
        if (userString && userString.trim() !== '' && userString !== 'undefined' && userString !== 'null') {
            JSON.parse(userString); // This will throw if invalid JSON
        }
        
        // Also check if token is corrupted
        if (token && (token === 'undefined' || token === 'null' || token.trim() === '')) {
            console.warn('Found corrupted auth token, cleaning up...');
            localStorage.removeItem('authToken');
        }
    } catch (error) {
        console.warn('Found corrupted localStorage data at app startup, cleaning up...', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
    }
};

// Clean up localStorage before starting the app
cleanupLocalStorage();

// Use StrictMode only in development
createRoot(document.getElementById('root')).render(
  process.env.NODE_ENV === 'development' ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
)
