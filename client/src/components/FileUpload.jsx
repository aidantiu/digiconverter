import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

// Debug function - add to window for manual cleanup
if (typeof window !== 'undefined') {
    window.clearDigiConverterData = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
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

    // Check upload limits on component mount
    useEffect(() => {
        // Clean up any corrupted localStorage data on mount and set user state
        try {
            const userString = localStorage.getItem('user');
            const token = localStorage.getItem('authToken');
            
            // More robust checking for valid user data
            if (userString && userString.trim() !== '' && userString !== 'undefined' && userString !== 'null') {
                const parsedUser = JSON.parse(userString);
                setUser(parsedUser);
            } else {
                setUser(null);
            }
            
            setIsLoggedIn(!!token && token !== 'undefined' && token !== 'null');
        } catch (error) {
            console.warn('Cleaning up corrupted localStorage data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            setUser(null);
            setIsLoggedIn(false);
        }
        
        checkUploadLimits();
    }, []);

    const checkUploadLimits = async () => {
        try {
            const token = localStorage.getItem('authToken');
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
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !targetFormat) {
            alert('Please select a file and target format');
            return;
        }

        // Check if user can upload
        if (uploadLimits && !uploadLimits.canUpload && !uploadLimits.unlimited) {
            alert(`Upload limit reached. You have used ${uploadLimits.used}/${uploadLimits.limit} uploads. Try again after ${new Date(uploadLimits.resetTime).toLocaleString()}`);
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFormat', targetFormat);

        try {
            const token = localStorage.getItem('authToken');
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
                
                if (data.status === 'processing') {
                    setTimeout(poll, 2000); // Poll every 2 seconds
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

    const getImageFormats = () => ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'];
    const getVideoFormats = () => ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'];

    const isImageFile = file && /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(file.name);
    const isVideoFile = file && /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(file.name);
    
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

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">File Converter</h2>
            
            {/* Authentication Status */}
            {isLoggedIn ? (
                <div className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <span className="text-gray-800 text-lg">👋 Welcome back, <strong>{user?.username}</strong>!</span>
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-semibold text-sm">
                            🚀 Unlimited Uploads
                        </div>
                    </div>
                </div>
            ) : (
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
                    {!uploadLimits.canUpload && (
                        <p>
                            <strong>Want unlimited uploads? <Link to="/login" className="text-purple-600 hover:text-purple-800 underline">Login now!</Link></strong>
                        </p>
                    )}
                </div>
            )}

            {uploadLimits && uploadLimits.unlimited && (
                <div className="bg-gradient-to-r from-teal-100 to-cyan-50 border-2 border-teal-200 rounded-lg p-4 mb-6 text-center text-teal-800">
                    <p>🚀 <strong>Unlimited uploads active!</strong> Convert as many files as you need.</p>
                </div>
            )}

            {/* File Upload */}
            <div className="space-y-6">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    disabled={isUploading}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-purple-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                {file && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Convert to:</label>
                        <select
                            value={targetFormat}
                            onChange={(e) => setTargetFormat(e.target.value)}
                            disabled={isUploading}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 disabled:opacity-50"
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
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || !targetFormat || isUploading || (uploadLimits && !uploadLimits.canUpload && !uploadLimits.unlimited)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1 disabled:hover:transform-none shadow-lg"
                >
                    {isUploading ? '🔄 Uploading...' : '🚀 Convert File'}
                </button>
            </div>

            {/* Conversion Status */}
            {conversionStatus && (
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Status</h3>
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
        </div>
    );
};

export default FileUpload;
