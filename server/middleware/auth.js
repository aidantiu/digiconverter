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

module.exports = { optionalAuth };
