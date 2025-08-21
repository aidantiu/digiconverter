const { body, param, validationResult } = require('express-validator');
const SecurityLogger = require('../utils/securityLogger');
const mongoose = require('mongoose');

// Validation middleware
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        SecurityLogger.logSuspiciousActivity(`Invalid input: ${JSON.stringify(errors.array())}`, req);
        return res.status(400).json({
            message: 'Invalid input data',
            errors: errors.array()
        });
    }
    next();
};

// IP address validation - Enhanced to handle IPv6-mapped IPv4 addresses
const validateIP = (ip) => {
    if (!ip) return false;
    
    // Handle IPv6-mapped IPv4 addresses (common in Node.js)
    if (ip.startsWith('::ffff:')) {
        const ipv4Part = ip.substring(7); // Remove '::ffff:' prefix
        const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        return ipv4Regex.test(ipv4Part);
    }
    
    // Standard IPv4 validation
    const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipv4Regex.test(ip)) return true;
    
    // Standard IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;
    
    // Handle localhost variations
    const localhostVariations = ['localhost', '127.0.0.1', '::1'];
    if (localhostVariations.includes(ip)) return true;
    
    return false;
};

// Sanitize MongoDB ObjectId
const sanitizeObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id) ? id : null;
};

// Validation rules
const authValidation = {
    register: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .escape()
            .isLength({ max: 100 })
            .withMessage('Valid email required (max 100 characters)'),
        body('password')
            .isLength({ min: 8, max: 128 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must be 8-128 characters with uppercase, lowercase, number, and special character'),
        body('username')  // Changed from 'name' to 'username'
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[a-zA-Z0-9_]+$/)  // Allow letters, numbers, underscores for usernames
            .escape()
            .withMessage('Username must be 2-50 characters, letters, numbers, and underscores only')
    ],
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .escape()
            .isLength({ max: 100 })
            .withMessage('Valid email required'),
        body('password')
            .notEmpty()
            .isLength({ max: 128 })
            .escape()
            .withMessage('Password required')
    ]
};

const conversionValidation = {
    uploadParams: [
        body('targetFormat')
            .isIn(['mp4', 'avi', 'mov', 'webm', 'mpg', 'mpeg', 'jpg', 'jpeg', 'png', 'gif', 'webp'])
            .escape()
            .withMessage('Invalid target format')
    ],
    downloadParams: [
        param('conversionId')
            .custom((value) => {
                if (!mongoose.Types.ObjectId.isValid(value)) {
                    throw new Error('Invalid conversion ID');
                }
                return true;
            })
            .escape()
    ],
    statusParams: [
        param('conversionId')
            .custom((value) => {
                if (!mongoose.Types.ObjectId.isValid(value)) {
                    throw new Error('Invalid conversion ID');
                }
                return true;
            })
            .escape()
    ]
};

module.exports = {
    validateInput,
    validateIP,
    sanitizeObjectId,
    authValidation,
    conversionValidation
};