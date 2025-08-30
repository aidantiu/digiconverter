const cron = require('node-cron');
const StorageOptimizer = require('./utils/storageOptimizer');
const { Conversion } = require('./model/models');

/**
 * Scheduled cleanup jobs for storage optimization
 */

// Run user storage optimization every 6 hours
cron.schedule('0 */6 * * *', async () => {
    try {
        console.log('🕕 [DEBUG] Running user storage optimization job...');
        
        // Get all users/IPs that have more than 5 conversions
        const pipeline = [
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        ipAddress: '$ipAddress'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 5 }
                }
            }
        ];
        
        const usersToOptimize = await Conversion.aggregate(pipeline);
        console.log(`📊 [DEBUG] Found ${usersToOptimize.length} users/IPs with more than 5 conversions`);
        
        if (usersToOptimize.length === 0) {
            console.log('✅ [DEBUG] No users need storage optimization');
            return;
        }
        
        let totalOptimized = 0;
        for (const userGroup of usersToOptimize) {
            try {
                const userIdentifier = userGroup._id.userId || `IP:${userGroup._id.ipAddress}`;
                console.log(`🧹 [DEBUG] Optimizing storage for ${userIdentifier} (${userGroup.count} total conversions)`);
                
                // Fix: Pass only userId OR ipAddress, not both
                let deletedCount;
                if (userGroup._id.userId) {
                    // Registered user - use userId only
                    deletedCount = await StorageOptimizer.optimizeUserStorage(
                        userGroup._id.userId,
                        null,
                        5 // Keep only 5 most recent
                    );
                } else {
                    // Anonymous user - use ipAddress only
                    deletedCount = await StorageOptimizer.optimizeUserStorage(
                        null,
                        userGroup._id.ipAddress,
                        5 // Keep only 5 most recent
                    );
                }
                
                totalOptimized += deletedCount;
                
                if (deletedCount > 0) {
                    console.log(`✅ [DEBUG] Cleaned up ${deletedCount} old conversions for ${userIdentifier}`);
                } else {
                    console.log(`ℹ️ [DEBUG] No cleanup needed for ${userIdentifier}`);
                }
            } catch (error) {
                console.error('❌ [DEBUG] Failed to optimize storage for user:', userGroup._id, error);
            }
        }
        
        console.log(`✅ [DEBUG] Storage optimization completed: ${totalOptimized} old conversions removed for ${usersToOptimize.length} users (keeping 5 most recent per user)`);
        
    } catch (error) {
        console.error('❌ [DEBUG] Storage optimization job failed:', error);
    }
});

// Run failed conversions cleanup every minute (DEBUG MODE)
cron.schedule('* * * * *', async () => {
    try {
        console.log('🌙 [DEBUG] Running failed conversions cleanup...');
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedConversions = await Conversion.find({
            status: 'failed',
            createdAt: { $lt: oneHourAgo }
        });
        
        console.log(`📊 [DEBUG] Found ${failedConversions.length} failed conversions older than 1 hour`);
        
        if (failedConversions.length === 0) {
            console.log('✅ [DEBUG] No failed conversions to clean up');
            return;
        }
        
        let deletedCount = 0;
        for (const conversion of failedConversions) {
            try {
                await StorageOptimizer.deleteConversionFiles(conversion._id);
                deletedCount++;
            } catch (error) {
                console.error('❌ [DEBUG] Failed to delete files for failed conversion:', conversion._id, error);
            }
        }
        
        // Remove failed conversion records
        const deleteResult = await Conversion.deleteMany({
            status: 'failed',
            createdAt: { $lt: oneHourAgo }
        });
        
        console.log(`✅ [DEBUG] Failed conversions cleanup completed: ${deleteResult.deletedCount} records removed, ${deletedCount} file sets deleted`);
        
    } catch (error) {
        console.error('❌ [DEBUG] Failed conversions cleanup failed:', error);
    }
});

console.log('📅 [DEBUG MODE] Storage cleanup jobs scheduled:');
console.log('   - Every minute: Optimize user storage (keep only 5 most recent)');
console.log('   - Every minute: Clean up failed conversions older than 1 hour');
console.log('   - 🚨 DEBUG MODE ACTIVE - Remember to change back to production schedule!');