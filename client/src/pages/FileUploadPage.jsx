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
        // Try to get user from localStorage
        const userString = localStorage.getItem('user');
        if (userString && userString !== 'undefined' && userString !== 'null') {
            try {
                const parsedUser = JSON.parse(userString);
                setUser(parsedUser);
                setIsLoggedIn(true);
                setShowWelcomeMessage(true);
            } catch {
                setUser(null);
                setIsLoggedIn(false);
            }
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
    }, []);

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
                <div className="flex flex-col sm:flex-row items-center lg:justify-end w-full justify-center gap-4 mb-4">
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
