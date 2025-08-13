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
import ConversionStatus from './FileUpload/ConversionStatus';

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

                        {/* Convert Button */}
                        {targetFormat && (
                            <div className="flex flex-col items-center space-y-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={!uploadLimits?.canUpload && !uploadLimits?.unlimited || isUploading || isConverting}
                                    className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <>
                                            <DotsLoader /> Uploading...
                                        </>
                                    ) : isConverting ? (
                                        <>
                                            <DotsLoader /> Converting...
                                        </>
                                    ) : (
                                        '🔄 Convert File'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Conversion Status */}
            <ConversionStatus
                status={conversionStatus}
                progress={conversionProgress}
                onDownload={() => {
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
                onTryAgain={() => {
                    setConversionStatus(null);
                    setFile(null);
                    setFilePreview(null);
                    setPreviewType(null);
                    setTargetFormat('');
                }}
                fileName={file?.name}
            />

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