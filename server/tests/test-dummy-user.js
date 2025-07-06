// Test script to verify dummy user login and unlimited uploads
require('dotenv').config();
const { mongoose } = require('../utils/dependencies');
const { User } = require('../model/models');

async function testDummyUser() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digiconverter');
        console.log('✅ Connected to MongoDB');

        // Find the dummy user
        const testUser = await User.findOne({ email: 'test@digiconverter.com' });
        
        if (!testUser) {
            console.log('❌ Dummy user not found. Run create-dummy-user.js first.');
            return;
        }

        console.log('✅ Dummy user found:');
        console.log('   ID:', testUser._id);
        console.log('   Username:', testUser.username);
        console.log('   Email:', testUser.email);
        console.log('   Created:', testUser.createdAt);

        // Test password verification
        const isPasswordValid = await testUser.comparePassword('testpassword123');
        console.log('🔑 Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

        console.log('');
        console.log('🚀 Ready for testing!');
        console.log('   1. Start your server: npm start');
        console.log('   2. Login via POST /auth/login with:');
        console.log('      { "email": "test@digiconverter.com", "password": "testpassword123" }');
        console.log('   3. Use the returned JWT token for authenticated requests');
        console.log('   4. Check /conversions/limits - should show unlimited uploads');

    } catch (error) {
        console.error('❌ Error testing dummy user:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the test
if (require.main === module) {
    testDummyUser();
}

module.exports = { testDummyUser };
