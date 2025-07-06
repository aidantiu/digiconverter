import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/styles.css'
import App from '../App.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
