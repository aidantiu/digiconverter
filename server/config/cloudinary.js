// Require the cloudinary library
const cloudinary = require('cloudinary').v2;

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
  // Get cloudinary credentials from environment variables
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log the configuration
console.log('Cloudinary configured for cloud:', cloudinary.config().cloud_name);

module.exports = cloudinary;

