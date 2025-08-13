import React from 'react';
import ImageWithSpinner from '../ImageWithSpinner';
import { FaRegImages } from "react-icons/fa";
import { CiVideoOn } from "react-icons/ci";

const FileListItem = ({ 
    file, 
    filePreview, 
    previewType, 
    onChangeFile, 
    onRemoveFile, 
    disabled = false 
}) => {
    const formatFileSize = (bytes) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = () => {
        if (previewType === 'image') {
            return <FaRegImages className="w-6 h-6 text-blue-500" />;
        } else if (previewType === 'video') {
            return <CiVideoOn className="w-6 h-6 text-purple-500" />;
        }
        return <FaRegImages className="w-6 h-6 text-gray-500" />;
    };

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
                {/* Thumbnail or Icon */}
                <div className="flex-shrink-0">
                    {filePreview ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                            <ImageWithSpinner
                                src={filePreview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                            {getFileIcon()}
                        </div>
                    )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                        {previewType || 'Unknown'} file
                    </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex space-x-2">
                    <button
                        onClick={onChangeFile}
                        disabled={disabled}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Change
                    </button>
                    <button
                        onClick={onRemoveFile}
                        disabled={disabled}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileListItem;
