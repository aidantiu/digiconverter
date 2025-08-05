import React from 'react';

const AuthStatus = ({ isLoggedIn, user, showWelcomeMessage, uploadLimits }) => {
    // Unlimited uploads for logged-in users
    if (isLoggedIn && uploadLimits && uploadLimits.unlimited) {
        return (
            <div className="bg-gradient-to-r from-teal-100 to-cyan-50 border-2 border-teal-200 rounded-xl px-4 py-2 flex items-center gap-3 text-teal-900 text-sm font-medium shadow-sm">
                <span>👋 Welcome back, <strong>{user?.username}</strong>!</span>
                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full font-semibold text-xs">🚀 Unlimited Uploads</span>
            </div>
        );
    }
    // Limited uploads for anonymous or limited users
    if (uploadLimits && !uploadLimits.unlimited) {
        return (
            <div className={`rounded-xl px-4 py-2 flex items-center gap-3 text-sm font-medium shadow-sm mb-2 ${uploadLimits.canUpload ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-red-100 border border-red-300 text-red-700'}`}>
                {!isLoggedIn ? (
                    <>
                        <span>🎯 You're using anonymous mode</span>
                        <a href="/login" className="bg-purple-600 text-white px-3 py-1 rounded-full font-semibold text-xs hover:bg-purple-700 transition-colors">🔐 Login for unlimited uploads</a>
                    </>
                ) : (
                    <span>👤 {user?.username}</span>
                )}
                <span className="ml-2">
                    {uploadLimits.limit !== undefined && (
                        <>
                            {uploadLimits.unlimited ? (
                                <span className="text-teal-700 font-semibold">Unlimited uploads</span>
                            ) : (
                                <>
                                    <span>Uploads: {uploadLimits.used}/{uploadLimits.limit}</span>
                                    {uploadLimits.remaining > 0
                                        ? ` (${uploadLimits.remaining} remaining)`
                                        : uploadLimits.resetTime
                                            ? ` (Resets at ${new Date(uploadLimits.resetTime).toLocaleString()})`
                                            : ''
                                    }
                                </>
                            )}
                        </>
                    )}
                </span>
            </div>
        );
    }
    return null;
};

export default AuthStatus;
