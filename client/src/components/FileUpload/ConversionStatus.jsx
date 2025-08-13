import React from 'react';
import { CircularProgress } from '../ProgressBar';

const ConversionStatus = ({ 
    status, 
    progress = 0, 
    onDownload, 
    onTryAgain, 
    fileName 
}) => {
    if (!status) return null;

    return (
        <div className="mt-6 p-4 rounded-xl border">
            {/* Processing */}
            {status.status === 'processing' && (
                <div className="text-center space-y-4">
                    <CircularProgress progress={progress} />
                    <div>
                        <p className="text-lg font-semibold text-blue-600">
                            🔄 Converting your file...
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Please wait while we process your file.
                        </p>
                        {progress > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                                Progress: {progress}%
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Success */}
            {status.status === 'completed' && (
                <div className="text-center space-y-4 bg-green-50 border-green-200">
                    <div className="text-green-600">
                        <div className="w-16 h-16 mx-auto mb-3">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <p className="text-lg font-semibold">
                            ✅ Conversion completed successfully!
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Your file has been converted and is ready for download.
                        </p>
                    </div>
                    <button
                        onClick={onDownload}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        📥 Download Converted File
                    </button>
                </div>
            )}

            {/* Failed */}
            {status.status === 'failed' && (
                <div className="bg-red-50 border-red-200 space-y-4">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 text-red-500">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                            </svg>
                        </div>
                        <p className="text-lg font-semibold text-red-600 mb-2">
                            ❌ Conversion failed
                        </p>
                        <p className="text-sm text-red-600 mb-4">
                            Unfortunately, we couldn't convert your file. Please try again.
                        </p>
                    </div>
                    
                    <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700 mb-2 font-medium">Common issues:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                            <li>For video conversions: FFmpeg must be installed on the server</li>
                            <li>Check if the target format is supported for your file type</li>
                            <li>File size might be too large</li>
                            <li>File might be corrupted</li>
                        </ul>
                        
                        <button 
                            onClick={onTryAgain}
                            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            🔄 Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversionStatus;
