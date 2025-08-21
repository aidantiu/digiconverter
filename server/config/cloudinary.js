// Require the cloudinary library
const cloudinary = require('cloudinary').v2;

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
  // Get cloudinary credentials from environment variables
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Configure for large file uploads
  chunk_size: 6000000, // 6MB chunks for uploading large files
  timeout: 120000, // 2 minutes timeout for large uploads
});

// Log the configuration
console.log('Cloudinary configured for cloud:', cloudinary.config().cloud_name);

module.exports = cloudinary;

