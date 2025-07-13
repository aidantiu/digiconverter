import React from 'react';

const ProgressBar = ({ 
    progress = 0, 
    status = 'processing', 
    showPercentage = true, 
    height = 'h-2',
    animated = true,
    color = 'purple'
}) => {
    // Color variants
    const colorClasses = {
        purple: 'bg-purple-600',
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        red: 'bg-red-600',
        orange: 'bg-orange-600'
    };

    // Background color variants
    const bgColorClasses = {
        purple: 'bg-purple-100',
        blue: 'bg-blue-100',
        green: 'bg-green-100',
        red: 'bg-red-100',
        orange: 'bg-orange-100'
    };

    // Status-based colors
    const getStatusColor = () => {
        switch (status) {
            case 'completed':
                return 'green';
            case 'failed':
                return 'red';
            case 'processing':
                return color;
            default:
                return color;
        }
    };

    const statusColor = getStatusColor();
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className="w-full">
            {showPercentage && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        {status === 'completed' ? 'Completed' : 
                         status === 'failed' ? 'Failed' : 
                         'Converting...'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                        {clampedProgress}%
                    </span>
                </div>
            )}
            <div className={`w-full ${bgColorClasses[statusColor]} rounded-full ${height} overflow-hidden`}>
                <div 
                    className={`${height} ${colorClasses[statusColor]} rounded-full transition-all duration-500 ease-out ${
                        animated && status === 'processing' ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${clampedProgress}%` }}
                >
                    {animated && status === 'processing' && (
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Circular progress component
export const CircularProgress = ({ 
    progress = 0, 
    size = 80, 
    strokeWidth = 8,
    status = 'processing',
    showPercentage = true 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

    const getStatusColor = () => {
        switch (status) {
            case 'completed':
                return '#10b981'; // green-500
            case 'failed':
                return '#ef4444'; // red-500
            case 'processing':
                return '#8b5cf6'; // purple-500
            default:
                return '#8b5cf6';
        }
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getStatusColor()}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-900">
                        {clampedProgress}%
                    </span>
                </div>
            )}
        </div>
    );
};

// Mini progress bar for status indicators
export const MiniProgressBar = ({ progress = 0, status = 'processing' }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'failed':
                return 'bg-red-500';
            case 'processing':
                return 'bg-purple-500';
            default:
                return 'bg-purple-500';
        }
    };

    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
                className={`h-1.5 ${getStatusColor()} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${clampedProgress}%` }}
            />
        </div>
    );
};

export default ProgressBar;
