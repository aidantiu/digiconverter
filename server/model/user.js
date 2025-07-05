// Import from dependencies
const { mongoose, bcrypt } = require('../utils/dependencies');

// Define User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
    },
    // TO BE IMPLEMENTED
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows for unique constraint to be applied only when googleId is present
    }, 
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Create User Model
module.exports = mongoose.model('User', userSchema);