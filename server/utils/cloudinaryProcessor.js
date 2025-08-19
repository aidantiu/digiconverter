const cloudinary = require('../config/cloudinary');
const { Conversion } = require('../model/models');
const fetch = require('node-fetch'); // You'll need to install this: npm install node-fetch

// Convert file using Cloudinary transformations
const convertFileFromCloudinary = async (originalUrl, originalCloudinaryId, originalFileName, originalMimeType, targetFormat, conversionId) => {
    try {
        console.log(`🔄 Starting Cloudinary conversion for: ${originalFileName}`);
        
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) {
            throw new Error('Conversion record not found');
        }

        // Update progress
        conversion.progress = 10;
        await conversion.save();

        const isImage = originalMimeType.startsWith('image/');
        const isVideo = originalMimeType.startsWith('video/');

        let convertedUrl, thumbnailUrl;
        let convertedCloudinaryId, thumbnailCloudinaryId;

        if (isImage) {
            // For images, use Cloudinary's transformation API
            const result = await convertImageWithCloudinary(originalCloudinaryId, targetFormat);
            convertedUrl = result.secure_url;
            convertedCloudinaryId = result.public_id;
            
            // For images, create a thumbnail (resize to 300x300)
            thumbnailUrl = cloudinary.url(originalCloudinaryId, {
                width: 300,
                height: 300,
                crop: 'fill',
                quality: 'auto',
                format: 'jpg'
            });
            thumbnailCloudinaryId = `${originalCloudinaryId}_thumbnail`;
            
        } else if (isVideo) {
            // For videos, use Cloudinary's video transformation API
            const result = await convertVideoWithCloudinary(originalCloudinaryId, targetFormat);
            convertedUrl = result.secure_url;
            convertedCloudinaryId = result.public_id;
            
            // For videos, generate a thumbnail from the first frame
            thumbnailUrl = cloudinary.url(originalCloudinaryId, {
                resource_type: 'video',
                format: 'jpg',
                width: 300,
                height: 300,
                crop: 'fill',
                start_offset: '0s'
            });
            thumbnailCloudinaryId = `${originalCloudinaryId}_video_thumbnail`;
        }

        // Update progress
        conversion.progress = 80;
        await conversion.save();

        // Update conversion record with results
        conversion.convertedFileUrl = convertedUrl;
        conversion.convertedCloudinaryId = convertedCloudinaryId;
        conversion.convertedFileName = `${originalFileName.split('.')[0]}.${targetFormat}`;
        conversion.convertedMimeType = getConvertedMimeType(targetFormat);
        conversion.thumbnailUrl = thumbnailUrl;
        conversion.thumbnailCloudinaryId = thumbnailCloudinaryId;
        conversion.progress = 100;
        conversion.status = 'completed';
        
        await conversion.save();

        console.log(`✅ Cloudinary conversion completed for: ${originalFileName}`);
        
        return {
            fileName: conversion.convertedFileName,
            url: convertedUrl,
            thumbnailUrl: thumbnailUrl
        };

    } catch (error) {
        console.error(`❌ Cloudinary conversion failed:`, error);
        
        // Update conversion status to failed
        const conversion = await Conversion.findById(conversionId);
        if (conversion) {
            conversion.status = 'failed';
            conversion.progress = 0;
            await conversion.save();
        }
        
        throw error;
    }
};

// Convert image using Cloudinary
const convertImageWithCloudinary = async (publicId, targetFormat) => {
    try {
        // Use Cloudinary's transformation to convert the image
        const result = await cloudinary.uploader.upload(
            cloudinary.url(publicId, { format: targetFormat, quality: 'auto' }),
            {
                public_id: `${publicId}_converted_${targetFormat}`,
                folder: 'digiconverter/converted',
                format: targetFormat,
                overwrite: true
            }
        );
        
        return result;
    } catch (error) {
        console.error('Image conversion error:', error);
        throw error;
    }
};

// Convert video using Cloudinary
const convertVideoWithCloudinary = async (publicId, targetFormat) => {
    try {
        // Use Cloudinary's video transformation to convert the video
        const result = await cloudinary.uploader.upload(
            cloudinary.url(publicId, { 
                resource_type: 'video',
                format: targetFormat,
                quality: 'auto'
            }),
            {
                public_id: `${publicId}_converted_${targetFormat}`,
                folder: 'digiconverter/converted',
                resource_type: 'video',
                format: targetFormat,
                overwrite: true
            }
        );
        
        return result;
    } catch (error) {
        console.error('Video conversion error:', error);
        throw error;
    }
};

// Get MIME type for converted format
const getConvertedMimeType = (format) => {
    const mimeTypes = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'webm': 'video/webm',
        'mpg': 'video/mpeg',
        'mpeg': 'video/mpeg'
    };
    
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
};

module.exports = {
    convertFileFromCloudinary,
    convertImageWithCloudinary,
    convertVideoWithCloudinary
};