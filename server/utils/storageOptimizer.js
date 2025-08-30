const { Conversion } = require('../model/models');
const cloudinary = require('../config/cloudinary');

/**
 * Storage optimization utilities for managing large video files
 */

class StorageOptimizer {
    
    /**
     * Cleanup conversions older than specified hours
     * @param {number} hoursOld - Age threshold in hours (default: 24)
     */
    static async cleanupExpiredConversions(hoursOld = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
            
            const expiredConversions = await Conversion.find({
                createdAt: { $lt: cutoffTime },
                cloudinaryCleanedUp: false
            });
            
            console.log(`🧹 Found ${expiredConversions.length} expired conversions to cleanup`);
            
            for (const conversion of expiredConversions) {
                await this.deleteConversionFiles(conversion._id);
            }
            
            // Remove database records
            const deleteResult = await Conversion.deleteMany({
                createdAt: { $lt: cutoffTime }
            });
            
            console.log(`✅ Cleanup completed: ${deleteResult.deletedCount} records removed`);
            return deleteResult.deletedCount;
            
        } catch (error) {
            console.error('❌ Cleanup expired conversions error:', error);
            throw error;
        }
    }
    
    /**
     * Delete all files associated with a conversion
     * @param {string} conversionId - MongoDB conversion ID
     */
    static async deleteConversionFiles(conversionId) {
        try {
            const conversion = await Conversion.findById(conversionId);
            if (!conversion) {
                console.warn(`⚠️ Conversion not found: ${conversionId}`);
                return;
            }
            
            const filesToDelete = [];
            
            // Original file
            if (conversion.originalCloudinaryId) {
                filesToDelete.push({
                    public_id: conversion.originalCloudinaryId,
                    resource_type: conversion.originalMimeType?.startsWith('video/') ? 'video' : 'image'
                });
            }
            
            // Converted file
            if (conversion.convertedCloudinaryId) {
                filesToDelete.push({
                    public_id: conversion.convertedCloudinaryId,
                    resource_type: conversion.convertedMimeType?.startsWith('video/') ? 'video' : 'image'
                });
            }
            
            // Thumbnail (if stored separately in Cloudinary)
            if (conversion.thumbnailCloudinaryId && conversion.thumbnailCloudinaryId !== conversion.originalCloudinaryId) {
                filesToDelete.push({
                    public_id: conversion.thumbnailCloudinaryId,
                    resource_type: 'image'
                });
            }
            
            // Delete from Cloudinary with retry logic
            let deletedCount = 0;
            for (const file of filesToDelete) {
                try {
                    const result = await cloudinary.uploader.destroy(file.public_id, { 
                        resource_type: file.resource_type,
                        invalidate: true // Invalidate CDN cache
                    });
                    
                    if (result.result === 'ok' || result.result === 'not found') {
                        deletedCount++;
                        console.log(`🗑️ Deleted Cloudinary file: ${file.public_id} (${result.result})`);
                    } else {
                        console.warn(`⚠️ Unexpected result deleting ${file.public_id}:`, result);
                    }
                } catch (deleteError) {
                    console.warn(`⚠️ Could not delete ${file.public_id}:`, deleteError.message);
                    // Continue with other files even if one fails
                }
            }
            
            // Mark as cleaned up regardless of success (to prevent infinite retries)
            await Conversion.updateOne(
                { _id: conversionId },
                { cloudinaryCleanedUp: true }
            );
            
            console.log(`✅ Cleaned up conversion ${conversionId}: ${deletedCount}/${filesToDelete.length} files deleted from Cloudinary`);
            return deletedCount;
            
        } catch (error) {
            console.error('❌ Error deleting conversion files:', error);
            throw error;
        }
    }
    
    /**
     * Get storage usage statistics
     * @param {string} userId - User ID (optional)
     * @param {string} ipAddress - IP address (optional)
     */
    static async getStorageStats(userId = null, ipAddress = null) {
        try {
            let query = {};
            if (userId) {
                query.userId = userId;
            } else if (ipAddress) {
                query = { ipAddress: ipAddress, userId: null };
            }
            
            const conversions = await Conversion.find(query)
                .select('fileSize originalMimeType status createdAt');
            
            const stats = {
                totalConversions: conversions.length,
                totalStorageBytes: 0,
                videoConversions: 0,
                imageConversions: 0,
                completedConversions: 0,
                storageByFormat: {}
            };
            
            conversions.forEach(conv => {
                stats.totalStorageBytes += conv.fileSize || 0;
                
                if (conv.originalMimeType?.startsWith('video/')) {
                    stats.videoConversions++;
                } else if (conv.originalMimeType?.startsWith('image/')) {
                    stats.imageConversions++;
                }
                
                if (conv.status === 'completed') {
                    stats.completedConversions++;
                }
                
                const format = conv.originalMimeType || 'unknown';
                stats.storageByFormat[format] = (stats.storageByFormat[format] || 0) + (conv.fileSize || 0);
            });
            
            // Convert to MB for readability
            stats.totalStorageMB = (stats.totalStorageBytes / (1024 * 1024)).toFixed(2);
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting storage stats:', error);
            throw error;
        }
    }
    
    /**
     * Optimize storage for a specific user (keep only N most recent per file type)
     * @param {string} userId - User ID
     * @param {string} ipAddress - IP address  
     * @param {number} keepCount - Number of conversions to keep per file type (default: 5)
     */
    static async optimizeUserStorage(userId = null, ipAddress = null, keepCount = 5) {
        try {
            let query = {};
            if (userId) {
                query.userId = userId;
            } else if (ipAddress) {
                query = { ipAddress: ipAddress, userId: null };
            } else {
                throw new Error('Either userId or ipAddress must be provided');
            }
            
            // Get all conversions sorted by creation date (newest first)
            const allConversions = await Conversion.find(query)
                .sort({ createdAt: -1 })
                .select('_id originalCloudinaryId convertedCloudinaryId cloudinaryCleanedUp fileSize originalMimeType createdAt');
            
            // Separate conversions by file type
            const imageConversions = allConversions.filter(conv => 
                conv.originalMimeType?.startsWith('image/')
            );
            const videoConversions = allConversions.filter(conv => 
                conv.originalMimeType?.startsWith('video/')
            );
            const otherConversions = allConversions.filter(conv => 
                !conv.originalMimeType?.startsWith('image/') && 
                !conv.originalMimeType?.startsWith('video/')
            );
            
            console.log(`📊 User has ${imageConversions.length} image conversions, ${videoConversions.length} video conversions, ${otherConversions.length} other conversions`);
            
            // Determine which conversions to delete
            const conversionsToDelete = [];
            
            // Keep only the most recent N image conversions
            if (imageConversions.length > keepCount) {
                const imageToDelete = imageConversions.slice(keepCount);
                conversionsToDelete.push(...imageToDelete);
                console.log(`🖼️ Will delete ${imageToDelete.length} old image conversions (keeping ${keepCount} most recent)`);
            }
            
            // Keep only the most recent N video conversions
            if (videoConversions.length > keepCount) {
                const videoToDelete = videoConversions.slice(keepCount);
                conversionsToDelete.push(...videoToDelete);
                console.log(`🎥 Will delete ${videoToDelete.length} old video conversions (keeping ${keepCount} most recent)`);
            }
            
            // Keep only the most recent N other conversions
            if (otherConversions.length > keepCount) {
                const otherToDelete = otherConversions.slice(keepCount);
                conversionsToDelete.push(...otherToDelete);
                console.log(`📄 Will delete ${otherToDelete.length} old other conversions (keeping ${keepCount} most recent)`);
            }
            
            if (conversionsToDelete.length === 0) {
                console.log(`✅ No cleanup needed. User has ≤${keepCount} conversions per file type`);
                return 0;
            }
            
            console.log(`🧹 Optimizing storage: removing ${conversionsToDelete.length} old conversions total`);
            
            let totalSizeFreed = 0;
            
            // Delete files from Cloudinary
            for (const conversion of conversionsToDelete) {
                if (!conversion.cloudinaryCleanedUp) {
                    await this.deleteConversionFiles(conversion._id);
                }
                totalSizeFreed += conversion.fileSize || 0;
            }
            
            // Delete from database
            const idsToDelete = conversionsToDelete.map(c => c._id);
            await Conversion.deleteMany({ _id: { $in: idsToDelete } });
            
            console.log(`✅ Storage optimization completed: ${(totalSizeFreed / (1024 * 1024)).toFixed(2)}MB freed`);
            return conversionsToDelete.length;
            
        } catch (error) {
            console.error('❌ Storage optimization error:', error);
            throw error;
        }
    }
}

module.exports = StorageOptimizer;