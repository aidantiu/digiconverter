import React from 'react';

const AuthStatus = ({ isLoggedIn, user, showWelcomeMessage, uploadLimits }) => {
    const hasLimits = Boolean(uploadLimits);
    const isUnlimited = Boolean(isLoggedIn && uploadLimits?.unlimited);
    const showWelcomeChip = Boolean(isUnlimited && showWelcomeMessage);
    const isLimited = Boolean(hasLimits && !uploadLimits?.unlimited);

    if (!showWelcomeChip && !isLimited) return null;

    return (
        <div className="flex flex-col gap-2">
            {showWelcomeChip && (
                <div className="flex flex-col md:flex-col lg:flex-row w-full gap-5">
                    <div className="rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm bg-blue-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className='text-sm'>Welcome back, <strong>{user?.username}</strong>!</span>
                        </div>
                    </div>

                    <div className="flex sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl px-4 py-2.5 text-sm shadow-sm bg-purple-100">
                        <span className='text-sm'>Unlimited Uploads! Convert as many as you want.</span>
                    </div>

                </div>
            )}

            {isLimited && (
                <div className={`rounded-xl px-4 py-2 flex items-center gap-3 text-sm font-medium shadow-sm ${uploadLimits.canUpload ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
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
                                <span>Uploads: {uploadLimits.used}/{uploadLimits.limit}</span>
                                {uploadLimits.remaining > 0
                                    ? ` (${uploadLimits.remaining} remaining)`
                                    : uploadLimits.resetTime
                                        ? ` (Resets at ${new Date(uploadLimits.resetTime).toLocaleString()})`
                                        : ''
                                }
                            </>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
};

export default AuthStatus;
