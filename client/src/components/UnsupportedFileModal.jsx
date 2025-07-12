import React from 'react';

const UnsupportedFileModal = ({ isOpen, onClose, fileName, detectedType }) => {
    if (!isOpen) return null;

    const getSupportedFormats = () => {
        return {
            images: ['JPEG', 'PNG', 'WebP'],
            videos: ['MP4', 'MOV', 'WebM', 'MPG']
        };
    };

    const getFileTypeMessage = () => {
        const supportedFormats = getSupportedFormats();
        
        if (detectedType === 'unknown') {
            return {
                title: 'Unsupported File Type',
                message: 'The file you uploaded is not a supported image or video format.',
                suggestion: 'Please upload a supported file type.'
            };
        }
        
        if (detectedType === 'unsupported-image') {
            return {
                title: 'Unsupported Image Format',
                message: 'This image format is not supported.',
                suggestion: `Please convert your image to one of these formats: ${supportedFormats.images.join(', ')}`
            };
        }
        
        if (detectedType === 'unsupported-video') {
            return {
                title: 'Unsupported Video Format',
                message: 'This video format is not supported.',
                suggestion: `Please convert your video to one of these formats: ${supportedFormats.videos.join(', ')}`
            };
        }
        
        return {
            title: 'File Not Supported',
            message: 'The selected file format is not supported.',
            suggestion: 'Please choose a different file.'
        };
    };

    const { title, message, suggestion } = getFileTypeMessage();
    const supportedFormats = getSupportedFormats();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="ml-3 text-lg font-medium text-gray-900">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">File:</span> {fileName}
                        </p>
                        <p className="text-gray-700 mb-4">{message}</p>
                        <p className="text-sm text-gray-600 mb-6">{suggestion}</p>
                    </div>

                    {/* Supported Formats */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Supported Formats:</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Images */}
                            <div>
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Images</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {supportedFormats.images.map((format) => (
                                        <span key={format} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                            {format}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Videos */}
                            <div>
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Videos</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {supportedFormats.videos.map((format) => (
                                        <span key={format} className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                            {format}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Choose Another File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add some CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
    }
`;
if (!document.head.querySelector('style[data-unsupported-modal]')) {
    style.setAttribute('data-unsupported-modal', 'true');
    document.head.appendChild(style);
}

export default UnsupportedFileModal;
