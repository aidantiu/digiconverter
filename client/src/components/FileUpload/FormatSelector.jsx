import React from 'react';

const FormatSelector = ({ 
    selectedFormat, 
    onFormatChange, 
    fileType, 
    disabled = false 
}) => {
    const getAvailableFormats = () => {
        if (fileType === 'image') {
            return [
                { value: 'jpeg', label: 'JPEG' },
                { value: 'png', label: 'PNG' },
                { value: 'webp', label: 'WebP' }
            ];
        } else if (fileType === 'video') {
            return [
                { value: 'mp4', label: 'MP4' },
                { value: 'webm', label: 'WebM' },
                { value: 'mov', label: 'MOV' }
            ];
        }
        return [];
    };

    const formats = getAvailableFormats();

    if (formats.length === 0) {
        return (
            <div className="text-sm text-gray-500">
                No conversion formats available for this file type.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                Convert to format:
            </label>
            <select
                id="format"
                value={selectedFormat}
                onChange={(e) => onFormatChange(e.target.value)}
                disabled={disabled}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">Select target format</option>
                {formats.map((format) => (
                    <option key={format.value} value={format.value}>
                        {format.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FormatSelector;
