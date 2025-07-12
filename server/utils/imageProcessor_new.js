const sharp = require('sharp');
const { Conversion } = require('../model/models');

/**
 * Process image conversion using Sharp with Buffer data
 * @param {Buffer} fileBuffer - The file data as Buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} targetFormat - Target format for conversion
 * @param {string} conversionId - MongoDB conversion record ID
 * @returns {Promise<Object>} - Promise resolving to conversion result
 */
async function processImageConversion(fileBuffer, originalName, mimeType, targetFormat, conversionId) {
    console.log(`🖼️ Converting image: ${originalName} -> ${targetFormat}`);
    
    // Set initial progress
    try {
        await Conversion.findByIdAndUpdate(conversionId, { progress: 10 });
    } catch (updateError) {
        console.warn('Could not update initial progress:', updateError.message);
    }
    
    try {
        // Add timeout for Sharp operations
        const sharpTimeout = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Sharp conversion timeout after 5 minutes'));
            }, 5 * 60 * 1000); // 5 minutes timeout for image conversion
        });

        // Convert using Sharp with Buffer input/output
        const sharpConversion = sharp(fileBuffer)
            .timeout({ seconds: 300 }) // 5 minutes timeout
            .toFormat(targetFormat)
            .toBuffer();

        const convertedBuffer = await Promise.race([sharpConversion, sharpTimeout]);

        // Generate converted filename
        const convertedFileName = `converted_${conversionId}.${targetFormat}`;
        const convertedMimeType = getImageMimeType(targetFormat);

        // Generate thumbnail for display
        const thumbnailBuffer = await sharp(convertedBuffer)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Update conversion record with file data
        await Conversion.findByIdAndUpdate(conversionId, { 
            progress: 100,
            convertedFileName: convertedFileName,
            convertedFileData: convertedBuffer,
            convertedMimeType: convertedMimeType,
            thumbnailData: thumbnailBuffer,
            thumbnailMimeType: 'image/jpeg'
        });

        console.log(`✅ Image conversion completed: ${convertedFileName}`);
        
        return {
            fileName: convertedFileName,
            mimeType: convertedMimeType,
            buffer: convertedBuffer
        };

    } catch (error) {
        console.error(`❌ Image conversion failed for ${originalName}:`, error.message);
        throw new Error(`Image conversion failed: ${error.message}`);
    }
}

/**
 * Get MIME type for image format
 * @param {string} format - Image format
 * @returns {string} - MIME type
 */
function getImageMimeType(format) {
    const mimeTypes = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
    };
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}

/**
 * Check if a format is a valid image format for conversion
 * @param {string} format - Format to check
 * @returns {boolean} - True if valid image format
 */
function isValidImageFormat(format) {
    const validFormats = ['jpeg', 'jpg', 'png', 'webp']; // Only supported formats
    return validFormats.includes(format.toLowerCase());
}

/**
 * Check if a filename indicates an image file
 * @param {string} filename - Filename to check
 * @returns {boolean} - True if image file
 */
function isImageFile(filename) {
    const imageExtensions = /\.(jpg|jpeg|png|webp)$/i;
    return imageExtensions.test(filename);
}

module.exports = {
    processImageConversion,
    isValidImageFormat,
    isImageFile,
    getImageMimeType
};
