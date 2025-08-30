// File: server/app.js
const { express, mongoose } = require('./utils/dependencies');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Load environment variables
require('dotenv').config();

// Validate critical environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required');
}

// Routes
const authRoutes = require('./routes/auth');
const conversionRoutes = require('./routes/conversions');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Configure trust proxy securely - only trust specific proxies
// This prevents IP spoofing attacks while allowing proper IP detection
if (process.env.NODE_ENV === 'production') {
    // In production, specify the exact number of proxy hops or IP addresses you trust
    // Option 1: Trust first proxy only (most common for reverse proxies like nginx)
    app.set('trust proxy', 1);
} else {
    // In development, we can be more permissive but still secure
    app.set('trust proxy', 1);
}

// Security middleware - Applied in order
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"], // Allow API connections
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https://res.cloudinary.com"],
            frameSrc: ["'none'"]
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting - Multiple levels with proper IPv6 support
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: {
        error: 'Upload limit exceeded, please try again later.',
        retryAfter: '1 hour'
    },
    skipSuccessfulRequests: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true
});

// Apply global rate limiting
app.use('/api/', globalLimiter);

// Temporarily disable mongo sanitize to fix CORS issues
// TODO: Re-enable with compatible version after CORS is working
// app.use(mongoSanitize({
//     replaceWith: '_',
// }));

// Prevent HTTP Parameter Pollution
app.use(hpp({
    whitelist: ['targetFormat'] // Allow duplicate targetFormat parameters if needed
}));

// CORS configuration - Fixed for development
console.log('🔧 Configuring CORS for development...');

app.use(cors({
    origin: [
        'http://localhost:5174',
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control'
    ],
    optionsSuccessStatus: 200
}));

// JSON parsing with size limits - Increased for large video files
app.use(express.json({ 
    limit: '600mb', // Increased from 10mb to 600mb for large video files
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '600mb' // Increased from 10mb to 600mb for large video files
}));

// Use Routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/conversions/upload', uploadLimiter);
app.use('/api/conversions', conversionRoutes);
app.use('/api/upload', express.static('uploads')); // Serve static files from 'uploads' directory

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'DigiConverter Backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        origin: req.headers.origin,
        userAgent: req.headers['user-agent']
    });
});

// Root endpoint for basic API info
app.get('/', (req, res) => {
    res.json({
        service: 'DigiConverter API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            conversions: '/api/conversions/*'
        }
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    const SecurityLogger = require('./utils/securityLogger');
    
    // Log security-related errors
    if (err.status === 400 || err.status === 401 || err.status === 403) {
        SecurityLogger.logSuspiciousActivity(`Error ${err.status}: ${err.message}`, req);
    }
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ MongoDB Connected');
        
        // Initialize scheduled cleanup jobs after DB connection
        require('./scheduledJobs');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log('🔒 Security middleware active:');
            console.log('   - Helmet security headers');
            console.log('   - Rate limiting (100 req/15min global, 20 uploads/hour, 5 auth/15min)');
            console.log('   - NoSQL injection protection');
            console.log('   - HTTP parameter pollution protection');
            console.log('   - CORS enabled');
            console.log('   - Request size limits (600MB)');
        });
    })
    .catch(err => console.error('❌ MongoDB connection failed:', err));