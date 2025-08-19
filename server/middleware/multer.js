// Middleware for handling file uploads using Multer with Cloudinary
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine if it's an image or video
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    return {
      folder: isImage ? 'digiconverter/images' : 'digiconverter/videos',
      allowed_formats: isImage 
        ? ['jpg', 'jpeg', 'png', 'webp'] 
        : ['mp4', 'mov', 'webm', 'mpg', 'mpeg'],
      resource_type: isImage ? 'image' : 'video',
      // Generate unique filename with timestamp
      public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
    };
  },
});

// Create multer upload instance
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only JPEG, PNG, WEBP images and MP4, MOV, WEBM, MPG videos
    const allowedMimeTypes = [
      // Image MIME types
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      // Video MIME types
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
      // Additional common MIME types for MOV files
      'application/octet-stream'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      console.log(`✅ File accepted: ${file.originalname} (${file.mimetype})`);
      return cb(null, true);
    } else {
      console.log(`❌ File rejected: ${file.originalname} (${file.mimetype})`);
      cb(new Error('Only supported image and video files are allowed. Supported image formats: JPEG, PNG, WebP. Supported video formats: MP4, MOV, WebM, MPG'));
    }
  }
});

module.exports = upload;