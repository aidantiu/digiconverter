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
});

// Index for efficient queries
conversionSchema.index({ ipAddress: 1, createdAt: -1 });
conversionSchema.index({ userId: 1, createdAt: -1 });

// Create Conversion Model
module.exports = mongoose.model('Conversion', conversionSchema);
