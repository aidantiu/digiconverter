# File Processing Architecture

## Overview
The file conversion system has been refactored into a modular architecture to improve maintainability and separation of concerns.

## File Structure

```
server/
├── routes/
│   └── conversions.js          # Main route handlers (shortened)
└── utils/
    ├── conversionProcessor.js  # Main conversion orchestrator
    ├── imageProcessor.js       # Image processing with Sharp
    └── videoProcessor.js       # Video processing with FFmpeg
```

## Modules

### 1. `conversionProcessor.js`
**Main conversion orchestrator that routes to appropriate processor**

**Functions:**
- `convertFile(file, targetFormat, conversionId)` - Main entry point for conversions
- `isImageFile(filename)` - Check if file is an image
- `isVideoFile(filename)` - Check if file is a video
- `isValidImageFormat(format)` - Validate image target format
- `isValidVideoFormat(format)` - Validate video target format

### 2. `imageProcessor.js`
**Handles all image processing using Sharp library**

**Functions:**
- `processImageConversion(file, targetFormat, conversionId)` - Convert images
- `isValidImageFormat(targetFormat)` - Validate image formats
- `isImageFile(filename)` - Check if file is an image

**Features:**
- 5-minute timeout protection
- Progress tracking (10% → 100%)
- Sharp library with timeout configuration
- Automatic cleanup of original files
- Database status updates on failure

**Supported Formats:** JPEG, JPG, PNG, WebP, GIF, BMP, TIFF

### 3. `videoProcessor.js`
**Handles all video processing using FFmpeg**

**Functions:**
- `processVideoConversion(file, targetFormat, conversionId)` - Convert videos
- `generateVideoThumbnail(videoPath, conversionId)` - Generate video thumbnails
- `isValidVideoFormat(targetFormat)` - Validate video formats
- `isVideoFile(filename)` - Check if file is a video

**Features:**
- FFmpeg auto-detection (Windows paths)
- Real-time progress tracking
- Thumbnail generation (320x240, 1-second mark)
- Automatic cleanup of original files
- Database status updates on failure

**Supported Formats:** MP4, AVI, MOV, WMV, FLV, MKV, WebM, MPEG, MPG

## Benefits of Modular Structure

### ✅ **Maintainability**
- Each processor focuses on a single responsibility
- Easier to debug and test individual components
- Clear separation between image and video logic

### ✅ **Scalability**
- Easy to add new file types (audio, documents, etc.)
- Processors can be enhanced independently
- Can be moved to separate microservices if needed

### ✅ **Reusability**
- Processors can be used by other parts of the application
- Thumbnail generation is now a standalone utility
- Format validation is centralized

### ✅ **Error Handling**
- Specific error handling for each file type
- Better timeout management per processor
- Consistent database status updates

## Usage Examples

### Converting a file
```javascript
const { convertFile } = require('../utils/conversionProcessor');

try {
    const result = await convertFile(uploadedFile, 'png', conversionId);
    console.log('Conversion completed:', result);
} catch (error) {
    console.error('Conversion failed:', error.message);
}
```

### Generating video thumbnail
```javascript
const { generateVideoThumbnail } = require('../utils/videoProcessor');

try {
    const thumbnailPath = await generateVideoThumbnail(videoPath, conversionId);
    res.sendFile(thumbnailPath);
} catch (error) {
    res.status(500).json({ message: 'Thumbnail generation failed' });
}
```

## Migration Notes

The refactoring maintains 100% API compatibility:
- All existing endpoints work exactly the same
- No changes required to frontend code
- Same error messages and status codes
- Same progress tracking behavior

The main `conversions.js` file is now ~400 lines shorter and focuses purely on HTTP request/response handling rather than file processing logic.
