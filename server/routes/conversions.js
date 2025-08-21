const { express } = require('../utils/dependencies');
const path = require('path');
const { Conversion } = require('../model/models');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { checkUploadLimit } = require('../middleware/uploadLimit');
const { upload, handleUploadError } = require('../middleware/multer');
const cloudinary = require('../config/cloudinary');
const { convertFileFromCloudinary, convertMpgToMp4AndUpload } = require('../utils/cloudinaryProcessor');
const StorageOptimizer = require('../utils/storageOptimizer');
const SecurityLogger = require('../utils/securityLogger');
const { conversionValidation, validateInput, validateIP, sanitizeObjectId } = require('../middleware/validation');

const router = express.Router();

// Enhanced access control middleware - Fixed for authenticated users
const verifyConversionAccess = async (req, res, next) => {
    try {
        const conversionId = sanitizeObjectId(req.params.conversionId);
        if (!conversionId) {
            SecurityLogger.logAccessDenied(`Invalid conversion ID: ${req.params.conversionId}`, 'Invalid ID format', req);
            return res.status(400).json({ message: 'Invalid conversion ID' });
        }

        const conversion = await Conversion.findById(conversionId);
        if (!conversion) {
            SecurityLogger.logAccessDenied(`Conversion not found: ${conversionId}`, 'Resource not found', req);
            return res.status(404).json({ message: 'Conversion not found' });
        }

        // Check ownership - Fixed logic
        let hasAccess = false;
        
        if (conversion.userId) {
            // If conversion has a userId, check if the current user matches
            if (req.user && conversion.userId.equals(req.user._id)) {
                hasAccess = true;
                console.log(`✅ Access granted to user ${req.user._id} for conversion ${conversionId}`);
            }
        } else {
            // If conversion has no userId (anonymous), check IP address
            const clientIP = req.ip || req.connection.remoteAddress;
            
            if (!validateIP(clientIP)) {
                SecurityLogger.logSuspiciousActivity(`Invalid client IP detected: ${clientIP}`, req);
                return res.status(400).json({ message: 'Invalid client identification' });
            }
            
            if (conversion.ipAddress === clientIP) {
                hasAccess = true;
                console.log(`✅ Access granted to IP ${clientIP} for conversion ${conversionId}`);
            }
        }
            
        if (!hasAccess) {
            console.log(`❌ Access denied for conversion ${conversionId}:`);
            console.log(`   - Conversion userId: ${conversion.userId}`);
            console.log(`   - Request user: ${req.user?._id || 'none'}`);
            console.log(`   - Conversion IP: ${conversion.ipAddress}`);
            console.log(`   - Request IP: ${req.ip || req.connection.remoteAddress}`);
            
            SecurityLogger.logAccessDenied(`Conversion ${conversionId}`, 'Unauthorized access attempt', req);
            return res.status(403).json({ message: 'Access denied' });
        }

        req.conversion = conversion;
        next();
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Access verification error: ${error.message}`, req);
        res.status(500).json({ message: 'Server error during access verification' });
    }
};

// Upload and convert file with enhanced security
router.post('/upload', optionalAuth, checkUploadLimit, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, next);
        }
        next();
    });
}, conversionValidation.uploadParams, validateInput, async (req, res) => {
    
    try {
        if (!req.file) {
            SecurityLogger.logSuspiciousActivity('Upload attempt without file', req);
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('📤 File uploaded to Cloudinary:', {
            url: req.file.path,
            public_id: req.file.filename,
            size: req.file.size
        });

        const { targetFormat } = req.body;

        // Enhanced format validation
        const originalFormat = path.extname(req.file.originalname).slice(1).toLowerCase();
        const imageFormats = ['jpeg', 'jpg', 'png', 'webp'];
        const videoFormats = ['mp4', 'mov', 'webm']; // Removed mpg/mpeg since they're converted to mp4
        
        // Debug logging for format detection
        console.log(`🔍 Route Debug - Upload processing:`);
        console.log(`   - Original filename: ${req.file.originalname}`);
        console.log(`   - Detected original format: ${originalFormat}`);
        console.log(`   - File MIME type: ${req.file.mimetype}`);
        console.log(`   - Target format: ${targetFormat}`);
        console.log(`   - Target format toLowerCase: ${targetFormat.toLowerCase()}`);
        console.log(`   - Image formats: [${imageFormats.join(', ')}]`);
        console.log(`   - Video formats: [${videoFormats.join(', ')}]`);
        
        // Check if this was originally an MPG file that got converted to MP4
        const wasOriginallyMpg = req.file.originalname.includes('_converted') && 
                                 req.file.mimetype === 'video/mp4' &&
                                 req.file.originalname.toLowerCase().includes('.mp4');
        
        if (wasOriginallyMpg) {
            console.log(`🎬 Detected pre-converted MPG→MP4 file: ${req.file.originalname}`);
        }
        
        const isImageFile = imageFormats.includes(originalFormat);
        const isVideoFile = videoFormats.includes(originalFormat) || wasOriginallyMpg;
        const targetIsImage = imageFormats.includes(targetFormat.toLowerCase());
        const targetIsVideo = videoFormats.includes(targetFormat.toLowerCase());
        
        console.log(`   - Is image file: ${isImageFile}`);
        console.log(`   - Is video file: ${isVideoFile}`);
        console.log(`   - Was originally MPG: ${wasOriginallyMpg}`);
        console.log(`   - Target is image: ${targetIsImage}`);
        console.log(`   - Target is video: ${targetIsVideo}`);
        
        // Validate format compatibility
        if (isImageFile && !targetIsImage) {
            SecurityLogger.logSuspiciousActivity(`Invalid image conversion attempt: ${originalFormat} to ${targetFormat}`, req);
            return res.status(400).json({ 
                message: 'Invalid conversion: Images can only be converted to supported image formats (JPEG, PNG, WebP)' 
            });
        }
        
        if (isVideoFile && !targetIsVideo) {
            console.log(`❌ Video format validation failed:`);
            console.log(`   - Original is video: ${isVideoFile}`);
            console.log(`   - Target is video: ${targetIsVideo}`);
            console.log(`   - Original format: ${originalFormat}`);
            console.log(`   - Target format: ${targetFormat}`);
            SecurityLogger.logSuspiciousActivity(`Invalid video conversion attempt: ${originalFormat} to ${targetFormat}`, req);
            return res.status(400).json({ 
                message: `Invalid conversion: Videos can only be converted to supported video formats (MP4, MOV, WebM). You selected: ${targetFormat}` 
            });
        }
        
        if (!isImageFile && !isVideoFile) {
            SecurityLogger.logSuspiciousActivity(`Unsupported file type upload: ${originalFormat}`, req);
            return res.status(400).json({ 
                message: 'Unsupported file type. Only supported images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM) are allowed.' 
            });
        }

        const clientIP = req.ip || req.connection.remoteAddress;

        // Create conversion record with enhanced security
        // For pre-converted MPG files, store the original format info
        const actualOriginalFormat = wasOriginallyMpg ? 'mpg' : originalFormat;
        
        const conversion = new Conversion({
            originalFileName: req.file.originalname,
            originalFormat: actualOriginalFormat,
            targetFormat: targetFormat.toLowerCase(),
            fileSize: req.file.size,
            originalFileUrl: req.file.path,
            originalCloudinaryId: req.file.filename,
            originalMimeType: req.file.mimetype,
            userId: req.user ? req.user._id : null,
            ipAddress: clientIP,
            status: 'processing'
        });

        await conversion.save();
        console.log(`📝 Conversion record created: ${conversion._id}`);

        SecurityLogger.logSecurityEvent('CONVERSION_STARTED', {
            conversionId: conversion._id,
            originalFormat: actualOriginalFormat,
            targetFormat,
            fileSize: req.file.size,
            userId: req.user?._id || 'anonymous',
            wasPreConverted: wasOriginallyMpg
        }, req);

        // If the file was already converted from MPG to MP4 and target is MP4, mark as completed
        if (wasOriginallyMpg && targetFormat.toLowerCase() === 'mp4') {
            console.log(`✅ MPG→MP4 conversion already completed during upload`);
            conversion.status = 'completed';
            conversion.convertedFileUrl = req.file.path;
            conversion.convertedCloudinaryId = req.file.filename;
            conversion.convertedFileName = req.file.originalname;
            conversion.convertedMimeType = 'video/mp4';
            conversion.progress = 100;
            
            // Generate thumbnail URL using Cloudinary transformation
            conversion.thumbnailUrl = cloudinary.url(req.file.filename, {
                resource_type: 'video',
                format: 'jpg',
                width: 300,
                height: 300,
                crop: 'fill',
                start_offset: '0s'
            });
            
            await conversion.save();
            
            return res.status(200).json({
                message: 'MPG file converted to MP4 and uploaded successfully',
                conversionId: conversion._id,
                originalFileUrl: req.file.path,
                status: 'completed',
                uploadInfo: req.uploadInfo || { isAnonymous: false }
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
        SecurityLogger.logSuspiciousActivity(`Upload error: ${error.message}`, req);
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

// New route for MPG/MPEG to MP4 conversion with direct Cloudinary upload
router.post('/upload-mpg', optionalAuth, checkUploadLimit, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, next);
        }
        next();
    });
}, async (req, res) => {
    
    try {
        if (!req.file) {
            SecurityLogger.logSuspiciousActivity('MPG upload attempt without file', req);
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const originalFormat = path.extname(req.file.originalname).slice(1).toLowerCase();
        
        // Validate that the uploaded file is MPG or MPEG
        if (!['mpg', 'mpeg'].includes(originalFormat)) {
            SecurityLogger.logSuspiciousActivity(`Invalid file format for MPG upload: ${originalFormat}`, req);
            return res.status(400).json({ 
                message: 'Only MPG and MPEG files are allowed for this endpoint' 
            });
        }

        console.log('🎬 MPG/MPEG file uploaded to Cloudinary:', {
            url: req.file.path,
            public_id: req.file.filename,
            size: req.file.size,
            originalFormat: originalFormat
        });

        const clientIP = req.ip || req.connection.remoteAddress;

        // Create conversion record
        const conversion = new Conversion({
            originalFileName: req.file.originalname,
            originalFormat: originalFormat,
            targetFormat: 'mp4',
            fileSize: req.file.size,
            originalFileUrl: req.file.path,
            originalCloudinaryId: req.file.filename,
            originalMimeType: req.file.mimetype,
            userId: req.user ? req.user._id : null,
            ipAddress: clientIP,
            status: 'processing'
        });

        await conversion.save();
        console.log(`📝 MPG conversion record created: ${conversion._id}`);

        SecurityLogger.logSecurityEvent('MPG_CONVERSION_STARTED', {
            conversionId: conversion._id,
            originalFormat,
            targetFormat: 'mp4',
            fileSize: req.file.size,
            userId: req.user?._id || 'anonymous'
        }, req);

        // Start the conversion process
        convertMpgToMp4AndUpload(
            req.file.path,
            req.file.filename,
            req.file.originalname,
            req.file.mimetype,
            conversion._id
        ).then(async (result) => {
            console.log(`✅ MPG to MP4 conversion completed: ${result.cloudinaryUrl}`);
            conversion.status = 'completed';
            conversion.convertedFileUrl = result.cloudinaryUrl;
            conversion.convertedCloudinaryId = result.cloudinaryId;
            conversion.convertedFileName = result.fileName;
            conversion.convertedMimeType = 'video/mp4';
            conversion.thumbnailUrl = result.thumbnailUrl;
            conversion.progress = 100;
            await conversion.save();
        }).catch(async (error) => {
            console.error('❌ MPG to MP4 conversion failed:', error.message);
            conversion.status = 'failed';
            conversion.progress = 0;
            await conversion.save();
        });

        res.status(200).json({
            message: 'MPG/MPEG file uploaded successfully, converting to MP4 and uploading to Cloudinary',
            conversionId: conversion._id,
            originalFileUrl: req.file.path,
            uploadInfo: req.uploadInfo || { isAnonymous: false }
        });
        
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`MPG upload error: ${error.message}`, req);
        console.error('MPG upload error:', error);
        res.status(500).json({ message: 'Server error during MPG upload' });
    }
});

// Check conversion status with validation - Fixed authentication
router.get('/status/:conversionId', optionalAuth, conversionValidation.statusParams, validateInput, verifyConversionAccess, async (req, res) => {
    try {
        const conversion = req.conversion;
        
        console.log(`✅ Status check successful for conversion ${conversion._id}`);
        
        res.status(200).json({
            id: conversion._id,
            status: conversion.status,
            originalFileName: conversion.originalFileName,
            originalFormat: conversion.originalFormat,
            targetFormat: conversion.targetFormat,
            progress: conversion.progress || 0,
            createdAt: conversion.createdAt
        });

    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Status check error: ${error.message}`, req);
        console.error('Status check error:', error);
        res.status(500).json({ message: 'Server error checking status' });
    }
});

// Download converted file with enhanced security
router.get('/download/:conversionId', optionalAuth, conversionValidation.downloadParams, validateInput, verifyConversionAccess, async (req, res) => {
    try {
        const conversion = req.conversion;

        console.log(`📥 Download request for conversion ID: ${conversion._id}`);

        if (conversion.status !== 'completed') {
            SecurityLogger.logAccessDenied(`Conversion ${conversion._id}`, 'Download attempt on incomplete conversion', req);
            return res.status(400).json({ message: 'Conversion not completed yet' });
        }

        if (!conversion.convertedFileUrl) {
            SecurityLogger.logAccessDenied(`Conversion ${conversion._id}`, 'Download attempt without converted file', req);
            return res.status(400).json({ message: 'Converted file not ready' });
        }

        // Increment download count and log download
        conversion.downloadCount += 1;
        await conversion.save();

        SecurityLogger.logSecurityEvent('FILE_DOWNLOAD', {
            conversionId: conversion._id,
            fileName: conversion.convertedFileName,
            downloadCount: conversion.downloadCount
        }, req);

        console.log(`📤 Redirecting to Cloudinary URL: ${conversion.convertedFileUrl}`);
        res.redirect(conversion.convertedFileUrl);
        
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Download error: ${error.message}`, req);
        console.error('Download error:', error);
        res.status(500).json({ message: 'Server error during download' });
    }
});

// Get user's conversion history with IP validation
router.get('/history', optionalAuth, async (req, res) => {
    try {
        let query = {};
        
        if (req.user) {
            query.userId = req.user._id;
        } else {
            const clientIP = req.ip || req.connection.remoteAddress;
            
            if (!validateIP(clientIP)) {
                SecurityLogger.logSuspiciousActivity(`Invalid IP in history request: ${clientIP}`, req);
                return res.status(400).json({ message: 'Invalid client identification' });
            }
            
            query = { ipAddress: clientIP, userId: null };
        }

        const conversions = await Conversion.find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .select('originalFileName targetFormat status createdAt downloadCount');

        res.status(200).json({ conversions });
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`History error: ${error.message}`, req);
        console.error('History error:', error);
        res.status(500).json({ message: 'Server error retrieving history' });
    }
});

// Get categorized history (images and videos separately)
router.get('/history/categorized', optionalAuth, async (req, res) => {
    try {
        let query = {};
        
        if (req.user) {
            query.userId = req.user._id;
            console.log(`📋 Fetching categorized history for user: ${req.user._id}`);
        } else {
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

// Storage optimization endpoints
router.post('/storage/optimize', optionalAuth, async (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress;
        const userId = req.user ? req.user._id : null;
        
        console.log(`🧹 Storage optimization requested for ${userId ? 'user' : 'IP'}: ${userId || clientIP}`);
        
        const deletedCount = await StorageOptimizer.optimizeUserStorage(userId, clientIP, 5);
        
        res.status(200).json({
            message: 'Storage optimization completed',
            deletedConversions: deletedCount,
            keptConversions: 5
        });
        
    } catch (error) {
        console.error('Storage optimization error:', error);
        res.status(500).json({ message: 'Server error during storage optimization' });
    }
});

// Get storage usage statistics
router.get('/storage/stats', optionalAuth, async (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress;
        const userId = req.user ? req.user._id : null;
        
        const stats = await StorageOptimizer.getStorageStats(userId, clientIP);
        
        res.status(200).json({
            storage: stats,
            message: 'Storage statistics retrieved successfully'
        });
        
    } catch (error) {
        console.error('Storage stats error:', error);
        res.status(500).json({ message: 'Server error retrieving storage statistics' });
    }
});

// Manual cleanup of expired conversions (admin endpoint)
router.post('/storage/cleanup-expired', async (req, res) => {
    try {
        const { hoursOld = 24 } = req.body;
        
        console.log(`🧹 Manual cleanup of conversions older than ${hoursOld} hours`);
        
        const deletedCount = await StorageOptimizer.cleanupExpiredConversions(hoursOld);
        
        res.status(200).json({
            message: 'Expired conversions cleanup completed',
            deletedConversions: deletedCount,
            hoursOld: hoursOld
        });
        
    } catch (error) {
        console.error('Expired cleanup error:', error);
        res.status(500).json({ message: 'Server error during expired conversions cleanup' });
    }
});

module.exports = router;

