# DigiConverter

A modern file conversion service that supports images and videos with both authenticated and anonymous user support.

## Features

### For All Users (Anonymous & Registered)
- **Image Conversion**: Convert between JPEG, PNG, GIF, WebP, BMP, TIFF formats
- **Video Conversion**: Convert between MP4, AVI, MOV, WMV, FLV, MKV, WebM formats
- **Real-time Status**: Track conversion progress and status
- **Download History**: View recent conversions

### Anonymous Users
- **3 Free Uploads per Day**: Upload and convert up to 3 files per 24-hour period
- **IP-based Tracking**: Upload limits tracked by IP address
- **24-hour File Retention**: Converted files automatically deleted after 24 hours

### Registered Users
- **Unlimited Uploads**: No daily upload restrictions
- **Extended File Retention**: Keep files longer
- **Conversion History**: Track all your conversions
- **Google OAuth Support**: Easy login with Google account

## API Endpoints

### Upload & Conversion
- `POST /api/conversions/upload` - Upload and convert file
- `GET /api/conversions/status/:id` - Check conversion status
- `GET /api/conversions/download/:id` - Download converted file
- `GET /api/conversions/limits` - Check upload limits for anonymous users

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### History & Management
- `GET /api/conversions/history` - Get conversion history
- `DELETE /api/conversions/cleanup` - Cleanup expired files (admin)

## Installation

### Server Setup
1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
MONGO_URI=mongodb://localhost:27017/digiconverter
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
```

5. Start the server:
```bash
npm run dev
```

### Client Setup
1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Important Setup Notes

### FFmpeg for Video Conversion
Video conversion requires FFmpeg to be installed on your system. See [FFMPEG_SETUP.md](FFMPEG_SETUP.md) for installation instructions.

**Current Status:**
- ✅ **Image Conversion**: Fully functional (JPEG, PNG, WebP, GIF, BMP, TIFF)
- ⚠️ **Video Conversion**: Requires FFmpeg installation

The application works perfectly for image conversion without any additional setup!

## File Upload Limits

- **File Size**: Maximum 100MB per file
- **Anonymous Users**: 3 uploads per 24 hours per IP address
- **Registered Users**: Unlimited uploads
- **Supported Formats**: 
  - Images: JPEG, JPG, PNG, GIF, WebP, BMP, TIFF
  - Videos: MP4, AVI, MOV, WMV, FLV, MKV, WebM

## Technical Details

### Backend Stack
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Multer** for file uploads
- **Sharp** for image processing
- **FFmpeg** for video conversion
- **JWT** for authentication
- **Passport** for Google OAuth

### File Processing
- Images processed with Sharp library
- Videos processed with FFmpeg
- Automatic cleanup of temporary and expired files
- IP-based rate limiting for anonymous users

### Security Features
- File type validation
- File size limits
- Rate limiting for anonymous users
- JWT token authentication
- Secure file storage

## Development

### Project Structure
```
server/
├── app.js                 # Main application file
├── middleware/
│   ├── auth.js           # Authentication middleware
│   └── uploadLimit.js    # Upload limit middleware
├── model/
│   ├── user.js           # User model
│   ├── conversion.js     # Conversion model
│   └── models.js         # Model exports
├── routes/
│   ├── auth.js           # Authentication routes
│   └── conversions.js    # File conversion routes
├── utils/
│   ├── dependencies.js   # Common dependencies
│   └── passport.js       # Passport configuration
├── uploads/              # Temporary upload storage
└── processed/            # Converted file storage

client/
├── src/
│   ├── App.jsx           # Main React component
│   └── components/       # React components
└── public/               # Static assets
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
