const { express } = require('../utils/dependencies');
const path = require('path');
const { Conversion } = require('../model/models');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { checkUploadLimit } = require('../middleware/uploadLimit');
const upload = require('../middleware/multer'); // Import the new Cloudinary-enabled multer
const cloudinary = require('../config/cloudinary');
const { convertFileFromCloudinary } = require('../utils/cloudinaryProcessor'); // Import new processor

const router = express.Router();

// Upload and convert file 
router.post('/upload', optionalAuth, checkUploadLimit, upload.single('file'), async (req, res) => {
    
    // This endpoint allows users to upload a file to Cloudinary and store metadata in DB
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('📤 File uploaded to Cloudinary:', {
            url: req.file.path,
            public_id: req.file.filename,
            size: req.file.size
        });

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

        // Create conversion record with Cloudinary URLs
        const conversion = new Conversion({
            originalFileName: req.file.originalname,
            originalFormat: originalFormat,
            targetFormat: targetFormat.toLowerCase(),
            fileSize: req.file.size,
            originalFileUrl: req.file.path, // Cloudinary URL
            originalCloudinaryId: req.file.filename, // Cloudinary public_id
            originalMimeType: req.file.mimetype,
            userId: req.user ? req.user._id : null,
            ipAddress: clientIP,
            status: 'processing'
        });

        // Save the conversion record
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

        // Start conversion process (now using Cloudinary URLs)
        const conversionPromise = convertFileFromCloudinary(
            conversion.originalFileUrl,
            conversion.originalCloudinaryId,
            req.file.originalname,
            req.file.mimetype,
            targetFormat,
            conversion._id
        );

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
                conversion.status = 'failed';
                await conversion.save();
                console.log(`💾 Conversion record marked as failed in database: ${conversion._id}`);
            });

        res.status(200).json({
            message: 'File uploaded successfully to Cloudinary, conversion in progress',
            conversionId: conversion._id,
            originalFileUrl: req.file.path, // Return Cloudinary URL for immediate display
            uploadInfo: req.uploadInfo || { isAnonymous: false }
        });
        
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

// Download converted file - Updated for Cloudinary
router.get('/download/:conversionId', async (req, res) => {
    try {
        console.log(`📥 Download request for conversion ID: ${req.params.conversionId}`);

        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            console.log(`❌ Conversion not found: ${req.params.conversionId}`);
            return res.status(404).json({ message: 'Conversion not found' });
        }

        console.log(`📋 Conversion status: ${conversion.status}`);
        console.log(`📋 Has convertedFileUrl: ${!!conversion.convertedFileUrl}`);

        // Check if the conversion is completed
        if (conversion.status !== 'completed') {
            console.log(`❌ Conversion not completed yet, status: ${conversion.status}`);
            return res.status(400).json({ message: 'Conversion not completed yet' });
        }

        // Check if converted file URL exists
        if (!conversion.convertedFileUrl) {
            console.log(`❌ Converted file not ready - URL: ${!!conversion.convertedFileUrl}`);
            return res.status(400).json({ message: 'Converted file not ready' });
        }

        // Increment download count
        conversion.downloadCount += 1;
        await conversion.save();

        // Redirect to Cloudinary URL for download
        console.log(`📤 Redirecting to Cloudinary URL: ${conversion.convertedFileUrl}`);
        res.redirect(conversion.convertedFileUrl);
        
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

// Get thumbnail for images - Updated for Cloudinary
router.get('/thumbnail/image/:conversionId', optionalAuth, async (req, res) => {
    try {
        console.log(`📸 Requesting image thumbnail for conversion: ${req.params.conversionId}`);
        
        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            console.log(`❌ Conversion not found: ${req.params.conversionId}`);
            return res.status(404).json({ message: 'Conversion not found' });
        }

        console.log(`📊 Conversion status: ${conversion.status}, has thumbnail URL: ${!!conversion.thumbnailUrl}`);

        // Check conversion status
        if (conversion.status === 'failed') {
            console.log(`❌ Conversion failed for: ${req.params.conversionId}`);
            return res.status(400).json({ message: 'Conversion failed', status: 'failed' });
        }

        if (conversion.status === 'processing') {
            console.log(`⏳ Conversion still processing: ${req.params.conversionId}`);
            return res.status(202).json({ message: 'Conversion still processing', status: 'processing' });
        }

        // For images, we can use the original file URL as thumbnail if no specific thumbnail exists
        const thumbnailUrl = conversion.thumbnailUrl || conversion.originalFileUrl;
        
        if (conversion.status !== 'completed' || !thumbnailUrl) {
            console.log(`❌ Thumbnail not available for: ${req.params.conversionId}, status: ${conversion.status}`);
            return res.status(404).json({ message: 'Thumbnail not available' });
        }

        console.log(`✅ Redirecting to Cloudinary thumbnail URL: ${thumbnailUrl}`);
        
        // Redirect to Cloudinary thumbnail URL
        res.redirect(thumbnailUrl);
        
    } catch (error) {
        console.error('❌ Image thumbnail error:', error);
        res.status(500).json({ message: 'Server error serving thumbnail' });
    }
});

// Get thumbnail for videos - Updated for Cloudinary
router.get('/thumbnail/video/:conversionId', optionalAuth, async (req, res) => {
    try {
        console.log(`🎬 Requesting video thumbnail for conversion: ${req.params.conversionId}`);
        
        const conversion = await Conversion.findById(req.params.conversionId);
        if (!conversion) {
            console.log(`❌ Conversion not found: ${req.params.conversionId}`);
            return res.status(404).json({ message: 'Conversion not found' });
        }

        console.log(`📊 Conversion status: ${conversion.status}, has thumbnail URL: ${!!conversion.thumbnailUrl}`);

        // Check if conversion is complete and has thumbnail URL
        if (conversion.status !== 'completed' || !conversion.thumbnailUrl) {
            console.log(`❌ Video thumbnail not available for: ${req.params.conversionId}, status: ${conversion.status}`);
            return res.status(404).json({ message: 'Video thumbnail not available' });
        }

        console.log(`✅ Redirecting to Cloudinary video thumbnail URL: ${conversion.thumbnailUrl}`);
        
        // Redirect to Cloudinary thumbnail URL
        res.redirect(conversion.thumbnailUrl);

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

// Get conversion statistics (total conversions and for this month for the authenticated user)
router.get('/stats', requireAuth, async (req, res) => {
    try {
        // Only authenticated users can access this endpoint
        const query = { userId: req.user._id };

        // Get total conversions for this user
        const totalConversions = await Conversion.countDocuments(query);

        // Get conversions for this month for this user
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthlyQuery = { ...query, createdAt: { $gte: startOfMonth } };
        const monthlyConversions = await Conversion.countDocuments(monthlyQuery);

        res.status(200).json({
            totalConversions,
            monthlyConversions,
            message: 'User conversion statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ message: 'Server error retrieving statistics' });
    }
});

module.exports = router;

