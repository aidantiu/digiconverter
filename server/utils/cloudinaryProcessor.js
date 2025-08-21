const cloudinary = require('../config/cloudinary');
const { Conversion } = require('../model/models');
const fetch = require('node-fetch'); // You'll need to install this: npm install node-fetch

// Convert file using Cloudinary transformations with FFmpeg fallback
const convertFileFromCloudinary = async (originalUrl, originalCloudinaryId, originalFileName, originalMimeType, targetFormat, conversionId) => {
    try {
        console.log(`🔄 Starting conversion for: ${originalFileName} to ${targetFormat}`);
        
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) {
            throw new Error('Conversion record not found');
        }

        // Update progress
        conversion.progress = 10;
        await conversion.save();

        const isImage = originalMimeType.startsWith('image/');
        const isVideo = originalMimeType.startsWith('video/');

        // Check if we should use FFmpeg for this conversion
        // Use FFmpeg for any conversion involving MPG/MPEG (source OR target)
        const originalFormat = originalFileName.split('.').pop().toLowerCase();
        const sourceIsMpeg = ['mpg', 'mpeg'].includes(originalFormat);
        const targetIsMpeg = ['mpg', 'mpeg'].includes(targetFormat.toLowerCase());
        const useFFmpeg = isVideo && (sourceIsMpeg || targetIsMpeg);

        // Debug logging
        console.log(`🔍 CloudinaryProcessor Debug:`);
        console.log(`   - Original file: ${originalFileName}`);
        console.log(`   - Original format: ${originalFormat}`);
        console.log(`   - Target format: ${targetFormat}`);
        console.log(`   - Source is MPEG: ${sourceIsMpeg}`);
        console.log(`   - Target is MPEG: ${targetIsMpeg}`);
        console.log(`   - Use FFmpeg: ${useFFmpeg}`);
        console.log(`   - Is video: ${isVideo}`);

        if (useFFmpeg) {
            console.log(`🎬 Using FFmpeg for conversion (MPG/MPEG involved): ${originalFormat} → ${targetFormat}`);
            return await convertVideoWithFFmpeg(originalUrl, originalFileName, originalMimeType, targetFormat, conversionId);
        }

        // Use Cloudinary for supported formats
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
        console.error(`❌ Conversion failed:`, error);
        
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

// Convert video using local FFmpeg for formats not supported by Cloudinary
const convertVideoWithFFmpeg = async (originalUrl, originalFileName, originalMimeType, targetFormat, conversionId) => {
    const { processVideoConversion } = require('./videoProcessor');
    
    try {
        console.log(`📥 Downloading video from Cloudinary: ${originalUrl}`);
        
        // Download the video file from Cloudinary
        const response = await fetch(originalUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        
        const videoBuffer = await response.buffer();
        console.log(`📦 Downloaded video buffer: ${videoBuffer.length} bytes`);
        
        // Use local FFmpeg processing
        const result = await processVideoConversion(
            videoBuffer,
            originalFileName,
            originalMimeType,
            targetFormat,
            conversionId
        );
        
        console.log(`✅ FFmpeg conversion completed for: ${originalFileName}`);
        
        // Return the result in the expected format
        return {
            fileName: result.convertedFileName,
            // For FFmpeg conversions, we store the file data in the database
            url: null, // Will be served from our download endpoint
            thumbnailUrl: null // Thumbnail data is stored in the database
        };
        
    } catch (error) {
        console.error('FFmpeg conversion error:', error);
        throw error;
    }
};

// Convert MPG/MPEG to MP4 using FFmpeg and upload to Cloudinary
const convertMpgToMp4AndUpload = async (originalUrl, originalCloudinaryId, originalFileName, originalMimeType, conversionId) => {
    const ffmpeg = require('fluent-ffmpeg');
    const path = require('path');
    const fs = require('fs');
    const { v4: uuidv4 } = require('uuid');
    const { promisify } = require('util');
    
    const writeFile = promisify(fs.writeFile);
    const readFile = promisify(fs.readFile);
    const unlink = promisify(fs.unlink);
    
    try {
        console.log(`🎬 Starting MPG to MP4 conversion for: ${originalFileName}`);
        
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) {
            throw new Error('Conversion record not found');
        }

        // Update progress
        conversion.progress = 10;
        await conversion.save();

        // Download the MPG/MPEG file from Cloudinary
        console.log(`📥 Downloading MPG/MPEG from Cloudinary: ${originalUrl}`);
        const response = await fetch(originalUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        
        const videoBuffer = await response.buffer();
        console.log(`📦 Downloaded video buffer: ${videoBuffer.length} bytes`);

        // Create temporary directory for FFmpeg processing
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Generate unique temporary file names
        const tempId = uuidv4();
        const inputExt = path.extname(originalFileName);
        const tempInputPath = path.join(tempDir, `temp_input_${tempId}${inputExt}`);
        const tempOutputPath = path.join(tempDir, `temp_output_${tempId}.mp4`);
        
        // Write input buffer to temporary file
        await writeFile(tempInputPath, videoBuffer);
        
        // Update progress
        conversion.progress = 20;
        await conversion.save();

        // Convert using FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
                .toFormat('mp4')
                .videoCodec('libx264')
                .audioCodec('aac')
                .on('start', (commandLine) => {
                    console.log(`🎬 FFmpeg started for ${originalFileName} -> MP4`);
                    console.log('FFmpeg command:', commandLine);
                })
                .on('progress', async (progress) => {
                    const progressPercent = Math.round((progress.percent || 0) * 0.6 + 20); // Scale to 20-80%
                    console.log(`Converting ${originalFileName}: ${progressPercent}% done`);
                    
                    try {
                        await Conversion.findByIdAndUpdate(conversionId, { 
                            progress: progressPercent 
                        });
                    } catch (updateError) {
                        console.warn('Could not update progress:', updateError.message);
                    }
                })
                .on('end', () => {
                    console.log(`🎬 FFmpeg finished converting ${originalFileName} to MP4`);
                    resolve();
                })
                .on('error', (error) => {
                    console.error(`❌ FFmpeg error for ${originalFileName}:`, error.message);
                    reject(error);
                })
                .save(tempOutputPath);
        });

        // Update progress
        conversion.progress = 80;
        await conversion.save();

        // Read the converted MP4 file
        const convertedBuffer = await readFile(tempOutputPath);
        console.log(`📦 Converted MP4 file size: ${convertedBuffer.length} bytes`);

        // Upload the converted MP4 to Cloudinary
        console.log(`☁️ Uploading converted MP4 to Cloudinary...`);
        
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video',
                    folder: 'digiconverter/converted',
                    public_id: `${originalCloudinaryId}_converted_mp4`,
                    format: 'mp4',
                    overwrite: true
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('✅ Cloudinary upload successful:', result.secure_url);
                        resolve(result);
                    }
                }
            );
            
            uploadStream.end(convertedBuffer);
        });

        // Generate thumbnail URL using Cloudinary transformation
        const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
            resource_type: 'video',
            format: 'jpg',
            width: 300,
            height: 300,
            crop: 'fill',
            start_offset: '0s'
        });

        // Clean up temporary files
        await cleanupTempFiles(tempInputPath, tempOutputPath);

        console.log(`✅ MPG to MP4 conversion and upload completed successfully`);

        return {
            cloudinaryUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            fileName: `${path.parse(originalFileName).name}.mp4`,
            thumbnailUrl: thumbnailUrl
        };

    } catch (error) {
        console.error(`❌ MPG to MP4 conversion failed:`, error);
        
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

// Helper function to clean up temporary files
const cleanupTempFiles = async (...filePaths) => {
    const { promisify } = require('util');
    const fs = require('fs');
    const unlink = promisify(fs.unlink);
    
    for (const filePath of filePaths) {
        try {
            if (fs.existsSync(filePath)) {
                await unlink(filePath);
                console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
            }
        } catch (error) {
            console.warn(`Could not delete temporary file ${filePath}:`, error.message);
        }
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
    convertVideoWithCloudinary,
    convertMpgToMp4AndUpload
};