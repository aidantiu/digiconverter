// Import centralized dependencies
const { express, jwt, bcrypt } = require('../utils/dependencies');
require('dotenv').config();

// Import user model
const { User } = require('../model/models');

// Initialize router
const router = express.Router();

// Register User
// This endpoint is for users who want to register with username, email, and password
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        // Generate token and return user data for automatic login
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
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
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Login User
// This endpoint is for users who registered with email and password
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'This account uses Google login' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Extend token expiration to 7 days for better user experience
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Validate token endpoint
router.get('/validate', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ valid: false, message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({ valid: false, message: 'User not found' });
            }

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
                return res.status(401).json({ valid: false, message: 'Token expired', expired: true });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ valid: false, message: 'Invalid token' });
            } else {
                throw jwtError;
            }
        }
    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
});

// Google OAuth functionality has been temporarily removed
// Only email/password authentication is available

module.exports = router;
