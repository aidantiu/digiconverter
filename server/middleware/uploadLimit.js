// Middleware to check upload limits for anonymous users
const { Conversion } = require('../model/models');

const checkUploadLimit = async (req, res, next) => {
    try {
        // If user is authenticated, no limits apply
        if (req.user) {
            return next();
        }

        // Get client IP address
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);

        // Count uploads from this IP in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const uploadCount = await Conversion.countDocuments({
            ipAddress: clientIP,
            userId: null, // Only count anonymous uploads
            createdAt: { $gte: twentyFourHoursAgo }
        });

        // Check if limit exceeded
        if (uploadCount >= 3) {
            return res.status(429).json({
                message: 'Upload limit exceeded. Anonymous users can upload 3 files per day. Please register for unlimited uploads.',
                limit: 3,
                used: uploadCount,
                resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
        }

        // Add upload info to request for later use
        req.uploadInfo = {
            isAnonymous: true,
            ipAddress: clientIP,
            uploadsUsed: uploadCount,
            uploadsRemaining: 3 - uploadCount
        };

        next();
    } catch (error) {
        console.error('Error checking upload limit:', error);
        res.status(500).json({ message: 'Server error checking upload limits' });
    }
};

module.exports = { checkUploadLimit };
