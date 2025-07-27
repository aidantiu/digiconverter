import React from 'react';
import { Link } from 'react-router-dom';

const SessionExpiredModal = ({ isOpen, onClose, onLogin }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
                <div className="text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        ⏰ Session Expired
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">
                        Your login session has expired for security reasons. Please log in again to continue using unlimited uploads and access your conversion history.
                    </p>

                
                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            to="/login"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-center"
                            onClick={() => {
                                if (onLogin) onLogin();
                                onClose();
                            }}
                        >
                            🔐 Login Again
                        </Link>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>

                    {/* Guest mode note */}
                    <p className="text-xs text-gray-500 mt-3">
                        Guest mode: 3 uploads per day limit
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionExpiredModal;
