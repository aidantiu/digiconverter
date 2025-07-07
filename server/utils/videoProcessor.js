const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { Conversion } = require('../model/models');

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
 * Process video conversion using FFmpeg
 * @param {Object} file - The uploaded file object
 * @param {string} targetFormat - Target format for conversion
 * @param {string} conversionId - MongoDB conversion record ID
 * @returns {Promise<string>} - Promise resolving to converted filename
 */
async function processVideoConversion(file, targetFormat, conversionId) {
    const inputPath = file.path;
    const outputDir = path.join(__dirname, '../processed');
    
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
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

    // Generate a unique output file name
    const outputFileName = `${conversionId}_${Date.now()}.${targetFormat}`;
    const outputPath = path.join(outputDir, outputFileName);

    console.log(`🎥 Converting video: ${file.originalname} -> ${targetFormat} (FFmpeg format: ${ffmpegFormat})`);
    
    return new Promise((resolve, reject) => {
        try {
            // Handle video conversion with FFmpeg
            ffmpeg(inputPath)
                .toFormat(ffmpegFormat)  // Use the mapped format name
                .on('start', (commandLine) => {
                    console.log('FFmpeg command:', commandLine);
                })
                .on('progress', async (progress) => {
                    const progressPercent = Math.round(progress.percent || 0);
                    console.log(`Processing: ${progressPercent}% done`);
                    
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
                    // Set progress to 100% and mark as completed
                    try {
                        await Conversion.findByIdAndUpdate(conversionId, { 
                            progress: 100 
                        });
                    } catch (updateError) {
                        console.warn('Could not update final progress:', updateError.message);
                    }
                    
                    // Clean up original upload file
                    try {
                        if (fs.existsSync(inputPath)) {
                            fs.unlinkSync(inputPath);
                        }
                    } catch (cleanupError) {
                        console.warn('Could not delete original file:', cleanupError.message);
                    }
                    console.log(`✅ Video conversion completed: ${outputFileName}`);
                    resolve(outputFileName);
                })
                .on('error', async (error) => {
                    console.error(`❌ Video conversion failed:`, error);
                    
                    // Update conversion status to failed in database
                    try {
                        await Conversion.findByIdAndUpdate(conversionId, { 
                            status: 'failed',
                            progress: 0 
                        });
                    } catch (updateError) {
                        console.warn('Could not update failed status:', updateError.message);
                    }
                    
                    // If FFmpeg is not found, provide helpful error message
                    if (error.message.includes('Cannot find ffmpeg') || 
                        error.message.includes('ffmpeg was killed') ||
                        error.message.includes('spawn ffmpeg ENOENT')) {
                        reject(new Error('FFmpeg is not installed. Please install FFmpeg to enable video conversion. For now, only image conversion is available.'));
                    } else if (error.message.includes('Output format') && error.message.includes('is not available')) {
                        reject(new Error(`Video format '${targetFormat}' is not supported by your FFmpeg installation. Try MP4, AVI, or MOV instead.`));
                    } else {
                        reject(error);
                    }
                })
                .save(outputPath);
                
        } catch (error) {
            console.error(`❌ FFmpeg error:`, error);
            
            // Update conversion status to failed in database (async)
            Conversion.findByIdAndUpdate(conversionId, { 
                status: 'failed',
                progress: 0 
            }).catch(updateError => {
                console.warn('Could not update failed status:', updateError.message);
            });
            
            reject(new Error('Video conversion is currently unavailable. FFmpeg is not properly installed.'));
        }
    });
}

/**
 * Generate thumbnail from video file
 * @param {string} videoPath - Path to the video file
 * @param {string} conversionId - MongoDB conversion record ID
 * @returns {Promise<string>} - Promise resolving to thumbnail path
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
