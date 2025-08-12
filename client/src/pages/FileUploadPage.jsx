import React from 'react';
import FileUpload from '../components/FileUpload';
import Navbar from '../components/Navbar';
import SupportedFormatsDropdown from '../components/SupportedFormatsDropdown';
import AuthStatus from '../components/AuthStatus';
import { useState, useEffect } from 'react';

const FileUploadPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
    const [uploadLimits, setUploadLimits] = useState(null);

    useEffect(() => {
        // Check for justLoggedIn flag first, before anything else
        const justLoggedIn = localStorage.getItem('justLoggedIn') === 'true';
        
        // Try to get user from localStorage
        const userString = localStorage.getItem('user');
        if (userString && userString !== 'undefined' && userString !== 'null') {
            try {
                const parsedUser = JSON.parse(userString);
                setUser(parsedUser);
                setIsLoggedIn(true);
                
                // Show welcome message only if user just logged in
                if (justLoggedIn) {
                    setShowWelcomeMessage(true);
                    // Clear the flag so it doesn't show again
                    localStorage.removeItem('justLoggedIn');
                }
            } catch {
                setUser(null);
                setIsLoggedIn(false);
            }
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
    }, []);

    // Auto-hide welcome only on navigation
    useEffect(() => {
        if (!showWelcomeMessage) return;

        const hide = () => {
            setShowWelcomeMessage(false);
            cleanup();
        };

        const setup = () => {
            // Only listen for navigation events
            window.addEventListener('popstate', hide, { once: true });
            window.addEventListener('beforeunload', hide, { once: true });
        };

        const cleanup = () => {
            window.removeEventListener('popstate', hide);
            window.removeEventListener('beforeunload', hide);
        };

        // Add a 3-second delay before enabling auto-hide listeners
        // This prevents immediate hiding from page loading events
        const delayTimer = setTimeout(() => {
            setup();
        }, 3000);

        return () => {
            clearTimeout(delayTimer);
            cleanup();
        };
    }, [showWelcomeMessage]);

    // Handler to receive uploadLimits from FileUpload
    const handleUploadLimits = (limits) => {
        setUploadLimits(limits);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center">
                <div className="text-center mb-5">
                    <h1 className="text-3xl font-extrabold mb-4 text-black">Convert Your Memories</h1>
                    <p className="text-md text-gray-600 max-w-2xl mx-auto">
                        Convert your digicam images and videos to modern formats. Drag and drop or click below to get started.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center lg:justify-end justify-center gap-x-13 gap-y-5 w-full mb-4">
                    <AuthStatus isLoggedIn={isLoggedIn} user={user} showWelcomeMessage={showWelcomeMessage} uploadLimits={uploadLimits} />
                    <SupportedFormatsDropdown />
                </div>
                <div className="w-full flex justify-center">
                    <FileUpload onUploadLimits={handleUploadLimits} />
                </div>
            </main>
        </div>
    );
};

export default FileUploadPage;
