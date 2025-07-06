// Test conversion model validation
const mongoose = require('mongoose');
require('dotenv').config();

const { Conversion } = require('../model/models');

async function testConversionModel() {
    try {
        console.log('Testing Conversion model...');
        
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database');
        
        // Test creating a conversion without convertedFileName
        const testConversion = new Conversion({
            originalFileName: 'test.jpg',
            originalFormat: 'jpg',
            targetFormat: 'png',
            fileSize: 12345,
            ipAddress: '127.0.0.1',
            status: 'processing'
        });
        
        // Try to save it
        const saved = await testConversion.save();
        console.log('✅ Conversion saved successfully:', saved._id);
        
        // Update with convertedFileName
        saved.convertedFileName = 'converted_test.png';
        saved.status = 'completed';
        await saved.save();
        console.log('✅ Conversion updated successfully');
        
        // Clean up
        await Conversion.findByIdAndDelete(saved._id);
        console.log('✅ Test conversion deleted');
        
        await mongoose.connection.close();
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConversionModel();
