const { express } = require('../utils/dependencies');
const multer = require('multer');
const path = require('path');
const { Conversion } = require('../model/models');
const { optionalAuth } = require('../middleware/auth');
const { checkUploadLimit } = require('../middleware/uploadLimit');
const { convertFile } = require('../utils/conversionProcessor');

const router = express.Router();

// Configure multer for memory storage (no file system storage)
const storage = multer.memoryStorage();

// Create the uploads with memory storage
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },

    // File filter to allow only specific file types
    fileFilter: (req, file, cb) => {
        // Allow only JPEG, PNG, WEBP images and MP4, MOV, WEBM, MPG videos
        const allowedExtensions = /\.(jpeg|jpg|png|webp|mp4|mov|webm|mpeg|mpg)$/i;
        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        
        // MIME types for supported formats only
        const allowedMimeTypes = [
            // Image MIME types (only JPEG, PNG, WebP)
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            // Video MIME types (only MP4, MOV, WEBM, MPG)
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
            // Additional common MIME types for MOV files
            'application/octet-stream'
        ];
        
        const mimetypeAllowed = allowedMimeTypes.includes(file.mimetype);
        
        // Allow if either extension is valid OR mimetype is valid (more lenient approach)
        if (extname || mimetypeAllowed) {
            console.log(`✅ File accepted: ${file.originalname} (${file.mimetype})`);
            return cb(null, true);
        } else {
            console.log(`❌ File rejected: ${file.originalname} (${file.mimetype})`);
            cb(new Error('Only supported image and video files are allowed. Supported image formats: JPEG, PNG, WebP. Supported video formats: MP4, MOV, WebM, MPG'));
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

        // Validate target format and file type compatibility
        const originalFormat = path.extname(req.file.originalname).slice(1).toLowerCase();
        const imageFormats = ['jpeg', 'jpg', 'png', 'webp']; // Only supported image formats
        const videoFormats = ['mp4', 'mov', 'webm', 'mpeg', 'mpg'];
        
        const isImageFile = imageFormats.includes(originalFormat);
        const isVideoFile = videoFormats.includes(originalFormat);
        const targetIsImage = imageFormats.includes(targetFormat.toLowerCase());
        const targetIsVideo = videoFormats.includes(targetFormat.toLowerCase());
        
        // Validate format compatibility
        if (isImageFile && !targetIsImage) {
            return res.status(400).json({ 
                message: 'Invalid conversion: Images can only be converted to supported image formats (JPEG, PNG, WebP)' 
            });
        }
        
        if (isVideoFile && !targetIsVideo) {
            return res.status(400).json({ 
                message: 'Invalid conversion: Videos can only be converted to supported video formats (MP4, MOV, WebM, MPG)' 
            });
        }
        
        if (!isImageFile && !isVideoFile) {
            return res.status(400).json({ 
                message: 'Unsupported file type. Only supported images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM, MPG) are allowed.' 
            });
        }
        const clientIP = req.ip || req.connection.remoteAddress;

        // Create conversion record with file data
        const conversion = new Conversion({
            originalFileName: req.file.originalname,
            // convertedFileName will be set after conversion completes
            originalFormat: originalFormat,
            targetFormat: targetFormat.toLowerCase(),
            fileSize: req.file.size,
            originalFileData: req.file.buffer, // Store file data in database
            originalMimeType: req.file.mimetype,
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

        // Start conversion process with timeout
        const conversionPromise = convertFile(req.file.buffer, req.file.originalname, req.file.mimetype, targetFormat, conversion._id);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Conversion timeout after 10 minutes'));
            }, 10 * 60 * 1000); // 10 minutes timeout
        });

        Promise.race([conversionPromise, timeoutPromise])
            .then(async (result) => {
                console.log(`✅ Conversion completed: ${result.fileName}`);
                conversion.status = 'completed';
                await conversion.save();
                console.log(`💾 Conversion record updated in database: ${conversion._id}`);
            })
            .catch(async (error) => {
                console.error('❌ Conversion failed:', error.message);
                console.error('Full error:', error);
                conversion.status = 'failed';
                await conversion.save();
                console.log(`💾 Conversion record marked as failed in database: ${conversion._id}`);
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
            progress: conversion.progress || 0,
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

    // This endpoint allows users to download their converted file from database.
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

        // Check if converted file data exists
        if (!conversion.convertedData || !conversion.convertedFileName) {
            return res.status(400).json({ message: 'Converted file not ready' });
        }

        // Increment download count
        conversion.downloadCount += 1;
        await conversion.save();

        // Set headers for file download
        const downloadFileName = `${path.parse(conversion.originalFileName).name}.${conversion.targetFormat}`;
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
        res.setHeader('Content-Type', conversion.convertedMimeType || 'application/octet-stream');
        res.setHeader('Content-Length', conversion.convertedData.length);

        // Send the file data
        res.send(conversion.convertedData);
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

// Get categorized history (images and videos separately)
router.get('/history/categorized', optionalAuth, async (req, res) => {
    try {
        let query = {};
        
        // If user is authenticated, filter by user ID
        if (req.user) {
            query.userId = req.user._id;
            console.log(`📋 Fetching categorized history for user: ${req.user._id}`);
        } else {
            // For anonymous users, show their IP-based history
            const clientIP = req.ip || req.connection.remoteAddress;
            query = { ipAddress: clientIP, userId: null };
            console.log(`📋 Fetching categorized history for anonymous IP: ${clientIP}`);
        }

        // Find all conversions and categorize them - include converted file names for thumbnails
        const allConversions = await Conversion.find(query)
            .sort({ createdAt: -1 })
            .select('originalFileName convertedFileName originalFormat targetFormat status createdAt fileSize progress')
            .lean();

        console.log(`📊 Total conversions found: ${allConversions.length}`);

        // Categorize conversions
        const imageFormats = ['jpeg', 'jpg', 'png', 'webp']; // Only supported image formats
        const videoFormats = ['mp4', 'mov', 'webm', 'mpeg', 'mpg']; // Only supported video formats

        // Filter and get the last 5 image conversions (most recent first)
        const imageConversions = allConversions.filter(conv => 
            imageFormats.includes(conv.originalFormat.toLowerCase())
        );
        const images = imageConversions.slice(0, 5);

        // Filter and get the last 5 video conversions (most recent first)
        const videoConversions = allConversions.filter(conv => 
            videoFormats.includes(conv.originalFormat.toLowerCase())
        );
        const videos = videoConversions.slice(0, 5);

        console.log(`📸 Image conversions found: ${imageConversions.length}, returning: ${images.length}`);
        console.log(`🎬 Video conversions found: ${videoConversions.length}, returning: ${videos.length}`);

        // Log the most recent conversions for debugging
        if (images.length > 0) {
            console.log(`📸 Most recent image: ${images[0].originalFileName} (${new Date(images[0].createdAt).toISOString()})`);
        }
        if (videos.length > 0) {
            console.log(`🎬 Most recent video: ${videos[0].originalFileName} (${new Date(videos[0].createdAt).toISOString()})`);
        }

        // Log all image and video conversion IDs for debugging
        console.log(`📸 Image conversion IDs: [${images.map(i => i._id.toString()).join(', ')}]`);
        console.log(`🎬 Video conversion IDs: [${videos.map(v => v._id.toString()).join(', ')}]`);

        res.status(200).json({
            images,
            videos,
            total: {
                images: images.length,
                videos: videos.length,
                totalFound: {
                    images: imageConversions.length,
                    videos: videoConversions.length
                }
            }
        });
    } catch (error) {
        console.error('Categorized history error:', error);
        res.status(500).json({ message: 'Server error retrieving categorized history' });
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

// Cleanup endpoint (delete expired conversions from database)
router.delete('/cleanup', async (req, res) => {

    // This endpoint cleans up expired conversions from the database.
    try {
        // Delete expired conversions (MongoDB TTL will handle this automatically, but we can manually clean up too)
        const result = await Conversion.deleteMany({
            expiresAt: { $lt: new Date() }
        });

        res.status(200).json({
            message: 'Cleanup completed',
            deletedRecords: result.deletedCount
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ message: 'Server error during cleanup' });
    }
});

// Get thumbnail for images (serve from database)
router.get('/thumbnail/image/:conversionId', optionalAuth, async (req, res) => {
    try {
        console.log(`📸 Requesting image thumbnail for conversion: ${req.params.conversionId}`);
        
        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            console.log(`❌ Conversion not found: ${req.params.conversionId}`);
            return res.status(404).json({ message: 'Conversion not found' });
        }

        console.log(`📊 Conversion status: ${conversion.status}, has thumbnail: ${!!conversion.thumbnailData}`);

        // Check conversion status
        if (conversion.status === 'failed') {
            console.log(`❌ Conversion failed for: ${req.params.conversionId}`);
            return res.status(400).json({ message: 'Conversion failed', status: 'failed' });
        }

        if (conversion.status === 'processing') {
            console.log(`⏳ Conversion still processing: ${req.params.conversionId}`);
            return res.status(202).json({ message: 'Conversion still processing', status: 'processing' });
        }

        if (conversion.status !== 'completed' || !conversion.thumbnailData) {
            console.log(`❌ Thumbnail not available for: ${req.params.conversionId}, status: ${conversion.status}`);
            return res.status(404).json({ message: 'Thumbnail not available' });
        }

        console.log(`✅ Serving image thumbnail from database`);
        
        // Set aggressive caching headers for thumbnails
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // 24 hours
        res.setHeader('ETag', `"thumb-${conversion._id}-${conversion.updatedAt || Date.now()}"`);
        
        // Set proper headers for image serving
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', conversion.thumbnailMimeType || 'image/jpeg');
        res.setHeader('Content-Length', conversion.thumbnailData.length);
        
        // Serve the thumbnail data
        res.send(conversion.thumbnailData);
    } catch (error) {
        console.error('❌ Image thumbnail error:', error);
        res.status(500).json({ message: 'Server error serving thumbnail' });
    }
});

// Get thumbnail for videos (serve from database)
router.get('/thumbnail/video/:conversionId', optionalAuth, async (req, res) => {
    try {
        console.log(`🎬 Requesting video thumbnail for conversion: ${req.params.conversionId}`);
        
        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            console.log(`❌ Conversion not found: ${req.params.conversionId}`);
            return res.status(404).json({ message: 'Conversion not found' });
        }

        console.log(`📊 Conversion status: ${conversion.status}, has thumbnail: ${!!conversion.thumbnailData}`);

        // Check if conversion is complete and has thumbnail data
        if (conversion.status !== 'completed' || !conversion.thumbnailData) {
            console.log(`❌ Video thumbnail not available for: ${req.params.conversionId}, status: ${conversion.status}`);
            return res.status(404).json({ message: 'Video thumbnail not available' });
        }

        console.log(`✅ Serving video thumbnail from database`);
        
        // Set aggressive caching headers for video thumbnails
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // 24 hours
        res.setHeader('ETag', `"video-thumb-${conversion._id}-${conversion.updatedAt || Date.now()}"`);
        
        // Set proper headers for image serving
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', conversion.thumbnailMimeType || 'image/jpeg');
        res.setHeader('Content-Length', conversion.thumbnailData.length);

        // Serve the thumbnail data
        res.send(conversion.thumbnailData);

    } catch (error) {
        console.error('❌ Video thumbnail error:', error);
        res.status(500).json({ message: 'Server error serving video thumbnail' });
    }
});

// Check for stuck conversions and mark them as failed
router.post('/fix-stuck-conversions', async (req, res) => {
    try {
        // Find conversions that have been processing for more than 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const stuckConversions = await Conversion.find({
            status: 'processing',
            createdAt: { $lt: tenMinutesAgo }
        });

        let fixedCount = 0;
        for (const conversion of stuckConversions) {
            console.log(`🔧 Fixing stuck conversion: ${conversion._id}`);
            conversion.status = 'failed';
            conversion.progress = 0;
            await conversion.save();
            fixedCount++;
        }

        res.status(200).json({
            message: `Fixed ${fixedCount} stuck conversions`,
            fixed: fixedCount,
            conversions: stuckConversions.map(c => ({
                id: c._id,
                originalFileName: c.originalFileName,
                createdAt: c.createdAt
            }))
        });

    } catch (error) {
        console.error('Fix stuck conversions error:', error);
        res.status(500).json({ message: 'Server error fixing stuck conversions' });
    }
});

module.exports = router;

