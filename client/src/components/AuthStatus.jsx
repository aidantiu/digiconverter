import { PiUploadSimple } from "react-icons/pi";
import { LiaUserSecretSolid } from "react-icons/lia";
import { FaUser } from "react-icons/fa";

const AuthStatus = ({ isLoggedIn, user, showWelcomeMessage, uploadLimits }) => {
    const hasLimits = Boolean(uploadLimits);
    const isUnlimited = Boolean(isLoggedIn && uploadLimits?.unlimited);
    const showWelcomeChip = Boolean(isUnlimited && showWelcomeMessage);
    const isLimited = Boolean(hasLimits && !uploadLimits?.unlimited);

    if (!showWelcomeChip && !isLimited) return null;

    return (
        <div className="flex flex-col gap-2 w-full">
            {showWelcomeChip && (
                <div className="flex flex-col md:flex-col lg:flex-row w-full gap-5 ">
                    <div className="rounded-xl px-4 py-2.5 text-xs font-medium shadow-sm bg-blue-50 w-full text-center">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                            <span className='text-xs text-center flex items-center justify-center'><FaUser className="mr-2"/> Welcome back, <strong> {user?.username}</strong>!</span>
                        </div>
                    </div>

                    <div className="rounded-xl px-4 py-2.5 text-xs font-medium shadow-sm bg-purple-100 w-full text-center">
                        <span className='text-xs text-center block'>Unlimited Uploads! Convert as many as you want.</span>
                    </div>
                </div>
            )}

            {isLimited && (
                <div className="flex flex-col md:flex-row w-full gap-3 justify-start items-center">
                    {!isLoggedIn ? (
                        <>
                            {/* Anonymous mode message */}
                            <div className="rounded-xl p-3 text-xs shadow-sm bg-orange-50 border border-orange-200 text-orange-700 w-full text-center">
                                <span className="flex items-center justify-center"><LiaUserSecretSolid className="mr-1" />You're using anonymous mode</span>
                            </div>
                        </>
                    ) : (
                        /* Logged in user */
                        <div className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm bg-blue-50 border border-blue-200 text-blue-700 w-full text-center">
                            <span>👤 {user?.username}</span>
                        </div>
                    )}
                    
                    {/* Upload limits */}
                    {uploadLimits.limit !== undefined && (
                        <div className={`rounded-xl p-3 text-xs font-medium shadow-sm w-full text-center ${uploadLimits.canUpload ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                            <PiUploadSimple className="inline-block mr-1" /> {uploadLimits.used}/{uploadLimits.limit}{uploadLimits.remaining > 0
                                ? ` (${uploadLimits.remaining} remaining uploads)`
                                : uploadLimits.resetTime
                                    ? ` (Resets at ${new Date(uploadLimits.resetTime).toLocaleString()})`
                                    : ''
                            }
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuthStatus;
