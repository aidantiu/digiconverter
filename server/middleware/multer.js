// Middleware for handling file uploads using Multer with Cloudinary
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const SecurityLogger = require('../utils/securityLogger');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const { Readable } = require('stream');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// Helper function to convert MPG to MP4 before Cloudinary upload
const convertMpgToMp4Buffer = async (fileBuffer, originalName) => {
    return new Promise(async (resolve, reject) => {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempId = uuidv4();
        const inputExt = path.extname(originalName);
        const tempInputPath = path.join(tempDir, `temp_mpg_input_${tempId}${inputExt}`);
        const tempOutputPath = path.join(tempDir, `temp_mp4_output_${tempId}.mp4`);
        
        try {
            console.log(`🎬 Converting MPG to MP4 before Cloudinary upload: ${originalName}`);
            
            // Write MPG buffer to temporary file
            await writeFile(tempInputPath, fileBuffer);
            
            // Convert using FFmpeg
            ffmpeg(tempInputPath)
                .toFormat('mp4')
                .videoCodec('libx264')
                .audioCodec('aac')
                .on('start', (commandLine) => {
                    console.log(`🎬 FFmpeg started for pre-upload conversion: ${originalName}`);
                })
                .on('end', async () => {
                    try {
                        console.log(`✅ MPG to MP4 conversion completed for: ${originalName}`);
                        const mp4Buffer = await readFile(tempOutputPath);
                        
                        // Clean up temporary files
                        await Promise.all([
                            unlink(tempInputPath).catch(() => {}),
                            unlink(tempOutputPath).catch(() => {})
                        ]);
                        
                        resolve({
                            buffer: mp4Buffer,
                            originalname: originalName.replace(/\.(mpg|mpeg)$/i, '.mp4'),
                            mimetype: 'video/mp4'
                        });
                    } catch (error) {
                        await Promise.all([
                            unlink(tempInputPath).catch(() => {}),
                            unlink(tempOutputPath).catch(() => {})
                        ]);
                        reject(error);
                    }
                })
                .on('error', async (error) => {
                    console.error(`❌ FFmpeg error during pre-upload conversion:`, error);
                    await Promise.all([
                        unlink(tempInputPath).catch(() => {}),
                        unlink(tempOutputPath).catch(() => {})
                    ]);
                    reject(error);
                })
                .save(tempOutputPath);
                
        } catch (error) {
            await Promise.all([
                unlink(tempInputPath).catch(() => {}),
                unlink(tempOutputPath).catch(() => {})
            ]);
            reject(error);
        }
    });
};

// Custom storage engine that converts MPG to MP4 before uploading to Cloudinary
class MPGConvertingCloudinaryStorage {
    constructor(options) {
        this.cloudinary = options.cloudinary;
        this.params = options.params;
    }

    _handleFile(req, file, cb) {
        const isImage = file.mimetype.startsWith('image/');
        const isMpg = ['.mpg', '.mpeg'].includes(path.extname(file.originalname).toLowerCase()) || 
                      file.mimetype === 'video/mpeg';
        
        if (isMpg) {
            // Handle MPG files - convert to MP4 first
            this._handleMpgFile(req, file, cb);
        } else {
            // Handle other files normally with CloudinaryStorage
            this._handleNormalFile(req, file, cb);
        }
    }

    _handleMpgFile(req, file, cb) {
        const chunks = [];
        
        file.stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        
        file.stream.on('end', async () => {
            try {
                const fileBuffer = Buffer.concat(chunks);
                console.log(`🎬 Processing MPG file: ${file.originalname}`);
                
                // Convert MPG to MP4
                const convertedFile = await convertMpgToMp4Buffer(fileBuffer, file.originalname);
                
                // Create a stream from the converted MP4 buffer
                const mp4Stream = Readable.from(convertedFile.buffer);
                
                // Upload the converted MP4 to Cloudinary
                const uploadStream = this.cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video',
                        folder: 'digiconverter/videos',
                        allowed_formats: ['mp4'],
                        public_id: `${Date.now()}_${path.parse(file.originalname).name}_converted`,
                        format: 'mp4',
                        chunk_size: 6000000,
                        eager_async: true,
                        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
                    },
                    (error, result) => {
                        if (error) {
                            console.error('❌ Cloudinary upload error for converted MP4:', error);
                            return cb(error);
                        }
                        
                        console.log(`✅ Converted MP4 uploaded to Cloudinary: ${result.secure_url}`);
                        cb(null, {
                            path: result.secure_url,
                            filename: result.public_id,
                            originalname: convertedFile.originalname,
                            mimetype: 'video/mp4',
                            size: convertedFile.buffer.length
                        });
                    }
                );
                
                mp4Stream.pipe(uploadStream);
                
            } catch (error) {
                console.error('❌ Error converting MPG file:', error);
                cb(error);
            }
        });
        
        file.stream.on('error', cb);
    }

    _handleNormalFile(req, file, cb) {
        // Use standard Cloudinary upload for non-MPG files
        const isImage = file.mimetype.startsWith('image/');
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
        
        const uploadStream = this.cloudinary.uploader.upload_stream(
            {
                folder: isImage ? 'digiconverter/images' : 'digiconverter/videos',
                allowed_formats: isImage 
                    ? ['jpg', 'jpeg', 'png', 'webp'] 
                    : ['mp4', 'mov', 'webm'],
                resource_type: isImage ? 'image' : 'video',
                public_id: `${Date.now()}_${sanitizedName.split('.')[0]}`,
                chunk_size: 6000000,
                eager_async: true,
                transformation: isImage ? 
                    [{ quality: 'auto', fetch_format: 'auto', width: 4000, height: 4000, crop: 'limit' }] : 
                    [{ quality: 'auto', fetch_format: 'auto' }]
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    return cb(error);
                }
                
                console.log(`✅ File uploaded to Cloudinary: ${result.secure_url}`);
                cb(null, {
                    path: result.secure_url,
                    filename: result.public_id,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: result.bytes || 0
                });
            }
        );
        
        file.stream.pipe(uploadStream);
    }

    _removeFile(req, file, cb) {
        // Cloudinary files are managed by Cloudinary, nothing to remove locally
        cb();
    }
}

// Enhanced file validation with security checks
const fileFilter = (req, file, cb) => {
    try {
        // Define allowed MIME types
        const allowedMimeTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            // Videos
            'video/mp4', 'video/mov', 'video/webm', 'video/mpeg', 'video/mpg',
            // Additional MPEG variants that browsers might send
            'video/x-mpeg', 'application/mpeg'
        ];
        
        // Log the incoming file for debugging
        console.log(`🔍 File filter debug:`);
        console.log(`   - Original name: ${file.originalname}`);
        console.log(`   - MIME type: ${file.mimetype}`);
        console.log(`   - Extension: ${path.extname(file.originalname).toLowerCase()}`);
        
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
            console.log(`❌ MIME type rejected: ${file.mimetype}`);
            SecurityLogger.logSuspiciousActivity(`Invalid MIME type upload attempt: ${file.mimetype}`, req);
            return cb(new Error('Invalid file type. Only supported images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM, MPG/MPEG) are allowed.'), false);
        }
        
        // Check file extension (double-check against MIME type spoofing)
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm', '.mpg', '.mpeg'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            console.log(`❌ Extension rejected: ${fileExtension}`);
            SecurityLogger.logSuspiciousActivity(`Invalid file extension upload attempt: ${fileExtension}`, req);
            return cb(new Error('Invalid file extension.'), false);
        }
        
        console.log(`✅ File passed validation: ${file.originalname}`);
        
        // Additional security: Check for executable files disguised as media
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs', '.jar', '.php', '.asp', '.jsp'];
        const dangerousPatterns = ['<?php', '<script', '#!/bin/', 'exec(', 'system(', 'shell_exec'];
        
        if (dangerousExtensions.some(ext => file.originalname.toLowerCase().includes(ext))) {
            SecurityLogger.logSuspiciousActivity(`Dangerous file extension detected: ${file.originalname}`, req);
            return cb(new Error('Potentially dangerous file detected.'), false);
        }
        
        // Check for suspicious filenames
        if (dangerousPatterns.some(pattern => file.originalname.toLowerCase().includes(pattern.toLowerCase()))) {
            SecurityLogger.logSuspiciousActivity(`Suspicious file content pattern detected: ${file.originalname}`, req);
            return cb(new Error('File rejected for security reasons.'), false);
        }
        
        // Sanitize filename
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        file.originalname = sanitizedName;
        
        SecurityLogger.logFileUpload(file.originalname, file.size, file.mimetype, req);
        cb(null, true);
        
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`File filter error: ${error.message}`, req);
        cb(new Error('File validation failed'), false);
    }
};

// Create storage instance
const storage = new MPGConvertingCloudinaryStorage({
    cloudinary: cloudinary
});

// Create multer upload instance with enhanced security
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 1, // Only allow 1 file per upload
    fieldSize: 1024 * 1024, // 1MB field size limit
    fields: 10, // Limit number of fields
    headerPairs: 2000 // Limit header pairs
  },
  fileFilter: fileFilter
});

// Enhanced error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = 'Upload error';
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size too large. Maximum size is 500MB.';
                SecurityLogger.logSuspiciousActivity(`File size limit exceeded: ${err.message}`, req);
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files. Only 1 file allowed per upload.';
                SecurityLogger.logSuspiciousActivity(`File count limit exceeded: ${err.message}`, req);
                break;
            case 'LIMIT_FIELD_COUNT':
                message = 'Too many fields in request.';
                SecurityLogger.logSuspiciousActivity(`Field count limit exceeded: ${err.message}`, req);
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field.';
                SecurityLogger.logSuspiciousActivity(`Unexpected file field: ${err.message}`, req);
                break;
            default:
                SecurityLogger.logSuspiciousActivity(`Multer error: ${err.message}`, req);
        }
        
        return res.status(400).json({ message });
    }
    
    if (err.message.includes('Invalid file type') || 
        err.message.includes('Invalid file extension') ||
        err.message.includes('dangerous file') ||
        err.message.includes('security reasons') ||
        err.message.includes('FFmpeg')) {
        return res.status(400).json({ message: err.message });
    }
    
    SecurityLogger.logSuspiciousActivity(`Upload error: ${err.message}`, req);
    next(err);
};

module.exports = { upload, handleUploadError };