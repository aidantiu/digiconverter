// Create a dummy test user for unlimited uploads
require('dotenv').config();
const { mongoose } = require('./utils/dependencies');
const { User } = require('./model/models');

async function createDummyUser() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digiconverter');
        console.log('✅ Connected to MongoDB');

        // Check if dummy user already exists
        const existingUser = await User.findOne({ email: 'test@digiconverter.com' });
        if (existingUser) {
            console.log('ℹ️  Dummy user already exists:');
            console.log('   Username:', existingUser.username);
            console.log('   Email:', existingUser.email);
            console.log('   Created:', existingUser.createdAt);
            return;
        }

        // Create dummy user
        const dummyUser = new User({
            username: 'testuser',
            email: 'test@digiconverter.com',
            password: 'testpassword123' // Will be hashed automatically by pre-save hook
        });

        await dummyUser.save();
        
        console.log('🎉 Dummy test user created successfully!');
        console.log('📧 Email: test@digiconverter.com');
        console.log('🔑 Password: testpassword123');
        console.log('👤 Username: testuser');
        console.log('');
        console.log('💡 This user has unlimited uploads. Use these credentials to test authenticated features.');
        console.log('');
        console.log('🔗 To login via API:');
        console.log('   POST /auth/login');
        console.log('   Body: { "email": "test@digiconverter.com", "password": "testpassword123" }');

    } catch (error) {
        console.error('❌ Error creating dummy user:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Check if this script is being run directly
if (require.main === module) {
    createDummyUser();
}

module.exports = { createDummyUser };
