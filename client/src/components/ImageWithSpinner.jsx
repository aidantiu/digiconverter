import React, { useState, useEffect } from 'react';
import { DotsLoader } from './Loader';
import { fetchImageWithCache } from '../utils/cache';

/**
 * A reusable component that displays a spinner while an image is loading
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.className - CSS classes for the image
 * @param {string} props.containerClassName - CSS classes for the container
 * @param {React.ReactNode} props.spinner - Custom spinner component (optional)
 * @param {string} props.spinnerSize - Size of the default spinner ('small', 'medium', 'large')
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @param {Object} props.style - Inline styles for the image
 * @param {Object} props.containerStyle - Inline styles for the container
 */
const ImageWithSpinner = ({
    src,
    alt = 'Loading image',
    className = '',
    containerClassName = '',
    spinner = null,
    spinnerSize = 'medium',
    onLoad = null,
    onError = null,
    style = {},
    containerStyle = {},
    useCache = true, // New prop to enable/disable caching
    ...imageProps
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [showSpinner, setShowSpinner] = useState(true);
    const [cachedSrc, setCachedSrc] = useState(null);

    const handleImageLoad = (event) => {
        setIsLoading(false);
        setHasError(false);
        // Add a small delay to ensure spinner is visible for local files
        setTimeout(() => {
            setShowSpinner(false);
        }, 100);
        if (onLoad) {
            onLoad(event);
        }
    };

    const handleImageError = (event) => {
        setIsLoading(false);
        setHasError(true);
        setShowSpinner(false);
        if (onError) {
            onError(event);
        }
    };

    // Reset loading state when src changes and handle caching
    useEffect(() => {
        if (src) {
            setIsLoading(true);
            setHasError(false);
            setShowSpinner(true);
            setCachedSrc(null);
            
            // If caching is enabled and this looks like an API URL, fetch with cache
            if (useCache && (src.includes('/thumbnail/') || src.includes('/api/'))) {
                fetchImageWithCache(src)
                    .then(cachedUrl => {
                        setCachedSrc(cachedUrl);
                    })
                    .catch(error => {
                        console.warn('Cache fetch failed, falling back to direct loading:', error);
                        setCachedSrc(src); // Fallback to original src
                    });
            } else {
                setCachedSrc(src);
            }
        } else {
            setIsLoading(false);
            setHasError(true);
            setShowSpinner(false);
            setCachedSrc(null);
        }
    }, [src, useCache]);

    // Don't render anything if no src is provided
    if (!src) {
        return (
            <div 
                className={`relative inline-block ${containerClassName}`}
                style={containerStyle}
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                    <div className="text-center text-gray-500">
                        <div className="text-2xl mb-2">📷</div>
                        <div className="text-sm">No image available</div>
                    </div>
                </div>
            </div>
        );
    }

    // Spinner size configurations
    const spinnerSizes = {
        small: 'w-6 h-6',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    // Default spinner component
    const defaultSpinner = (
        <div className={`flex items-center justify-center ${spinnerSizes[spinnerSize] || spinnerSizes.medium}`}>
            <div className="animate-spin rounded-full h-full w-full border-2 border-gray-300 border-t-purple-600"></div>
        </div>
    );

    // Use custom spinner or default
    const spinnerComponent = spinner || defaultSpinner;

    return (
        <div 
            className={`relative inline-block ${containerClassName}`}
            style={containerStyle}
        >
            {/* Spinner overlay - shown while loading */}
            {showSpinner && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                    {spinnerComponent}
                </div>
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                    <div className="text-center text-gray-500">
                        <div className="text-2xl mb-2">📷</div>
                        <div className="text-sm">Failed to load image</div>
                    </div>
                </div>
            )}

            {/* The actual image */}
            <img
                src={cachedSrc || src}
                alt={alt}
                className={`${className} ${showSpinner ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                style={style}
                onLoad={handleImageLoad}
                onError={handleImageError}
                {...imageProps}
            />
        </div>
    );
};

/**
 * A variant that uses the DotsLoader from the existing Loader component
 */
export const ImageWithDotsLoader = ({
    spinnerMessage = '',
    ...props
}) => {
    return (
        <ImageWithSpinner
            {...props}
            spinner={<DotsLoader message={spinnerMessage} />}
        />
    );
};

/**
 * A variant specifically for thumbnails with preset styling
 */
export const ThumbnailWithSpinner = ({
    src,
    alt = 'Thumbnail',
    size = 'medium',
    className = '',
    containerClassName = '',
    ...props
}) => {
    const sizes = {
        small: 'w-16 h-16',
        medium: 'w-24 h-24',
        large: 'w-32 h-32'
    };

    const thumbnailSize = sizes[size] || sizes.medium;

    return (
        <ImageWithSpinner
            src={src}
            alt={alt}
            className={`${thumbnailSize} object-cover rounded-lg ${className}`}
            containerClassName={`${thumbnailSize} rounded-lg border-2 border-gray-300 overflow-hidden ${containerClassName}`}
            spinnerSize={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
            {...props}
        />
    );
};

export default ImageWithSpinner;
