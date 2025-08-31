const cron = require('node-cron');
const StorageOptimizer = require('./utils/storageOptimizer');
const { Conversion } = require('./model/models');

/**
 * Scheduled cleanup jobs for storage optimization
 */

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
        console.log(`📊 Found ${usersToOptimize.length} users/IPs with more than 5 conversions`);
        
        if (usersToOptimize.length === 0) {
            console.log('✅ No users need storage optimization');
            return;
        }
        
        let totalOptimized = 0;
        for (const userGroup of usersToOptimize) {
            try {
                const userIdentifier = userGroup._id.userId || `IP:${userGroup._id.ipAddress}`;
                console.log(`🧹 Optimizing storage for ${userIdentifier} (${userGroup.count} total conversions)`);
                
                // Fix: Pass only userId OR ipAddress, not both
                let deletedCount;
                if (userGroup._id.userId) {
                    // Registered user - use userId only
                    deletedCount = await StorageOptimizer.optimizeUserStorage(
                        userGroup._id.userId,
                        null,
                        5 // Keep only 5 most recent per file type
                    );
                } else {
                    // Anonymous user - use ipAddress only
                    deletedCount = await StorageOptimizer.optimizeUserStorage(
                        null,
                        userGroup._id.ipAddress,
                        5 // Keep only 5 most recent per file type
                    );
                }
                
                totalOptimized += deletedCount;
                
                if (deletedCount > 0) {
                    console.log(`✅ Cleaned up ${deletedCount} old conversions for ${userIdentifier}`);
                } else {
                    console.log(`ℹ️ No cleanup needed for ${userIdentifier}`);
                }
            } catch (error) {
                console.error('❌ Failed to optimize storage for user:', userGroup._id, error);
            }
        }
        
        console.log(`✅ Storage optimization completed: ${totalOptimized} old conversions removed for ${usersToOptimize.length} users (keeping 5 most recent per file type)`);
        
    } catch (error) {
        console.error('❌ Storage optimization job failed:', error);
    }
});

// Run failed conversions cleanup every 6 hours
cron.schedule('0 */6 * * *', async () => {
    try {
        console.log('🌙 Running failed conversions cleanup...');
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedConversions = await Conversion.find({
            status: 'failed',
            createdAt: { $lt: oneHourAgo }
        });
        
        console.log(`📊 Found ${failedConversions.length} failed conversions older than 1 hour`);
        
        if (failedConversions.length === 0) {
            console.log('✅ No failed conversions to clean up');
            return;
        }
        
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
        
        console.log(`✅ Failed conversions cleanup completed: ${deleteResult.deletedCount} records removed, ${deletedCount} file sets deleted`);
        
    } catch (error) {
        console.error('❌ Failed conversions cleanup failed:', error);
    }
});

console.log('📅 Scheduled Jobs:');
console.log('   - Every 6 hours: Optimize user storage (keep 5 most recent per file type)');
console.log('   - Every 6 hours: Clean up failed conversions older than 1 hour');