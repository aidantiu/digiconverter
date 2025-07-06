const { express } = require('../utils/dependencies');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { Conversion } = require('../model/models');
const { optionalAuth } = require('../middleware/auth');
const { checkUploadLimit } = require('../middleware/uploadLimit');

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

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({

    // Set the destination for uploaded files
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');

        // Ensure the upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Store the upload info in the request object for later use
        cb(null, uploadDir);
    },

    // Set the filename for uploaded files
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Create the uploads directory if it doesn't exist
const upload = multer({

    // Configure multer with the storage settings
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },

    // File filter to allow only specific file types
    fileFilter: (req, file, cb) => {
        // Allow common image and video formats
        const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|mp4|avi|mov|wmv|flv|mkv|webm| mpeg | mpg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        // Check if the file type is allowed
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});

// Upload and convert file 
router.post('/upload', optionalAuth, checkUploadLimit, upload.single('file'), async (req, res) => {
    
    // This endpoint allows users to upload a file and specify the target format for conversion.
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check if target format is provided in the request body
        const { targetFormat } = req.body;
        if (!targetFormat) {
            return res.status(400).json({ message: 'Target format is required' });
        }

        // Validate target format
        const originalFormat = path.extname(req.file.originalname).slice(1).toLowerCase();
        const clientIP = req.ip || req.connection.remoteAddress;

        // Create conversion record
        const conversion = new Conversion({
            originalFileName: req.file.originalname,
            // convertedFileName will be set after conversion completes
            originalFormat: originalFormat,
            targetFormat: targetFormat.toLowerCase(),
            fileSize: req.file.size,
            userId: req.user ? req.user._id : null,
            ipAddress: clientIP,
            status: 'processing'
        });

        // Await for the conversion record to be saved
        try {
            await conversion.save();
            console.log(`📝 Conversion record created: ${conversion._id}`);
        } catch (saveError) {
            console.error('❌ Error saving conversion record:', saveError);
            return res.status(500).json({ 
                message: 'Failed to create conversion record',
                error: saveError.message 
            });
        }

        // Start conversion process
        convertFile(req.file, targetFormat, conversion._id)
            .then(async (convertedFileName) => {
                console.log(`✅ Conversion completed: ${convertedFileName}`);
                conversion.convertedFileName = convertedFileName;
                conversion.status = 'completed';
                await conversion.save();
            })
            .catch(async (error) => {
                console.error('❌ Conversion failed:', error.message);
                console.error('Full error:', error);
                conversion.status = 'failed';
                await conversion.save();
            });

        // Add upload info to the request for later use
        res.status(200).json({
            message: 'File uploaded successfully, conversion in progress',
            conversionId: conversion._id,
            uploadInfo: req.uploadInfo || { isAnonymous: false }
        });
        
    // Handle any errors during the upload or conversion process
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

// Check conversion status
router.get('/status/:conversionId', async (req, res) => {

    // This endpoint allows users to check the status of their file conversion.
    try {

        // Find the conversion record by ID
        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            return res.status(404).json({ message: 'Conversion not found' });
        }
        
        // Return the conversion status and details
        res.status(200).json({
            id: conversion._id,
            status: conversion.status,
            originalFileName: conversion.originalFileName,
            originalFormat: conversion.originalFormat,
            targetFormat: conversion.targetFormat,
            createdAt: conversion.createdAt
        });

    // Handle any errors during the status check
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ message: 'Server error checking status' });
    }
});

// Download converted file
router.get('/download/:conversionId', async (req, res) => {

    // This endpoint allows users to download their converted file.
    try {

        // Find the conversion record by ID
        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            return res.status(404).json({ message: 'Conversion not found' });
        }

        // Check if the conversion is completed
        if (conversion.status !== 'completed') {
            return res.status(400).json({ message: 'Conversion not completed yet' });
        }

        // Check if converted file name exists
        if (!conversion.convertedFileName) {
            return res.status(400).json({ message: 'Converted file not ready' });
        }

        // Construct the file path for the converted file
        const filePath = path.join(__dirname, '../processed', conversion.convertedFileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Converted file not found' });
        }

        // Increment download count
        conversion.downloadCount += 1;
        await conversion.save();

        // Set headers for file download
        res.download(filePath, `${path.parse(conversion.originalFileName).name}.${conversion.targetFormat}`);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Server error during download' });
    }
});

// Get user's conversion history
router.get('/history', optionalAuth, async (req, res) => {

    // This endpoint retrieves the user's conversion history.
    try {
        let query = {};
        
        // If user is authenticated, filter by user ID
        if (req.user) {
            query.userId = req.user._id;
        } else {
            // For anonymous users, show their IP-based history
            const clientIP = req.ip || req.connection.remoteAddress;
            query = { ipAddress: clientIP, userId: null };
        }

        // Find conversions based on the query limiting to the last 20 records
        const conversions = await Conversion.find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .select('originalFileName targetFormat status createdAt downloadCount');

        res.status(200).json({ conversions });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ message: 'Server error retrieving history' });
    }
});

// Check upload limits for anonymous users
router.get('/limits', optionalAuth, async (req, res) => {

    // This endpoint checks the upload limits for anonymous users.
    try {
        // If user is authenticated, no limits apply
        if (req.user) {
            return res.status(200).json({
                isAuthenticated: true,
                unlimited: true,
                message: 'Unlimited uploads for registered users'
            });
        }

        // Get client IP address
        const clientIP = req.ip || req.connection.remoteAddress;

        // Count uploads from this IP in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const uploadCount = await Conversion.countDocuments({
            ipAddress: clientIP,
            userId: null, // Only count anonymous uploads
            createdAt: { $gte: twentyFourHoursAgo }
        });

        // Check if the limit is exceeded
        res.status(200).json({
            isAuthenticated: false,
            limit: 3,
            used: uploadCount,
            remaining: Math.max(0, 3 - uploadCount),
            resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            canUpload: uploadCount < 3
        });

    } catch (error) {
        console.error('Limits check error:', error);
        res.status(500).json({ message: 'Server error checking limits' });
    }
});

// Cleanup endpoint (should be called by a cron job)
router.delete('/cleanup', async (req, res) => {

    // This endpoint cleans up expired conversions and their associated files.
    try {
        // Delete expired conversions and their files
        const expiredConversions = await Conversion.find({
            expiresAt: { $lt: new Date() }
        });

        let deletedFiles = 0;
        let deletedRecords = 0;

        // Loop through each expired conversion
        for (const conversion of expiredConversions) {
            // Delete the physical file
            if (conversion.convertedFileName) {
                const filePath = path.join(__dirname, '../processed', conversion.convertedFileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedFiles++;
                }
            }
            
            // Delete the record
            await Conversion.findByIdAndDelete(conversion._id);
            deletedRecords++;
        }

        res.status(200).json({
            message: 'Cleanup completed',
            deletedFiles,
            deletedRecords
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ message: 'Server error during cleanup' });
    }
});

// Helper function to convert files
async function convertFile(file, targetFormat, conversionId) {

    // This function handles the conversion of files using Sharp for images and FFmpeg for videos.
    const inputPath = file.path;
    const outputDir = path.join(__dirname, '../processed');
    
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a unique output file name
    const outputFileName = `${conversionId}_${Date.now()}.${targetFormat}`;
    const outputPath = path.join(outputDir, outputFileName);

    // Determine if the file is an image or video based on its extension
    return new Promise((resolve, reject) => {
        const isImage = /jpeg|jpg|png|gif|webp|bmp|tiff/.test(path.extname(file.originalname).toLowerCase());
        const isVideo = /mp4|avi|mov|wmv|flv|mkv|webm/.test(path.extname(file.originalname).toLowerCase());

        // If the file type is not supported, reject the promise
        if (isImage) {
            console.log(`🖼️ Converting image: ${file.originalname} -> ${targetFormat}`);
            // Handle image conversion with Sharp
            sharp(inputPath)
                .toFormat(targetFormat)
                .toFile(outputPath)
                .then(() => {
                    // Clean up original file
                    fs.unlinkSync(inputPath);
                    console.log(`✅ Image conversion completed: ${outputFileName}`);
                    resolve(outputFileName);
                })
                .catch((error) => {
                    console.error(`❌ Image conversion failed:`, error);
                    reject(error);
                });

        // If the file is a video, handle conversion with FFmpeg
        } else if (isVideo) {
            console.log(`🎥 Converting video: ${file.originalname} -> ${targetFormat}`);
            
            // Check if FFmpeg is available
            try {
                // Handle video conversion with FFmpeg
                ffmpeg(inputPath)
                    .toFormat(targetFormat)
                    .on('start', (commandLine) => {
                        console.log('FFmpeg command:', commandLine);
                    })
                    .on('progress', (progress) => {
                        console.log(`Processing: ${progress.percent}% done`);
                    })
                    .on('end', () => {
                        // Clean up original file
                        fs.unlinkSync(inputPath);
                        console.log(`✅ Video conversion completed: ${outputFileName}`);
                        resolve(outputFileName);
                    })
                    .on('error', (error) => {
                        console.error(`❌ Video conversion failed:`, error);
                        
                        // If FFmpeg is not found, provide helpful error message
                        if (error.message.includes('Cannot find ffmpeg') || 
                            error.message.includes('ffmpeg was killed') ||
                            error.message.includes('spawn ffmpeg ENOENT')) {
                            reject(new Error('FFmpeg is not installed. Please install FFmpeg to enable video conversion. For now, only image conversion is available.'));
                        } else {
                            reject(error);
                        }
                    })
                    .save(outputPath);
                    
            } catch (error) {
                console.error(`❌ FFmpeg error:`, error);
                reject(new Error('Video conversion is currently unavailable. FFmpeg is not properly installed.'));
            }
        } else {
            reject(new Error('Unsupported file type. Please upload an image (JPEG, PNG, GIF, WebP, BMP, TIFF) or video file.'));
        }
    });
}

module.exports = router;
module.exports = router;
