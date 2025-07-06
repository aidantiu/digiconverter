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

## Implementation in Current Pages

- **HistoryPage**: Uses `PageLoader` for initial loading
- **FileUpload**: Uses `DotsLoader` for thumbnail generation and inline loader for upload button
- Available for use in LoginPage, HomePage, and any other components that need loading states

## Styling Notes

- All loaders use Tailwind CSS classes
- Color schemes match the app's purple theme
- Full-screen loaders include backdrop blur effect
- Loaders are responsive and work on all screen sizes
