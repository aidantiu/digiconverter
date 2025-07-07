# Video Format Support Guide

## Supported Input Formats
- **MP4** - Most common web video format
- **AVI** - Windows standard format
- **MOV** - Apple QuickTime format
- **WMV** - Windows Media Video
- **FLV** - Flash Video (legacy web format)
- **MKV** - Matroska container format
- **WebM** - Web-optimized format
- **MPEG/MPG** - Standard video compression format
- **M4V** - iTunes video format
- **3GP** - Mobile video format

## Supported Output Formats
All input formats can be converted to any of the following:

### Most Popular Conversions:

#### **For Web/Streaming:**
- **MPEG → MP4** ✅ (Most recommended)
- **AVI → MP4** ✅ 
- **MOV → MP4** ✅
- **MKV → MP4** ✅

#### **For Compatibility:**
- **MP4 → AVI** ✅ (Windows compatibility)
- **MOV → AVI** ✅
- **MPEG → AVI** ✅

#### **For Apple Devices:**
- **AVI → MOV** ✅
- **MPEG → MOV** ✅
- **MP4 → MOV** ✅

#### **For Web Optimization:**
- **Any → WebM** ✅ (Smaller file sizes)
- **Any → MP4** ✅ (Best compatibility)

## FFmpeg Format Mapping

Our system automatically maps file extensions to FFmpeg format names:

| File Extension | FFmpeg Format | Notes |
|----------------|---------------|-------|
| `.mp4` | `mp4` | Best for web, mobile |
| `.avi` | `avi` | Good for Windows |
| `.mov` | `mov` | Apple QuickTime |
| `.wmv` | `wmv` | Windows Media |
| `.flv` | `flv` | Legacy web format |
| `.mkv` | `matroska` | Open source container |
| `.webm` | `webm` | Google web format |
| `.mpeg` | `mpeg` | Standard format |
| `.mpg` | `mpeg` | Same as MPEG |
| `.m4v` | `mp4` | iTunes format |
| `.3gp` | `3gp` | Mobile format |

## Common Use Cases

### **MPEG to MP4 Conversion**
- **Why**: MP4 has better compression and wider compatibility
- **Benefits**: Smaller file size, works on all devices
- **Quality**: Maintained with better compression

### **MP4 to MPEG Conversion**
- **Why**: Some legacy systems require MPEG
- **Benefits**: Compatible with older hardware/software
- **Trade-off**: Larger file size

### **AVI to MP4 Conversion**
- **Why**: MP4 is more web-friendly and has better compression
- **Benefits**: Smaller files, better streaming support
- **Quality**: Usually improved compression

### **MOV to MP4 Conversion**
- **Why**: MP4 works on more devices than MOV
- **Benefits**: Cross-platform compatibility
- **Quality**: Similar quality, better compatibility

## Conversion Tips

1. **MP4** is the most universally compatible format
2. **WebM** offers the best compression for web use
3. **AVI** is best for Windows-only environments
4. **MOV** is preferred for Apple ecosystems
5. **MPEG** is good for legacy system compatibility

## Technical Details

- **Max file size**: 100MB
- **Processing timeout**: 10 minutes
- **Quality**: High quality maintained during conversion
- **Progress tracking**: Real-time progress updates
- **Thumbnail generation**: Automatic for video files
