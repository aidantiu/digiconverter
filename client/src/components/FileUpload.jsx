import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { authUtils } from '../utils/auth';
import Loader, { DotsLoader } from './Loader';
import ProgressBar, { CircularProgress } from './ProgressBar';
import SessionExpiredModal from './SessionExpiredModal';
import ImageWithSpinner from './ImageWithSpinner';
import UnsupportedFileModal from './UnsupportedFileModal';

// Debug function - add to window for manual cleanup
if (typeof window !== 'undefined') {
    window.clearDigiConverterData = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('justLoggedIn');
        console.log('DigiConverter localStorage data cleared');
        window.location.reload();
    };
}

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [targetFormat, setTargetFormat] = useState('');
    const [uploadLimits, setUploadLimits] = useState(null);
    const [conversionStatus, setConversionStatus] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [previewType, setPreviewType] = useState(null);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [isConverting, setIsConverting] = useState(false);
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
    const [showSessionExpired, setShowSessionExpired] = useState(false);
    const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
    const [unsupportedFileInfo, setUnsupportedFileInfo] = useState({ fileName: '', detectedType: '' });

    // Check upload limits on component mount
    useEffect(() => {
        // Use quick auth status - no server validation on page load
        const authStatus = authUtils.getQuickAuthStatus();
        
        if (authStatus.authenticated) {
            setUser(authStatus.user);
            setIsLoggedIn(true);
            
            // Show welcome message only if user just logged in
            const justLoggedIn = localStorage.getItem('justLoggedIn');
            if (justLoggedIn === 'true') {
                setShowWelcomeMessage(true);
                // Clear the flag so it doesn't show again
                localStorage.removeItem('justLoggedIn');
            }
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
        
        checkUploadLimits();
    }, []);

    const checkUploadLimits = async () => {
        try {
            const token = authUtils.getToken();
            const response = await fetch(API_ENDPOINTS.limits, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!response.ok) {
                console.error('Server response not OK:', response.status, response.statusText);
                // Set default limits for anonymous users when server is not available
                setUploadLimits({
                    isAuthenticated: false,
                    limit: 3,
                    used: 0,
                    remaining: 3,
                    canUpload: true
                });
                return;
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Server did not return JSON, got:', contentType);
                // Set default limits when server returns non-JSON
                setUploadLimits({
                    isAuthenticated: false,
                    limit: 3,
                    used: 0,
                    remaining: 3,
                    canUpload: true
                });
                return;
            }
            
            const data = await response.json();
            setUploadLimits(data);
        } catch (error) {
            console.error('Error checking limits:', error);
            // Set default limits when there's an error
            setUploadLimits({
                isAuthenticated: false,
                limit: 3,
                used: 0,
                remaining: 3,
                canUpload: true
            });
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        
        if (!selectedFile) {
            setFile(null);
            setFilePreview(null);
            setPreviewType(null);
            return;
        }

        // Validate file type
        const validation = validateFileType(selectedFile);
        
        if (!validation.isValid) {
            // Show unsupported file modal
            setUnsupportedFileInfo({
                fileName: selectedFile.name,
                detectedType: validation.type
            });
            setShowUnsupportedModal(true);
            
            // Clear the file input
            event.target.value = '';
            setFile(null);
            setFilePreview(null);
            setPreviewType(null);
            return;
        }

        // File is valid, proceed with setting it
        setFile(selectedFile);

        // Preview functionality for valid files
        if (selectedFile.type.startsWith('image/')) {
            // For images, use direct file URL
            const objectUrl = URL.createObjectURL(selectedFile);
            setFilePreview(objectUrl);
            setPreviewType('image');
        } else if (selectedFile.type.startsWith('video/')) {
            // For videos, generate a thumbnail
            generateVideoThumbnail(selectedFile);
            setPreviewType('video');
        } else {
            setFilePreview(null);
            setPreviewType(null);
        }
    };

    // Function to generate thumbnail from video
    const generateVideoThumbnail = (videoFile) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.preload = 'metadata';
        video.muted = true; // Required for autoplay in many browsers
        
        video.onloadedmetadata = () => {
            // Set canvas dimensions to video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Seek to 1 second or 10% of video duration, whichever is smaller
            const seekTime = Math.min(1, video.duration * 0.1);
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            // Draw the video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob and create object URL
            canvas.toBlob((blob) => {
                if (blob) {
                    const thumbnailUrl = URL.createObjectURL(blob);
                    setFilePreview(thumbnailUrl);
                }
            }, 'image/jpeg', 0.8);
            
            // Clean up
            video.remove();
        };

        video.onerror = () => {
            console.warn('Could not generate video thumbnail');
            // Fallback to a default video icon
            setFilePreview(null);
            video.remove();
        };

        // Load the video file
        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;
        video.load();
    };

    const handleUpload = async () => {
        if (!file || !targetFormat) {
            alert('Please select a file and target format');
            return;
        }

        // Validate format compatibility
        const imageFormats = getImageFormats();
        const videoFormats = getVideoFormats();
        
        if (isImageFile && !imageFormats.includes(targetFormat)) {
            alert('Invalid conversion: You can only convert images to supported image formats (JPEG, PNG, WebP)');
            return;
        }
        
        if (isVideoFile && !videoFormats.includes(targetFormat)) {
            alert('Invalid conversion: You can only convert videos to supported video formats (MP4, MOV, WebM, MPG)');
            return;
        }

        // Check if user can upload
        if (uploadLimits && !uploadLimits.canUpload && !uploadLimits.unlimited) {
            alert(`Upload limit reached. You have used ${uploadLimits.used}/${uploadLimits.limit} uploads. Try again after ${new Date(uploadLimits.resetTime).toLocaleString()}`);
            return;
        }

        // If user appears logged in, validate session before uploading
        if (isLoggedIn) {
            const validation = await authUtils.validateForAction();
            if (!validation.valid) {
                if (validation.expired) {
                    // Show session expired modal
                    setShowSessionExpired(true);
                    setUser(null);
                    setIsLoggedIn(false);
                    return;
                } else {
                    // Other validation error, clear auth silently
                    authUtils.clearAuth();
                    setUser(null);
                    setIsLoggedIn(false);
                    // Refresh upload limits for anonymous user
                    checkUploadLimits();
                }
            }
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFormat', targetFormat);

        try {
            const token = authUtils.getToken();
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: formData
            });

            if (!response.ok) {
                console.error('Upload failed:', response.status, response.statusText);
                alert(`Upload failed: ${response.status} ${response.statusText}`);
                return;
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Upload endpoint did not return JSON, got:', contentType);
                alert('Upload failed: Invalid server response');
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                setConversionStatus({ id: data.conversionId, status: 'processing' });
                // Refresh upload limits
                checkUploadLimits();
                // Poll for status updates
                pollConversionStatus(data.conversionId);
                setIsConverting(true);
                setConversionProgress(0);
            } else {
                alert(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const pollConversionStatus = async (conversionId) => {
        const poll = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.status(conversionId));
                
                if (!response.ok) {
                    console.error('Status check failed:', response.status, response.statusText);
                    setConversionStatus(prev => ({ ...prev, status: 'failed' }));
                    return;
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.error('Status endpoint did not return JSON, got:', contentType);
                    setConversionStatus(prev => ({ ...prev, status: 'failed' }));
                    return;
                }
                
                const data = await response.json();
                setConversionStatus(data);
                
                // Update progress
                if (data.progress !== undefined) {
                    setConversionProgress(data.progress);
                }
                
                if (data.status === 'processing') {
                    setTimeout(poll, 2000); // Poll every 2 seconds
                } else {
                    // Conversion finished (completed or failed)
                    setIsConverting(false);
                    if (data.status === 'completed') {
                        setConversionProgress(100);
                        // Notify other components that a new conversion completed
                        window.dispatchEvent(new CustomEvent('conversionCompleted', {
                            detail: { conversionId: conversionId, status: data.status }
                        }));
                        // Also update localStorage timestamp for history refresh
                        localStorage.setItem('lastConversionCompleted', Date.now().toString());
                    }
                }
            } catch (error) {
                console.error('Status check error:', error);
                setConversionStatus(prev => ({ ...prev, status: 'failed' }));
            }
        };
        poll();
    };

    const handleDownload = () => {
        if (conversionStatus && conversionStatus.status === 'completed') {
            window.open(API_ENDPOINTS.download(conversionStatus.id), '_blank');
        }
    };

    const getImageFormats = () => ['jpeg', 'png', 'webp']; // Only supported image formats
    const getVideoFormats = () => ['mp4', 'mov', 'webm', 'mpg']; // Only supported video formats

    // Check if the file is an image or video based on its extension
    const isImageFile = file && /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    const isVideoFile = file && /\.(mp4|mov|webm|mpeg|mpg)$/i.test(file.name);

    // Function to validate file type and show appropriate modal
    const validateFileType = (selectedFile) => {
        const fileName = selectedFile.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // Check for supported image formats
        const supportedImageFormats = ['jpg', 'jpeg', 'png', 'webp'];
        const supportedVideoFormats = ['mp4', 'mov', 'webm', 'mpeg', 'mpg'];
        
        // Check if it's a supported image
        if (supportedImageFormats.includes(fileExtension)) {
            return { isValid: true, type: 'image' };
        }
        
        // Check if it's a supported video
        if (supportedVideoFormats.includes(fileExtension)) {
            return { isValid: true, type: 'video' };
        }
        
        // Check if it's an unsupported image format
        const unsupportedImageFormats = ['gif', 'bmp', 'tiff', 'svg', 'ico', 'tga'];
        if (unsupportedImageFormats.includes(fileExtension) || selectedFile.type.startsWith('image/')) {
            return { isValid: false, type: 'unsupported-image' };
        }
        
        // Check if it's an unsupported video format
        const unsupportedVideoFormats = ['avi', 'wmv', 'flv', 'mkv', 'm4v', '3gp', 'asf'];
        if (unsupportedVideoFormats.includes(fileExtension) || selectedFile.type.startsWith('video/')) {
            return { isValid: false, type: 'unsupported-video' };
        }
        
        // Unknown file type
        return { isValid: false, type: 'unknown' };
    };
    
    // Function to safely get stored user (utility function)
    const getStoredUser = () => {
        try {
            const userString = localStorage.getItem('user');
            
            // Check if userString is null, undefined, empty, or the string 'undefined'/'null'
            if (!userString || userString.trim() === '' || userString === 'undefined' || userString === 'null') {
                return null;
            }
            
            return JSON.parse(userString);
        } catch (error) {
            console.error('Error parsing stored user:', error);
            // Clear corrupted user data
            localStorage.removeItem('user');
            localStorage.removeItem('authToken'); // Also clear token since user data is corrupted
            return null;
        }
    };

    // Cleanup effect for file preview URLs
    useEffect(() => {
        return () => {
            // Cleanup object URLs when component unmounts or file changes
            if (filePreview && filePreview.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">

            {/* Authentication Status */}
            {isLoggedIn && showWelcomeMessage && (
                <div className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <span className="text-gray-800 text-lg">👋 Welcome back, <strong>{user?.username}</strong>!</span>
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-semibold text-sm">
                            🚀 Unlimited Uploads
                        </div>
                    </div>
                </div>
            )}
            
            {!isLoggedIn && (
                <div className="bg-gradient-to-r from-orange-100 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <span className="text-orange-800 text-lg">🎯 You're using anonymous mode</span>
                        <Link to="/login" className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors">
                            🔐 Login for unlimited uploads
                        </Link>
                    </div>
                </div>
            )}
            
            {/* Upload Limits Info */}
            {uploadLimits && !uploadLimits.unlimited && (
                <div className={`rounded-lg p-4 mb-6 text-center ${uploadLimits.canUpload ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-red-100 border border-red-300 text-red-700'}`}>
                    <p className="mb-2">
                        Anonymous uploads: {uploadLimits.used}/{uploadLimits.limit} used
                        {uploadLimits.remaining > 0 
                            ? ` (${uploadLimits.remaining} remaining)` 
                            : ` (Resets at ${new Date(uploadLimits.resetTime).toLocaleString()})`
                        }
                    </p>
                </div>
            )}

            {uploadLimits && uploadLimits.unlimited && showWelcomeMessage && (
                <div className="bg-gradient-to-r from-teal-100 to-cyan-50 border-2 border-teal-200 rounded-lg p-4 mb-6 text-center text-teal-800">
                    <p>🚀 <strong>Unlimited uploads active!</strong> Convert as many files as you need.</p>
                </div>
            )}

            {/* File Upload */}
            <div className="space-y-6">
                {/* File Input Section */}
                <div>
                    {!file && (
                        <>
                            <label htmlFor="file" className="block text-lg font-semibold text-gray-900 mb-4">
                                📁 Select File to Convert
                            </label>
                            <input
                                type="file"
                                id="file"
                                onChange={handleFileChange}
                                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mpg,.mpeg"
                                disabled={isUploading}
                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-purple-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                            <div className="mt-2 text-sm text-gray-600 text-center">
                                <p><strong>Supported formats:</strong></p>
                                <p>📸 Images: JPEG, PNG, WebP | 🎬 Videos: MP4, MOV, WebM, MPG</p>
                            </div>
                        </>
                    )}
                    
                    {/* Hidden file input for changing files */}
                    <input
                        type="file"
                        id="hidden-file"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mpg,.mpeg"
                        disabled={isUploading}
                        className="hidden"
                    />
                        
                        {file && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 relative">
                                {/* Change File Button - Overlay */}
                                <button
                                    onClick={() => {
                                        document.getElementById('hidden-file').click();
                                    }}
                                    disabled={isUploading}
                                    className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white hover:bg-gray-50 text-gray-600 rounded-md transition-colors disabled:opacity-50 shadow-sm border border-gray-200"
                                >
                                    Change
                                </button>
                                
                                <div className="flex items-start space-x-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                        
                                        {/* Thumbnail inside file info */}
                                        {filePreview ? (
                                            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto my-2 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm relative bg-white">
                                                <ImageWithSpinner
                                                    src={filePreview}
                                                    alt="File thumbnail"
                                                    className="w-full h-auto object-cover"
                                                    spinnerSize="medium"
                                                />
                                            </div>
                                        ) : file && previewType === 'video' ? (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg border-2 border-gray-300 bg-gray-100 flex items-center justify-center mx-auto">
                                                <DotsLoader message="" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center mx-auto">
                                                <span className="text-gray-400 text-xs text-center">No<br/>Preview</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                
                {file && (
                    <div className="space-y-4 mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                            <label className="text-lg font-semibold text-gray-700 sm:whitespace-nowrap">🔄 Convert to:</label>
                            <select
                                value={targetFormat}
                                onChange={(e) => setTargetFormat(e.target.value)}
                                disabled={isUploading}
                                className="flex-1 p-3 border border-gray-300 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 disabled:opacity-50"
                            >
                                <option value="">Select format</option>
                                {isImageFile && getImageFormats().map(format => (
                                    <option key={format} value={format}>{format.toUpperCase()}</option>
                                ))}
                                {isVideoFile && getVideoFormats().map(format => (
                                    <option key={format} value={format}>{format.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || !targetFormat || isUploading || (uploadLimits && !uploadLimits.canUpload && !uploadLimits.unlimited)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1 disabled:hover:transform-none shadow-lg flex items-center justify-center mt-6 text-center"
                >
                    {isUploading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Uploading...
                        </div>
                    ) : (
                        '🚀 Convert File'
                    )}
                </button>
                </div>
            </div>

            {/* Conversion Status */}
            {conversionStatus && (
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Status</h3>
                    
                    {/* Progress Bar */}
                    {isConverting && (
                        <div className="mb-6">
                            <ProgressBar 
                                progress={conversionProgress}
                                status={conversionStatus.status}
                                showPercentage={true}
                                height="h-3"
                                animated={true}
                            />
                        </div>
                    )}
                    
                    <p className="mb-4">
                        Status: <span className={`font-semibold ${
                            conversionStatus.status === 'processing' ? 'text-orange-600' :
                            conversionStatus.status === 'completed' ? 'text-green-600' :
                            conversionStatus.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                            {conversionStatus.status === 'processing' && '🔄 '}
                            {conversionStatus.status === 'completed' && '✅ '}
                            {conversionStatus.status === 'failed' && '❌ '}
                            {conversionStatus.status.charAt(0).toUpperCase() + conversionStatus.status.slice(1)}
                        </span>
                    </p>
                    
                    {/* Debug Info */}
                    {conversionStatus.id && (
                        <p className="text-sm text-gray-600 mb-3">
                            <strong>Conversion ID:</strong> {conversionStatus.id}
                        </p>
                    )}
                    
                    {conversionStatus.status === 'completed' && (
                        <button 
                            onClick={handleDownload} 
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            📥 Download Converted File
                        </button>
                    )}
                    {conversionStatus.status === 'failed' && (
                        <div className="space-y-3">
                            <p className="text-red-600 font-semibold">❌ Conversion failed. Please try again.</p>
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                                <p className="text-sm text-red-700 mb-2"><strong>Common issues:</strong></p>
                                <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                                    <li>For video conversions: FFmpeg must be installed on the server</li>
                                    <li>Check if the target format is supported for your file type</li>
                                    <li>File size might be too large</li>
                                    <li>File might be corrupted</li>
                                </ul>
                                <button 
                                    onClick={() => {
                                        setConversionStatus(null);
                                        setFile(null);
                                        setTargetFormat('');
                                    }}
                                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors"
                                >
                                    🔄 Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Session Expired Modal */}
            <SessionExpiredModal
                isOpen={showSessionExpired}
                onClose={() => {
                    setShowSessionExpired(false);
                    // Refresh upload limits for anonymous user
                    checkUploadLimits();
                }}
                onLogin={() => {
                    // Optional callback for when user clicks login
                    localStorage.setItem('returnToUpload', 'true');
                }}
            />

            {/* Unsupported File Modal */}
            <UnsupportedFileModal
                isOpen={showUnsupportedModal}
                onClose={() => {
                    setShowUnsupportedModal(false);
                    setUnsupportedFileInfo({ fileName: '', detectedType: '' });
                }}
                fileName={unsupportedFileInfo.fileName}
                detectedType={unsupportedFileInfo.detectedType}
            />
        </div>
    );
};

export default FileUpload;
