// Optional authentication middleware
const jwt = require('jsonwebtoken');
const { User } = require('../model/models');

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (user) {
                    req.user = user;
                }
            } catch (error) {
                // Invalid token, continue as anonymous user
                console.log('Invalid token provided, continuing as anonymous');
            }
        }
        
        next();
    } catch (error) {
        console.error('Error in optional auth middleware:', error);
        next(); // Continue even if there's an error
    }
};

// Required authentication middleware
const requireAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({ message: 'Access denied. User not found.' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Access denied. Invalid token.' });
        }
    } catch (error) {
        console.error('Error in required auth middleware:', error);
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = { optionalAuth, requireAuth };
