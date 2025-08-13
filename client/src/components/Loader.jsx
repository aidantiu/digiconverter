import React from 'react';

const Loader = ({ 
    size = 'medium', 
    message = 'Loading...', 
    fullScreen = false,
    color = 'purple',
    showMessage = true 
}) => {
    // Size variants
    const sizeClasses = {
        small: 'h-6 w-6',
        medium: 'h-12 w-12',
        large: 'h-16 w-16',
        xlarge: 'h-20 w-20'
    };

    // Color variants
    const colorClasses = {
        purple: 'border-purple-600',
        blue: 'border-blue-600',
        green: 'border-green-600',
        red: 'border-red-600',
        gray: 'border-gray-600'
    };

    const spinnerClass = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`;

    // Full screen loader
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                    <div className={spinnerClass}></div>
                    {showMessage && (
                        <p className="mt-4 text-gray-600 font-medium">{message}</p>
                    )}
                </div>
            </div>
        );
    }

    // Inline loader
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={spinnerClass}></div>
            {showMessage && (
                <p className="mt-4 text-gray-600 font-medium">{message}</p>
            )}
        </div>
    );
};

// Alternative loader with dots animation
export const DotsLoader = ({ message = 'Loading...', fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="flex space-x-2 justify-center items-center">
                        <div className="h-3 w-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-3 w-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-3 w-3 bg-purple-600 rounded-full animate-bounce"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">{message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="flex space-x-2 justify-center items-center p-2">
                <div className="h-3 w-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 bg-orange-600 rounded-full animate-bounce"></div>
            </div>
            <p className=" text-xs font-medium">{message}</p>
        </div>
    );
};

// Page loader specifically for page transitions
export const PageLoader = ({ message = 'Loading page...', minHeight = 'min-h-screen' }) => {
    return (
        <div className={`${minHeight} bg-gray-50 flex items-center justify-center`}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">{message}</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we load your content</p>
            </div>
        </div>
    );
};

// Card loader for loading states within cards
export const CardLoader = ({ height = 'h-48' }) => {
    return (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden animate-pulse`}>
            <div className={`${height} bg-gradient-to-br from-gray-200 to-gray-300`}></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
