// Import from dependencies
const { mongoose } = require('../utils/dependencies');

// Define Conversion Schema
const conversionSchema = new mongoose.Schema({
    originalFileName: {
        type: String,
        required: true
    },
    convertedFileName: {
        type: String,
        required: false // Will be set after conversion completes
    },
    originalFormat: {
        type: String,
        required: true
    },
    targetFormat: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    // Store Cloudinary URLs instead of Buffer data
    originalFileUrl: {
        type: String,
        required: true // Cloudinary URL for original file
    },
    originalCloudinaryId: {
        type: String,
        required: true // Cloudinary public_id for original file
    },
    originalMimeType: {
        type: String,
        required: true
    },
    // Store converted file Cloudinary data
    convertedFileUrl: {
        type: String,
        required: false // Cloudinary URL for converted file
    },
    convertedCloudinaryId: {
        type: String,
        required: false // Cloudinary public_id for converted file
    },
    convertedMimeType: {
        type: String,
        required: false
    },
    // Store thumbnail Cloudinary data
    thumbnailUrl: {
        type: String,
        required: false // Cloudinary URL for thumbnail
    },
    thumbnailCloudinaryId: {
        type: String,
        required: false // Cloudinary public_id for thumbnail
    },
    thumbnailMimeType: {
        type: String,
        default: 'image/jpeg'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow null for anonymous users
    },
    ipAddress: {
        type: String,
        required: true // Track IP for anonymous users
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Add TTL field for automatic cleanup after 24 hours
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours in seconds
    },
    // Track if files have been cleaned up from Cloudinary
    cloudinaryCleanedUp: {
        type: Boolean,
        default: false
    }
});

// Index for efficient queries
conversionSchema.index({ ipAddress: 1, createdAt: -1 });
conversionSchema.index({ userId: 1, createdAt: -1 });
// Remove duplicate expiresAt index since it's already created by expires field above

// Middleware to cleanup old conversions when new ones are created
conversionSchema.pre('save', async function(next) {
    // Only run cleanup for new documents that are completed
    if (this.isNew && this.status === 'completed') {
        await this.constructor.cleanupOldConversions(this.userId, this.ipAddress);
    }
    next();
});

// Static method to cleanup old conversions (keep only 5 most recent)
conversionSchema.statics.cleanupOldConversions = async function(userId, ipAddress) {
    try {
        const cloudinary = require('../config/cloudinary');
        
        // Build query based on user type
        let query = {};
        if (userId) {
            query.userId = userId;
        } else {
            query = { ipAddress: ipAddress, userId: null };
        }
        
        // Find all conversions for this user/IP, sorted by creation date (newest first)
        const allConversions = await this.find(query)
            .sort({ createdAt: -1 })
            .select('originalCloudinaryId convertedCloudinaryId thumbnailCloudinaryId cloudinaryCleanedUp');
        
        // If more than 5 conversions exist, clean up the oldest ones
        if (allConversions.length > 5) {
            const conversionsToDelete = allConversions.slice(5); // Keep first 5, delete the rest
            
            console.log(`🧹 Cleaning up ${conversionsToDelete.length} old conversions for ${userId ? 'user' : 'IP'}: ${userId || ipAddress}`);
            
            // Delete from Cloudinary first
            for (const conversion of conversionsToDelete) {
                if (!conversion.cloudinaryCleanedUp) {
                    await this.deleteCloudinaryFiles(conversion);
                }
            }
            
            // Delete from database
            const idsToDelete = conversionsToDelete.map(c => c._id);
            await this.deleteMany({ _id: { $in: idsToDelete } });
            
            console.log(`✅ Cleanup completed: ${conversionsToDelete.length} old conversions removed`);
        }
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    }
};

// Static method to delete Cloudinary files
conversionSchema.statics.deleteCloudinaryFiles = async function(conversion) {
    try {
        const cloudinary = require('../config/cloudinary');
        const filesToDelete = [];
        
        // Collect all Cloudinary IDs to delete
        if (conversion.originalCloudinaryId) {
            filesToDelete.push({
                public_id: conversion.originalCloudinaryId,
                resource_type: conversion.originalMimeType?.startsWith('video/') ? 'video' : 'image'
            });
        }
        
        if (conversion.convertedCloudinaryId) {
            filesToDelete.push({
                public_id: conversion.convertedCloudinaryId,
                resource_type: conversion.convertedMimeType?.startsWith('video/') ? 'video' : 'image'
            });
        }
        
        // Delete files from Cloudinary
        for (const file of filesToDelete) {
            try {
                await cloudinary.uploader.destroy(file.public_id, { resource_type: file.resource_type });
                console.log(`🗑️ Deleted Cloudinary file: ${file.public_id}`);
            } catch (deleteError) {
                console.warn(`⚠️ Could not delete Cloudinary file ${file.public_id}:`, deleteError.message);
            }
        }
        
        // Mark as cleaned up
        await this.updateOne(
            { _id: conversion._id },
            { cloudinaryCleanedUp: true }
        );
        
    } catch (error) {
        console.error('❌ Error deleting Cloudinary files:', error);
    }
};

// Create Conversion Model
module.exports = mongoose.model('Conversion', conversionSchema);
