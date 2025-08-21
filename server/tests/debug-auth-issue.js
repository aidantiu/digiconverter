// Test script to check user authentication issues
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../model/models');

async function testUserAuth() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        const email = 'tiuprof77@gmail.com';
        console.log(`\n🔍 Looking for user with email: ${email}`);
        
        const user = await User.findOne({ email });
        
        if (user) {
            console.log('✅ User found:');
            console.log('  ID:', user._id);
            console.log('  Username:', user.username);
            console.log('  Email:', user.email);
            console.log('  Has password:', !!user.password);
            console.log('  Password hash length:', user.password ? user.password.length : 0);
            console.log('  Created:', user.createdAt);
            
            // Test password comparison
            console.log('\n🔐 Testing password comparison...');
            const testPassword = '.8CCqc]-*y>zQvD'; // The password from the logs
            
            try {
                const isMatch = await user.comparePassword(testPassword);
                console.log(`  Password match result: ${isMatch}`);
                
                if (!isMatch) {
                    console.log('❌ Password does not match - this explains the login failure');
                    console.log('💡 Possible issues:');
                    console.log('   - Password was changed since registration');
                    console.log('   - Password hash is corrupted');
                    console.log('   - User is trying wrong password');
                }
            } catch (compareError) {
                console.error('❌ Error comparing password:', compareError.message);
            }
            
        } else {
            console.log('❌ User NOT found with email:', email);
            console.log('💡 User needs to register first');
            
            // Check if any users exist
            const userCount = await User.countDocuments();
            console.log(`\n📊 Total users in database: ${userCount}`);
            
            if (userCount > 0) {
                console.log('📋 Existing users:');
                const allUsers = await User.find({}, 'email username createdAt').limit(5);
                allUsers.forEach(u => {
                    console.log(`  - ${u.email} (${u.username}) - Created: ${u.createdAt}`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

testUserAuth();