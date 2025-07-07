# Loader Component Usage Guide

The DigiConverter app now includes a reusable loader component system. Here's how to use them:

## Available Loader Components

### 1. **Loader** (Default/Main)
```jsx
import Loader from '../components/Loader';

// Basic usage
<Loader />

// With custom props
<Loader 
    size="large"           // small | medium | large | xlarge
    message="Processing..."
    fullScreen={true}      // Makes it a full-screen overlay
    color="blue"           // purple | blue | green | red | gray
    showMessage={false}    // Hide the message
/>
```

### 2. **DotsLoader** 
```jsx
import { DotsLoader } from '../components/Loader';

// Basic usage
<DotsLoader />

// With custom props
<DotsLoader 
    message="Loading data..."
    fullScreen={true}
/>
```

### 3. **PageLoader**
```jsx
import { PageLoader } from '../components/Loader';

// For full page loading states
<PageLoader 
    message="Loading page..."
    minHeight="min-h-96"  // Custom height
/>
```

### 4. **CardLoader**
```jsx
import { CardLoader } from '../components/Loader';

// For loading cards/skeleton loading
<CardLoader height="h-64" />
```

### 5. **ImageWithSpinner**
```jsx
import ImageWithSpinner from '../components/ImageWithSpinner';

// Basic usage
<ImageWithSpinner 
    src="/path/to/image.jpg"
    alt="Description"
/>

// With custom props
<ImageWithSpinner 
    src="/path/to/image.jpg"
    alt="Profile picture"
    className="w-32 h-32 rounded-full object-cover"
    containerClassName="border-2 border-gray-300"
    spinnerSize="large"          // small | medium | large
    onLoad={(event) => console.log('Image loaded')}
    onError={(error) => console.log('Image failed to load')}
/>
```

### 6. **ImageWithDotsLoader**
```jsx
import { ImageWithDotsLoader } from '../components/ImageWithSpinner';

// Uses the DotsLoader component for spinning
<ImageWithDotsLoader 
    src="/path/to/image.jpg"
    alt="Thumbnail"
    spinnerMessage="Loading thumbnail..."
/>
```

### 7. **ThumbnailWithSpinner**
```jsx
import { ThumbnailWithSpinner } from '../components/ImageWithSpinner';

// Perfect for thumbnails with preset styling
<ThumbnailWithSpinner 
    src="/path/to/thumbnail.jpg"
    alt="File thumbnail"
    size="medium"               // small | medium | large
/>

// Custom styling
<ThumbnailWithSpinner 
    src="/path/to/thumbnail.jpg"
    alt="Video thumbnail"
    size="large"
    className="border-4 border-purple-500"
    containerClassName="shadow-lg"
/>
```

## Usage Examples

### Page Loading State
```jsx
const MyPage = () => {
    const [loading, setLoading] = useState(true);
    
    if (loading) {
        return <PageLoader message="Loading your data..." />;
    }
    
    return <div>Your page content</div>;
};
```

### Full Screen Overlay
```jsx
const MyComponent = () => {
    const [processing, setProcessing] = useState(false);
    
    return (
        <div>
            {processing && (
                <Loader 
                    fullScreen={true}
                    message="Processing your request..."
                    size="large"
                />
            )}
            {/* Your component content */}
        </div>
    );
};
```

### Button Loading State
```jsx
<button disabled={loading} className="...">
    {loading ? (
        <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
        </div>
    ) : (
        'Submit'
    )}
</button>
```

### Card Grid with Skeleton Loading
```jsx
{loading ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
            <CardLoader key={i} />
        ))}
    </div>
) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map(item => <Card key={item.id} {...item} />)}
    </div>
)}
```

### Image Gallery with Loading Spinners
```jsx
const ImageGallery = ({ images }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
                <ThumbnailWithSpinner
                    key={index}
                    src={image.url}
                    alt={image.title}
                    size="medium"
                    className="hover:scale-105 transition-transform"
                />
            ))}
        </div>
    );
};
```

### Profile Picture with Loading State
```jsx
const ProfilePicture = ({ user }) => {
    return (
        <ImageWithSpinner
            src={user.profilePicture}
            alt={`${user.name}'s profile`}
            className="w-24 h-24 rounded-full object-cover"
            containerClassName="border-4 border-white shadow-lg"
            spinnerSize="medium"
            onError={() => console.log('Profile picture failed to load')}
        />
    );
};
```

### File Preview with Custom Spinner
```jsx
const FilePreview = ({ fileUrl, fileName }) => {
    return (
        <ImageWithDotsLoader
            src={fileUrl}
            alt={fileName}
            className="w-full h-auto max-w-md rounded-lg"
            containerClassName="border-2 border-gray-300 shadow-sm"
            spinnerMessage="Loading preview..."
        />
    );
};
```

## Implementation in Current Pages

- **HistoryPage**: Uses `PageLoader` for initial loading and `ThumbnailWithSpinner` for conversion thumbnails
- **FileUpload**: Uses `DotsLoader` for thumbnail generation, `ImageWithSpinner` for file previews, and inline loader for upload button
- Available for use in LoginPage, HomePage, and any other components that need loading states

## Component Features

### ImageWithSpinner Features:
- **Automatic loading state management** - Shows spinner while image loads
- **Error handling** - Displays fallback UI when image fails to load
- **Customizable spinners** - Use default spinner or provide your own
- **Event callbacks** - onLoad and onError handlers
- **Flexible styling** - Custom classes for both image and container
- **Smooth transitions** - Fade-in effect when image loads

### ThumbnailWithSpinner Features:
- **Preset sizes** - small (64px), medium (96px), large (128px)
- **Optimized for thumbnails** - Rounded corners and proper aspect ratio
- **Responsive design** - Works well in grids and flexbox layouts
- **Border styling** - Built-in border and overflow handling

## Styling Notes

- All loaders use Tailwind CSS classes
- Color schemes match the app's purple theme
- Full-screen loaders include backdrop blur effect
- Loaders are responsive and work on all screen sizes
