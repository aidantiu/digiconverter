import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { authUtils } from '../utils/auth';
import Loader, { DotsLoader } from './Loader';
import ProgressBar, { CircularProgress } from './ProgressBar';
import SessionExpiredModal from './SessionExpiredModal';
import UnsupportedFileModal from './UnsupportedFileModal';

// Modular components
import FileDropZone from './FileUpload/FileDropZone';
import FileListItem from './FileUpload/FileListItem';
import FormatSelector from './FileUpload/FormatSelector';

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

const FileUpload = ({ onUploadLimits }) => {
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
        const authStatus = authUtils.getQuickAuthStatus();
        
        if (authStatus.authenticated) {
            setUser(authStatus.user);
            setIsLoggedIn(true);
            
            const justLoggedIn = localStorage.getItem('justLoggedIn');
            if (justLoggedIn === 'true') {
                setShowWelcomeMessage(true);
            }
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
        
        checkUploadLimits();
    }, []);

    // Check upload limits
    const checkUploadLimits = async () => {
        try {
            const token = authUtils.getToken();
            const response = await fetch(API_ENDPOINTS.limits, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!response.ok) {
                const fallback = {
                    isAuthenticated: false,
                    limit: 3,
                    used: 0,
                    remaining: 3,
                    canUpload: true
                };
                setUploadLimits(fallback);
                if (onUploadLimits) onUploadLimits(fallback);
                return;
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const fallback = {
                    isAuthenticated: false,
                    limit: 3,
                    used: 0,
                    remaining: 3,
                    canUpload: true
                };
                setUploadLimits(fallback);
                if (onUploadLimits) onUploadLimits(fallback);
                return;
            }
            
            const data = await response.json();
            setUploadLimits(data);
            if (onUploadLimits) onUploadLimits(data);
        } catch (error) {
            console.error('Error checking upload limits:', error);
            const fallback = {
                isAuthenticated: false,
                limit: 3,
                used: 0,
                remaining: 3,
                canUpload: true
            };
            setUploadLimits(fallback);
            if (onUploadLimits) onUploadLimits(fallback);
        }
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate file
        const validation = validateFile(selectedFile);
        if (!validation.isValid) {
            if (validation.type === 'unsupported-video') {
                setUnsupportedFileInfo({ 
                    fileName: selectedFile.name, 
                    detectedType: 'video' 
                });
                setShowUnsupportedModal(true);
            }
            return;
        }

        setFile(selectedFile);
        setTargetFormat('');
        setConversionStatus(null);

        // Create preview
        const fileType = selectedFile.type.startsWith('image/') ? 'image' : 
                        selectedFile.type.startsWith('video/') ? 'video' : null;
        setPreviewType(fileType);

        if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        } else if (fileType === 'video') {
            const url = URL.createObjectURL(selectedFile);
            setFilePreview(url);
        }
    };

    // Validate file
    const validateFile = (file) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg'
        ];

        if (allowedTypes.includes(file.type)) {
            return { isValid: true };
        }

        // Check for unsupported video formats
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();
        const unsupportedVideoFormats = ['avi', 'wmv', 'flv', 'mkv', 'm4v', '3gp', 'asf'];
        
        if (unsupportedVideoFormats.includes(fileExtension) || file.type.startsWith('video/')) {
            return { isValid: false, type: 'unsupported-video' };
        }
        
        return { isValid: false, type: 'unknown' };
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!file || !targetFormat) return;

        if (!uploadLimits?.canUpload && !uploadLimits?.unlimited) {
            setShowSessionExpired(true);
            return;
        }

        setIsUploading(true);
        setIsConverting(false);
        setConversionProgress(0);

        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('targetFormat', targetFormat);

            const token = authUtils.getToken();
            console.log('Uploading to:', API_ENDPOINTS.upload);
            
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Non-JSON upload response:', responseText.substring(0, 200));
                throw new Error('Server returned non-JSON response');
            }

            const result = await response.json();
            console.log('Upload result:', result);
            
            // Set initial conversion status with the conversion ID
            const initialStatus = {
                ...result,
                status: 'processing',
                id: result.conversionId || result.id
            };
            setConversionStatus(initialStatus);
            setIsUploading(false);
            setIsConverting(true);

            // Poll for conversion status - use conversionId from server response
            const conversionId = result.conversionId || result.id;
            if (conversionId) {
                pollConversionStatus(conversionId);
            } else {
                console.error('No conversion ID received from server');
                setConversionStatus({ status: 'failed', error: 'No conversion ID received' });
                setIsConverting(false);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setConversionStatus({ status: 'failed', error: error.message });
            setIsUploading(false);
        }

    };

    // Poll for conversion status
    const pollConversionStatus = async (conversionId) => {
        try {
            const token = authUtils.getToken();
            const statusUrl = API_ENDPOINTS.status(conversionId);
            console.log('Polling status from:', statusUrl);
            
            const response = await fetch(statusUrl, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Status check failed:', response.status, errorText);
                throw new Error(`Failed to check conversion status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Non-JSON response received:', responseText.substring(0, 200));
                throw new Error('Server returned non-JSON response');
            }

            const status = await response.json();
            console.log('Conversion status:', status);
            setConversionStatus(status);

            if (status.progress !== undefined) {
                setConversionProgress(status.progress);
            }

            if (status.status === 'processing') {
                setTimeout(() => pollConversionStatus(conversionId), 2000);
            } else {
                setIsConverting(false);
                if (status.status === 'completed') {
                    checkUploadLimits(); // Refresh limits after successful conversion
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
            setConversionStatus({ status: 'failed', error: error.message });
            setIsConverting(false);
        }
    };

    // Cleanup effect for file preview URLs
    useEffect(() => {
        return () => {
            if (filePreview && filePreview.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    return (
        <div className="w-full mx-auto bg-white rounded-2xl shadow-lg p-8">
            {/* File Upload Section */}
            <div className="space-y-6">
                {/* File Drop Zone - Show when no file is selected */}
                {!file && (
                    <FileDropZone 
                        onFileChange={handleFileChange} 
                        disabled={isUploading} 
                    />
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

                {/* Selected Files List */}
                {file && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Selected Files</h3>
                        
                        <FileListItem
                            file={file}
                            filePreview={filePreview}
                            previewType={previewType}
                            onChangeFile={() => document.getElementById('hidden-file').click()}
                            onRemoveFile={() => {
                                setFile(null);
                                setFilePreview(null);
                                setPreviewType(null);
                                setTargetFormat('');
                                setConversionStatus(null);
                            }}
                            disabled={isUploading || isConverting}
                        />

                        {/* Format Selector */}
                        <FormatSelector
                            selectedFormat={targetFormat}
                            onFormatChange={setTargetFormat}
                            fileType={previewType}
                            disabled={isUploading || isConverting}
                        />

                        {/* Convert Button & Status Area */}
                        {targetFormat && (
                            <div className="flex flex-col lg:flex-row items-center lg:items-center lg:justify-end space-y-2 lg:space-y-0 lg:space-x-4">
                                {/* Show Convert Button only when not processing */}
                                {!isUploading && !isConverting && conversionStatus?.status !== 'processing' && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={!uploadLimits?.canUpload && !uploadLimits?.unlimited}
                                        className="w-full lg:w-auto px-8 py-3 bg-black text-sm text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Convert Now
                                    </button>
                                )}
                                
                                {/* Converting/Processing Status with Progress */}
                                {(isConverting || conversionStatus?.status === 'processing') && (
                                    <div className="w-full lg:w-auto px-8 py-3 bg-orange-100 text-sm text-orange-700 font-semibold rounded-lg border border-orange-200">
                                        <span className="flex items-center justify-center lg:justify-start">
                                            <span className="ml-2">Converting... {conversionProgress > 0 && `${conversionProgress}%`}</span>
                                        </span>
                                    </div>
                                )}
                                
                                {/* Success Confirmation & Download */}
                                {conversionStatus?.status === 'completed' && (
                                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 w-full lg:w-auto">
                                        {/* Success Confirmation */}
                                        <div className="flex-1 lg:flex-initial px-6 py-3 bg-green-100 text-sm text-green-700 font-semibold rounded-lg border border-green-200">
                                            <span className="flex items-center justify-center lg:justify-start">
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                </svg>
                                                Conversion Successful!
                                            </span>
                                        </div>
                                        
                                        {/* Download Button */}
                                        <button
                                            onClick={() => {
                                                // Construct download URL from conversion ID
                                                const conversionId = conversionStatus?.id || conversionStatus?.conversionId;
                                                if (conversionId) {
                                                    const token = authUtils.getToken();
                                                    const downloadUrl = API_ENDPOINTS.download(conversionId);
                                                    
                                                    console.log('Attempting download from:', downloadUrl);
                                                    console.log('Conversion status:', conversionStatus);
                                                    
                                                    // If user is authenticated, include auth header using fetch
                                                    if (token) {
                                                        fetch(downloadUrl, {
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`
                                                            }
                                                        })
                                                        .then(async response => {
                                                            if (!response.ok) {
                                                                // Try to get error message from server
                                                                const errorText = await response.text();
                                                                console.error('Download failed with status:', response.status);
                                                                console.error('Server error:', errorText);
                                                                throw new Error(`Download failed (${response.status}): ${errorText}`);
                                                            }
                                                            return response.blob();
                                                        })
                                                        .then(blob => {
                                                            // Create download link
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${file?.name?.split('.')[0] || 'converted'}.${conversionStatus?.targetFormat || 'file'}`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                            document.body.removeChild(a);
                                                        })
                                                        .catch(error => {
                                                            console.error('Download error:', error);
                                                            alert(`Download failed: ${error.message}`);
                                                            // Fallback to direct link
                                                            window.open(downloadUrl, '_blank');
                                                        });
                                                    } else {
                                                        // For anonymous users, direct link works fine
                                                        window.open(downloadUrl, '_blank');
                                                    }
                                                } else {
                                                    console.error('No conversion ID found for download');
                                                    alert('No conversion ID found for download');
                                                }
                                            }}
                                            className="flex-1 lg:flex-initial px-8 py-3 border-1 border-black bg-white text-sm text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <span className="flex items-center justify-center lg:justify-start">
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                                                </svg>
                                                Download File
                                            </span>
                                        </button>
                                    </div>
                                )}
                                
                                {/* Failed Confirmation & Try Again */}
                                {conversionStatus?.status === 'failed' && (
                                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 w-full lg:w-auto">
                                        {/* Failed Confirmation */}
                                        <div className="flex-1 lg:flex-initial px-6 py-3 bg-red-100 text-sm text-red-700 font-semibold rounded-lg border border-red-200">
                                            <span className="flex items-center justify-center lg:justify-start">
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                                </svg>
                                                Conversion Failed!
                                            </span>
                                        </div>
                                        
                                        {/* Try Again Button */}
                                        <button
                                            onClick={() => {
                                                setConversionStatus(null);
                                                setFile(null);
                                                setFilePreview(null);
                                                setPreviewType(null);
                                                setTargetFormat('');
                                            }}
                                            className="flex-1 lg:flex-initial px-8 py-3 bg-red-600 text-sm text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <span className="flex items-center justify-center lg:justify-start">
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                                                </svg>
                                                Try Again
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <SessionExpiredModal
                isOpen={showSessionExpired}
                onClose={() => {
                    setShowSessionExpired(false);
                    checkUploadLimits();
                }}
                onLogin={() => {
                    localStorage.setItem('returnToUpload', 'true');
                }}
            />

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