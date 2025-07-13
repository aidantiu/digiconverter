// File: server/app.js
const { express, mongoose } = require('./utils/dependencies');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const conversionRoutes = require('./routes/conversions');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for getting real IP addresses
app.set('trust proxy', true);

// Middleware to handle CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversions', conversionRoutes);  
app.use('/api/upload', express.static('uploads')); // Serve static files from 'uploads' directory

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log('✅ MongoDB Connected');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error('❌ MongoDB connection failed:', err));