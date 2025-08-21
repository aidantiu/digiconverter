// Import centralized dependencies
const { express, jwt, bcrypt } = require('../utils/dependencies');
require('dotenv').config();

// Import user model
const { User } = require('../model/models');

// Import security utilities
const SecurityLogger = require('../utils/securityLogger');
const { authValidation, validateInput } = require('../middleware/validation');

// Initialize router
const router = express.Router();

// Register User
// This endpoint is for users who want to register with username, email, and password
router.post('/register', authValidation.register, validateInput, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            SecurityLogger.logAuthAttempt(false, email, req);
            SecurityLogger.logSuspiciousActivity(`Registration attempt with existing credentials: ${email}`, req);
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Create new user
        const newUser = new User({ username, email, password });
        await newUser.save();

        // Generate token with secure settings
        const token = jwt.sign(
            { id: newUser._id }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: '7d',
                algorithm: 'HS256'
            }
        );
        
        SecurityLogger.logAuthAttempt(true, email, req);
        SecurityLogger.logSecurityEvent('USER_REGISTRATION', {
            userId: newUser._id,
            email: email,
            username: username
        }, req);
        
        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Registration error: ${error.message}`, req);
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login User
// This endpoint is for users who registered with email and password
router.post('/login', authValidation.login, validateInput, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            SecurityLogger.logAuthAttempt(false, email, req);
            SecurityLogger.logSuspiciousActivity(`Login attempt with non-existent email: ${email}`, req);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password) {
            SecurityLogger.logAuthAttempt(false, email, req);
            SecurityLogger.logSuspiciousActivity(`Login attempt on Google-only account: ${email}`, req);
            return res.status(400).json({ message: 'This account uses Google login' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            SecurityLogger.logAuthAttempt(false, email, req);
            SecurityLogger.logSuspiciousActivity(`Failed login attempt with incorrect password: ${email}`, req);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate secure token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: '7d',
                algorithm: 'HS256'
            }
        );
        
        SecurityLogger.logAuthAttempt(true, email, req);
        SecurityLogger.logSecurityEvent('USER_LOGIN', {
            userId: user._id,
            email: email
        }, req);
        
        res.status(200).json({ 
            message: 'Login successful', 
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Login error: ${error.message}`, req);
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Validate token endpoint with enhanced security
router.get('/validate', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (!token || !authHeader?.startsWith('Bearer ')) {
            SecurityLogger.logSuspiciousActivity('Token validation attempt without proper Bearer token', req);
            return res.status(401).json({ valid: false, message: 'No valid token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            const user = await User.findById(decoded.id);
            
            if (!user) {
                SecurityLogger.logSuspiciousActivity(`Token validation with non-existent user ID: ${decoded.id}`, req);
                return res.status(401).json({ valid: false, message: 'User not found' });
            }

            SecurityLogger.logSecurityEvent('TOKEN_VALIDATION_SUCCESS', {
                userId: user._id,
                email: user.email
            }, req);

            res.status(200).json({ 
                valid: true, 
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt
                }
            });
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                SecurityLogger.logSecurityEvent('TOKEN_EXPIRED', { error: jwtError.message }, req);
                return res.status(401).json({ valid: false, message: 'Token expired', expired: true });
            } else if (jwtError.name === 'JsonWebTokenError') {
                SecurityLogger.logSuspiciousActivity(`Invalid JWT token: ${jwtError.message}`, req);
                return res.status(401).json({ valid: false, message: 'Invalid token' });
            } else {
                throw jwtError;
            }
        }
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Token validation error: ${error.message}`, req);
        console.error('Error validating token:', error);
        res.status(500).json({ valid: false, message: 'Server error during validation' });
    }
});

// Logout endpoint (for logging purposes)
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
                SecurityLogger.logSecurityEvent('USER_LOGOUT', {
                    userId: decoded.id
                }, req);
            } catch (jwtError) {
                // Token might be expired or invalid, but still log the logout attempt
                SecurityLogger.logSecurityEvent('LOGOUT_ATTEMPT', {
                    tokenStatus: 'invalid_or_expired'
                }, req);
            }
        }
        
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(`Logout error: ${error.message}`, req);
        res.status(500).json({ message: 'Server error during logout' });
    }
});

module.exports = router;
