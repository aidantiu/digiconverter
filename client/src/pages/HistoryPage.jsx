import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { authUtils } from '../utils/auth';
import { PageLoader, CardLoader } from '../components/Loader';
import { MiniProgressBar } from '../components/ProgressBar';
import Navbar from '../components/Navbar';
import SessionExpiredModal from '../components/SessionExpiredModal';
import { ThumbnailWithSpinner } from '../components/ImageWithSpinner';
import { preloadImages } from '../utils/cache';

const HistoryPage = () => {
    const [history, setHistory] = useState({ images: [], videos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSessionExpired, setShowSessionExpired] = useState(false);

    useEffect(() => {
        fetchCategorizedHistory();

        // Listen for conversion completion events
        const handleConversionCompleted = (event) => {
            console.log('🔄 Conversion completed, refreshing history...', event.detail);
            // Add a small delay to ensure the backend has processed the completion
            setTimeout(() => {
                fetchCategorizedHistory();
            }, 1000);
        };

        // Listen for localStorage changes (for cross-tab updates)
        const handleStorageChange = (event) => {
            if (event.key === 'lastConversionCompleted') {
                console.log('🔄 Detected conversion completion in another tab, refreshing...');
                setTimeout(() => {
                    fetchCategorizedHistory();
                }, 1000);
            }
        };

        window.addEventListener('conversionCompleted', handleConversionCompleted);
        window.addEventListener('storage', handleStorageChange);

        // Cleanup listeners
        return () => {
            window.removeEventListener('conversionCompleted', handleConversionCompleted);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const fetchCategorizedHistory = async () => {
        try {
            // Check if user appears to be logged in and validate if so
            if (authUtils.isLoggedIn()) {
                const validation = await authUtils.validateForAction();
                if (!validation.valid && validation.expired) {
                    setShowSessionExpired(true);
                    setLoading(false);
                    return;
                }
            }

            // Fetch categorized history from the API
            const token = authUtils.getToken();
            const response = await fetch(`${API_ENDPOINTS.history}/categorized`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized - session might have expired
                    setShowSessionExpired(true);
                    return;
                }
                throw new Error('Failed to fetch history');
            }

            // Parse the response
            const data = await response.json();
            setHistory(data);
            
            // Preload thumbnails for better UX
            const thumbnailUrls = [];
            ['images', 'videos'].forEach(category => {
                if (data[category]) {
                    data[category].forEach(conversion => {
                        if (conversion.status === 'completed') {
                            const thumbnailUrl = category === 'images' 
                                ? API_ENDPOINTS.thumbnailImage(conversion._id)
                                : API_ENDPOINTS.thumbnailVideo(conversion._id);
                            thumbnailUrls.push(thumbnailUrl);
                        }
                    });
                }
            });
            
            // Preload thumbnails in the background
            if (thumbnailUrls.length > 0) {
                preloadImages(thumbnailUrls).catch(error => {
                    console.warn('Some thumbnails failed to preload:', error);
                });
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Format time ago for display
    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d ago`;
        if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)} wk ago`;
        if (diffInSeconds < 29030400) return `${Math.floor(diffInSeconds / 2419200)} m ago`;
        return `${Math.floor(diffInSeconds / 29030400)} y ago`;
    };

    // Format file size for display
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Render history items
    const ConversionCard = ({ conversion, type }) => {
        const [thumbnailError, setThumbnailError] = useState(false);
        const [thumbnailUrl, setThumbnailUrl] = useState(null);

        // Fetch thumbnail when component mounts
        useEffect(() => {
            const fetchThumbnail = async () => {
                if (conversion.status !== 'completed' || !conversion.convertedFileName) {
                    return;
                }

                try {
                    const token = localStorage.getItem('authToken');
                    const apiUrl = type === 'image' 
                        ? API_ENDPOINTS.thumbnailImage(conversion._id)
                        : API_ENDPOINTS.thumbnailVideo(conversion._id);

                    const response = await fetch(apiUrl, {
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : ''
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch thumbnail: ${response.status}`);
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setThumbnailUrl(url);
                } catch (error) {
                    console.warn('Thumbnail loading failed:', error);
                    setThumbnailError(true);
                }
            };

            fetchThumbnail();
        }, [conversion._id, conversion.status, type, conversion.convertedFileName]);

        // Cleanup object URL when component unmounts or when thumbnailUrl changes
        useEffect(() => {
            return () => {
                if (thumbnailUrl) {
                    URL.revokeObjectURL(thumbnailUrl);
                }
            };
        }, [thumbnailUrl]);

        const handleThumbnailError = (error) => {
            setThumbnailError(true);
            console.warn('Thumbnail display failed:', error);
        };

        return (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Thumbnail/Icon Section */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden flex items-center justify-center">
                    {thumbnailUrl && !thumbnailError && conversion.status === 'completed' ? (
                        <ThumbnailWithSpinner
                            src={thumbnailUrl}
                            alt={conversion.originalFileName}
                            size="large"
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                            onError={handleThumbnailError}
                        />
                    ) : (
                        <div className="text-center">
                            <div className="text-6xl mb-2">
                                {conversion.status === 'failed' ? '❌' : 
                                 conversion.status === 'processing' ? '⏳' :
                                 type === 'image' ? '🖼️' : '🎥'}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                {conversion.status === 'failed' ? 'Upload Failed' :
                                 conversion.status === 'processing' ? 'Processing...' : 
                                 type === 'image' ? 'Image File' : 'Video File'
                                }
                            </div>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            conversion.status === 'completed' 
                                ? 'bg-green-100 text-green-600' 
                                : conversion.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                        }`}>
                            {conversion.status === 'completed' ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : conversion.status === 'processing' ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>
                    
                    {/* Progress bar for processing conversions */}
                    {conversion.status === 'processing' && (
                        <div className="absolute bottom-0 left-0 right-0">
                            <MiniProgressBar 
                                progress={conversion.progress || 0} 
                                status={conversion.status} 
                            />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 truncate" title={conversion.originalFileName}>
                        {conversion.originalFileName}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>Conversion:</span>
                            <span className="font-medium text-purple-600">
                                {conversion.originalFormat.toUpperCase()} → {conversion.targetFormat.toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span>Size:</span>
                            <span className="font-medium">{formatFileSize(conversion.fileSize)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span>Created:</span>
                            <span className="font-medium">{formatTimeAgo(conversion.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <PageLoader message="Loading your conversion history..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversion History</h1>
                    <p className="text-gray-600">View your recent file conversions organized by type</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        Error: {error}
                    </div>
                )}

                {/* Images Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <span className="mr-2">🖼️</span>
                            Images
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({history.images.length})
                            </span>
                        </h2>
                    </div>

                    {history.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {history.images.map((conversion) => (
                                <ConversionCard 
                                    key={conversion._id} 
                                    conversion={conversion} 
                                    type="image" 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-4xl mb-4">🖼️</div>
                            <p className="text-gray-600 mb-4">No image conversions yet</p>
                            <Link 
                                to="/upload" 
                                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Convert Your First Image
                            </Link>
                        </div>
                    )}
                </div>

                {/* Videos Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <span className="mr-2">🎥</span>
                            Videos
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({history.videos.length})
                            </span>
                        </h2>
                    </div>

                    {history.videos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {history.videos.map((conversion) => (
                                <ConversionCard 
                                    key={conversion._id} 
                                    conversion={conversion} 
                                    type="video" 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-4xl mb-4">🎥</div>
                            <p className="text-gray-600 mb-4">No video conversions yet</p>
                            <Link 
                                to="/upload" 
                                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Convert Your First Video
                            </Link>
                        </div>
                    )}
                </div>

                {/* Session Expired Modal */}
                <SessionExpiredModal 
                    isOpen={showSessionExpired} 
                    onClose={() => setShowSessionExpired(false)} 
                />
            </main>
        </div>
    );
};

export default HistoryPage;
