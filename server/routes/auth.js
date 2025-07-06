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

        res.status(201).json({ message: 'User registered successfully' });

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

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Google OAuth functionality has been temporarily removed
// Only email/password authentication is available

module.exports = router;
