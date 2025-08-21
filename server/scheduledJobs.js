const cron = require('node-cron');
const StorageOptimizer = require('./utils/storageOptimizer');
const { Conversion } = require('./model/models');

/**
 * Scheduled cleanup jobs for storage optimization
 */

// Run cleanup every hour to remove expired conversions (older than 24 hours)
cron.schedule('0 * * * *', async () => {
    try {
        console.log('🕐 Running hourly cleanup job...');
        const deletedCount = await StorageOptimizer.cleanupExpiredConversions(24);
        console.log(`✅ Hourly cleanup completed: ${deletedCount} expired conversions removed`);
    } catch (error) {
        console.error('❌ Hourly cleanup job failed:', error);
    }
});

// Run user storage optimization every 6 hours
cron.schedule('0 */6 * * *', async () => {
    try {
        console.log('🕕 Running user storage optimization job...');
        
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
        
        let totalOptimized = 0;
        for (const userGroup of usersToOptimize) {
            try {
                const deletedCount = await StorageOptimizer.optimizeUserStorage(
                    userGroup._id.userId,
                    userGroup._id.ipAddress,
                    5
                );
                totalOptimized += deletedCount;
            } catch (error) {
                console.error('❌ Failed to optimize storage for user:', userGroup._id, error);
            }
        }
        
        console.log(`✅ Storage optimization completed: ${totalOptimized} old conversions removed for ${usersToOptimize.length} users`);
        
    } catch (error) {
        console.error('❌ Storage optimization job failed:', error);
    }
});

// Run daily cleanup of failed conversions older than 1 hour
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('🌙 Running daily failed conversions cleanup...');
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedConversions = await Conversion.find({
            status: 'failed',
            createdAt: { $lt: oneHourAgo }
        });
        
        let deletedCount = 0;
        for (const conversion of failedConversions) {
            try {
                await StorageOptimizer.deleteConversionFiles(conversion._id);
                deletedCount++;
            } catch (error) {
                console.error('❌ Failed to delete files for failed conversion:', conversion._id, error);
            }
        }
        
        // Remove failed conversion records
        const deleteResult = await Conversion.deleteMany({
            status: 'failed',
            createdAt: { $lt: oneHourAgo }
        });
        
        console.log(`✅ Daily failed conversions cleanup completed: ${deleteResult.deletedCount} records removed, ${deletedCount} file sets deleted`);
        
    } catch (error) {
        console.error('❌ Daily failed conversions cleanup failed:', error);
    }
});

console.log('📅 Storage cleanup jobs scheduled:');
console.log('   - Hourly: Remove conversions older than 24 hours');
console.log('   - Every 6 hours: Optimize user storage (keep only 5 most recent)');
console.log('   - Daily at 2 AM: Clean up failed conversions older than 1 hour');