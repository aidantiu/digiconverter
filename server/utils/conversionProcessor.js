const { processImageConversion, isValidImageFormat, isImageFile } = require('./imageProcessor');
const { processVideoConversion, isValidVideoFormat, isVideoFile } = require('./videoProcessor');
const { Conversion } = require('../model/models');

/**
 * Main conversion function that routes to appropriate processor
 * @param {Buffer} fileBuffer - The file data as Buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} targetFormat - Target format for conversion
 * @param {string} conversionId - MongoDB conversion record ID
 * @returns {Promise<Object>} - Promise resolving to conversion result
 */
async function convertFile(fileBuffer, originalName, mimeType, targetFormat, conversionId) {
    const isImage = isImageFile(originalName);
    const isVideo = isVideoFile(originalName);

    // Validate file type
    if (!isImage && !isVideo) {
        throw new Error('Unsupported file type. Please upload a supported image (JPEG, PNG, WebP) or video file (MP4, MOV, WebM, MPG).');
    }

    // Validate target format compatibility
    if (isImage && !isValidImageFormat(targetFormat)) {
        const imageFormats = ['jpeg', 'jpg', 'png', 'webp'];
        throw new Error(`Cannot convert image to ${targetFormat}. Supported image formats: ${imageFormats.join(', ')}`);
    }

    if (isVideo && !isValidVideoFormat(targetFormat)) {
        const videoFormats = ['mp4', 'mov', 'webm', 'mpeg', 'mpg'];
        throw new Error(`Cannot convert video to ${targetFormat}. Supported video formats: ${videoFormats.join(', ')}`);
    }

    // Route to appropriate processor
    if (isImage) {
        return await processImageConversion(fileBuffer, originalName, mimeType, targetFormat, conversionId);
    } else {
        return await processVideoConversion(fileBuffer, originalName, mimeType, targetFormat, conversionId);
    }
}

module.exports = {
    convertFile,
    isImageFile,
    isVideoFile,
    isValidImageFormat,
    isValidVideoFormat
};
