const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { Conversion } = require('../model/models');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// Configure FFmpeg path if specified in environment variables or if FFmpeg is in a custom location
const customFfmpegPath = process.env.FFMPEG_PATH;
if (customFfmpegPath && fs.existsSync(customFfmpegPath)) {
    console.log(`🔧 Using custom FFmpeg path: ${customFfmpegPath}`);
    ffmpeg.setFfmpegPath(customFfmpegPath);
} else {
    // Try common Windows FFmpeg installation paths
    const commonPaths = [
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\tools\\ffmpeg\\bin\\ffmpeg.exe'
    ];
    
    for (const testPath of commonPaths) {
        if (fs.existsSync(testPath)) {
            console.log(`🔧 Found FFmpeg at: ${testPath}`);
            ffmpeg.setFfmpegPath(testPath);
            break;
        }
    }
}

/**
 * Process video conversion using FFmpeg with Buffer data
 * @param {Buffer} fileBuffer - The file data as Buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} targetFormat - Target format for conversion
 * @param {string} conversionId - MongoDB conversion record ID
 * @returns {Promise<Object>} - Promise resolving to conversion result
 */
async function processVideoConversion(fileBuffer, originalName, mimeType, targetFormat, conversionId) {
    console.log(`🎥 Converting video: ${originalName} -> ${targetFormat}`);
    
    // Create temporary directory for FFmpeg processing
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate unique temporary file names
    const tempId = uuidv4();
    const inputExt = path.extname(originalName);
    const tempInputPath = path.join(tempDir, `temp_input_${tempId}${inputExt}`);
    const tempOutputPath = path.join(tempDir, `temp_output_${tempId}.${targetFormat}`);
    
    try {
        // Write input buffer to temporary file
        await writeFile(tempInputPath, fileBuffer);
        
        // Set initial progress
        try {
            await Conversion.findByIdAndUpdate(conversionId, { progress: 10 });
        } catch (updateError) {
            console.warn('Could not update initial progress:', updateError.message);
        }

    // Map file extensions to FFmpeg format names
    const formatMapping = {
        'mp4': 'mp4',
        'avi': 'avi',
        'mov': 'mov',
        'wmv': 'wmv',
        'flv': 'flv',
        'mkv': 'matroska',
        'webm': 'webm',
        'mpeg': 'mpeg',
        'mpg': 'mpeg',  // MPG files use MPEG format in FFmpeg
        'm4v': 'mp4',   // M4V is essentially MP4
        '3gp': '3gp',
        'asf': 'asf'
    };

    // Get the proper FFmpeg format name
    const ffmpegFormat = formatMapping[targetFormat.toLowerCase()] || targetFormat.toLowerCase();

    return new Promise((resolve, reject) => {
        // Handle video conversion with FFmpeg
        ffmpeg(tempInputPath)
            .toFormat(ffmpegFormat)  // Use the mapped format name
            .on('start', (commandLine) => {
                console.log(`🎬 FFmpeg started for ${originalName} -> ${targetFormat}`);
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', async (progress) => {
                const progressPercent = Math.round(progress.percent || 0);
                console.log(`Processing ${originalName}: ${progressPercent}% done`);
                
                // Update progress in database
                try {
                    await Conversion.findByIdAndUpdate(conversionId, { 
                        progress: progressPercent 
                    });
                } catch (updateError) {
                    console.warn('Could not update progress:', updateError.message);
                }
            })
            .on('end', async () => {
                console.log(`🎬 FFmpeg finished processing ${originalName}`);
                try {
                    // Check if output file exists
                    if (!fs.existsSync(tempOutputPath)) {
                        throw new Error(`Output file not created: ${tempOutputPath}`);
                    }
                    
                    // Read the converted file as Buffer
                    const convertedBuffer = await readFile(tempOutputPath);
                    console.log(`📦 Converted file size: ${convertedBuffer.length} bytes`);
                    
                    // Generate converted filename and MIME type
                    const convertedFileName = `converted_${conversionId}.${targetFormat}`;
                    const convertedMimeType = getVideoMimeType(targetFormat);
                    
                    // Generate thumbnail for display
                    console.log(`🖼️ Generating thumbnail for ${originalName}`);
                    const thumbnailBuffer = await generateVideoThumbnailBuffer(tempInputPath);
                    console.log(`🖼️ Thumbnail generated, size: ${thumbnailBuffer.length} bytes`);
                    
                    // Update conversion record with file data
                    await Conversion.findByIdAndUpdate(conversionId, {
                        status: 'completed',
                        progress: 100,
                        convertedFileName: convertedFileName,
                        convertedMimeType: convertedMimeType,
                        convertedData: convertedBuffer,
                        thumbnailData: thumbnailBuffer,
                        thumbnailMimeType: 'image/jpeg'
                    });
                    
                    console.log(`✅ Video conversion completed: ${convertedFileName}`);
                    
                    // Clean up temporary files
                    await cleanupTempFiles(tempInputPath, tempOutputPath);
                    
                    resolve({
                        convertedFileName,
                        convertedMimeType,
                        convertedBuffer,
                        thumbnailBuffer
                    });
                } catch (error) {
                    console.error('❌ Error processing conversion result:', error);
                    await cleanupTempFiles(tempInputPath, tempOutputPath);
                    reject(error);
                }
            })
            .on('error', async (error) => {
                console.error(`❌ FFmpeg error for ${originalName}:`, error.message);
                console.error('Full FFmpeg error:', error);
                
                // Update conversion status to failed in database
                try {
                    await Conversion.findByIdAndUpdate(conversionId, { 
                        status: 'failed',
                        progress: 0 
                    });
                } catch (updateError) {
                    console.warn('Could not update failed status:', updateError.message);
                }
                
                // Clean up temporary files
                await cleanupTempFiles(tempInputPath, tempOutputPath);
                
                // If FFmpeg is not found, provide helpful error message
                if (error.message.includes('Cannot find ffmpeg') || 
                    error.message.includes('ffmpeg was killed') ||
                    error.message.includes('spawn ffmpeg ENOENT')) {
                    reject(new Error('FFmpeg is not installed. Please install FFmpeg to enable video conversion. For now, only image conversion is available.'));
                } else if (error.message.includes('Output format') && error.message.includes('is not available')) {
                    reject(new Error(`Video format '${targetFormat}' is not supported by your FFmpeg installation. Try MP4, AVI, or MOV instead.`));
                } else if (error.message.includes('Invalid data found when processing input') || 
                           error.message.includes('moov atom not found')) {
                    reject(new Error(`The ${originalName} file appears to be corrupted or in an unsupported format. Please try a different file.`));
                } else {
                    reject(new Error(`Video conversion failed: ${error.message}`));
                }
            })
            .save(tempOutputPath);
    });
            
    } catch (error) {
        console.error(`❌ Video conversion error:`, error);
        
        // Clean up temporary files
        await cleanupTempFiles(tempInputPath, tempOutputPath);
        
        // Update conversion status to failed in database
        try {
            await Conversion.findByIdAndUpdate(conversionId, { 
                status: 'failed',
                progress: 0 
            });
        } catch (updateError) {
            console.warn('Could not update failed status:', updateError.message);
        }
        
        throw new Error('Video conversion failed. Please try again.');
    }
}

/**
 * Generate video thumbnail as Buffer
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<Buffer>} - Promise resolving to thumbnail Buffer
 */
async function generateVideoThumbnailBuffer(videoPath) {
    return new Promise((resolve, reject) => {
        const tempThumbnailPath = path.join(path.dirname(videoPath), `thumb_${Date.now()}.jpg`);
        
        ffmpeg(videoPath)
            .screenshot({
                timestamps: ['00:00:01'], // Take screenshot at 1 second
                filename: path.basename(tempThumbnailPath),
                folder: path.dirname(tempThumbnailPath),
                size: '300x300'
            })
            .on('end', async () => {
                try {
                    const thumbnailBuffer = await readFile(tempThumbnailPath);
                    await unlink(tempThumbnailPath); // Clean up thumbnail file
                    resolve(thumbnailBuffer);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.warn('Could not generate video thumbnail:', error);
                // Return a default empty buffer instead of rejecting
                resolve(Buffer.alloc(0));
            });
    });
}

/**
 * Clean up temporary files
 * @param {...string} filePaths - File paths to delete
 */
async function cleanupTempFiles(...filePaths) {
    for (const filePath of filePaths) {
        try {
            if (fs.existsSync(filePath)) {
                await unlink(filePath);
            }
        } catch (error) {
            console.warn(`Could not delete temporary file ${filePath}:`, error.message);
        }
    }
}

/**
 * Get MIME type for video format
 * @param {string} format - Video format extension
 * @returns {string} - MIME type
 */
function getVideoMimeType(format) {
    const mimeTypes = {
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm',
        'mpeg': 'video/mpeg',
        'mpg': 'video/mpeg',
        'm4v': 'video/mp4',
        '3gp': 'video/3gpp'
    };
    return mimeTypes[format.toLowerCase()] || 'video/mp4';
}

/**
 * Generate video thumbnail using FFmpeg (legacy function for compatibility)
 * @param {string} videoPath - Path to the video file
 * @param {string} conversionId - Conversion ID
 * @returns {Promise<string>} - Promise resolving to thumbnail filename
 */
async function generateVideoThumbnail(videoPath, conversionId) {
    const thumbnailName = `thumb_${conversionId}.jpg`;
    const thumbnailPath = path.join(path.dirname(videoPath), thumbnailName);

    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshot({
                timestamps: ['00:00:01'], // Take screenshot at 1 second
                filename: thumbnailName,
                folder: path.dirname(videoPath),
                size: '320x240'
            })
            .on('end', () => {
                console.log(`✅ Video thumbnail generated: ${thumbnailPath}`);
                resolve(thumbnailPath);
            })
            .on('error', (error) => {
                console.error('❌ Video thumbnail generation error:', error);
                reject(error);
            });
    });
}

/**
 * Validate if target format is compatible with video processing
 * @param {string} targetFormat - Target format to validate
 * @returns {boolean} - True if format is supported
 */
function isValidVideoFormat(targetFormat) {
    const videoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg', 'm4v', '3gp'];
    return videoFormats.includes(targetFormat.toLowerCase());
}

/**
 * Check if file is a video based on extension
 * @param {string} filename - Original filename
 * @returns {boolean} - True if file is a video
 */
function isVideoFile(filename) {
    const fileExtension = path.extname(filename).toLowerCase();
    return /\.(mp4|avi|mov|wmv|flv|mkv|webm|mpeg|mpg|m4v|3gp)$/.test(fileExtension);
}

module.exports = {
    processVideoConversion,
    generateVideoThumbnail,
    isValidVideoFormat,
    isVideoFile
};
