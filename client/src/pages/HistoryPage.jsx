import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { PageLoader, CardLoader } from '../components/Loader';
import { MiniProgressBar } from '../components/ProgressBar';

const HistoryPage = () => {
    const [history, setHistory] = useState({ images: [], videos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategorizedHistory();
    }, []);

    const fetchCategorizedHistory = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_ENDPOINTS.history}/categorized`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }

            const data = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

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

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const ConversionCard = ({ conversion, type }) => {
        const [thumbnailError, setThumbnailError] = useState(false);
        const [thumbnailLoading, setThumbnailLoading] = useState(true);

        const getThumbnailUrl = () => {
            if (conversion.status !== 'completed' || !conversion.convertedFileName) {
                return null;
            }
            
            if (type === 'image') {
                return API_ENDPOINTS.thumbnailImage(conversion._id);
            } else {
                return API_ENDPOINTS.thumbnailVideo(conversion._id);
            }
        };

        const handleThumbnailLoad = () => {
            setThumbnailLoading(false);
        };

        const handleThumbnailError = (error) => {
            setThumbnailError(true);
            setThumbnailLoading(false);
            console.warn('Thumbnail loading failed:', error);
        };

        const thumbnailUrl = getThumbnailUrl();

        return (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Thumbnail/Icon Section */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden flex items-center justify-center">
                    {thumbnailUrl && !thumbnailError && conversion.status === 'completed' ? (
                        <div className="relative w-full h-full">
                            {thumbnailLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                </div>
                            )}
                            <img
                                src={thumbnailUrl}
                                alt={conversion.originalFileName}
                                className="w-full h-full object-cover"
                                onLoad={handleThumbnailLoad}
                                onError={handleThumbnailError}
                            />
                            {type === 'video' && !thumbnailLoading && !thumbnailError && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black bg-opacity-50 rounded-full p-3">
                                        <div className="text-white text-2xl">▶️</div>
                                    </div>
                                </div>
                            )}
                        </div>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            conversion.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : conversion.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {conversion.status}
                        </span>
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
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-2xl font-bold text-gray-900">DigiConverter</h1>
                        <nav className="flex space-x-8">
                            <Link to="/" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Home</Link>
                            <Link to="/upload" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Upload</Link>
                            <Link to="/history" className="text-purple-600 font-semibold">History</Link>
                            <Link to="/login" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors">Login</Link>
                        </nav>
                    </div>
                </div>
            </header>

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
                                ({history.images.length}/5)
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
                                ({history.videos.length}/5)
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
            </main>
        </div>
    );
};

export default HistoryPage;
