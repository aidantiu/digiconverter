# FFmpeg Installation Guide for DigiConverter

## Quick Installation (Windows)

### Option 1: Using Chocolatey (Recommended)
1. Install Chocolatey if you haven't already:
   - Open PowerShell as Administrator
   - Run: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))`

2. Install FFmpeg:
   ```bash
   choco install ffmpeg
   ```

### Option 2: Manual Installation
1. Download FFmpeg from: https://ffmpeg.org/download.html#build-windows
2. Extract the ZIP file to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH:
   - Open System Properties → Advanced → Environment Variables
   - Edit the PATH variable and add `C:\ffmpeg\bin`
   - Restart your command prompt/PowerShell

### Option 3: Using winget (Windows 10/11)
```bash
winget install Gyan.FFmpeg
```

## Windows with Bash Terminal (Git Bash, WSL, MSYS2)

If you're using Windows 11 but prefer bash terminals, here are the best options:

### Option 1: WSL (Windows Subsystem for Linux) - Recommended
If you're using WSL, treat it like a Linux environment:

```bash
# Update package lists
sudo apt update

# Install FFmpeg
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

### Option 2: Git Bash + Windows FFmpeg
If using Git Bash, install FFmpeg for Windows and ensure it's in PATH:

1. **Using Chocolatey in PowerShell** (then use from Git Bash):
   ```powershell
   # Run this in PowerShell as Administrator
   choco install ffmpeg
   ```

2. **Using winget in PowerShell**:
   ```powershell
   # Run this in PowerShell
   winget install Gyan.FFmpeg
   ```

3. **Manual Installation**:
   - Download from https://ffmpeg.org/download.html#build-windows
   - Extract to `C:\ffmpeg`
   - Add `C:\ffmpeg\bin` to Windows PATH
   - Restart Git Bash

4. **Verify in Git Bash**:
   ```bash
   ffmpeg -version
   ```

### Option 3: MSYS2
If using MSYS2, use the pacman package manager:

```bash
# Update package database
pacman -Syu

# Install FFmpeg
pacman -S mingw-w64-x86_64-ffmpeg

# Verify installation
ffmpeg -version
```

### Path Issues in Bash on Windows
If FFmpeg is installed but not found in bash:

```bash
# Check if FFmpeg is in Windows PATH
/c/Program\ Files/ffmpeg/bin/ffmpeg -version

# Or try common installation paths
/c/ffmpeg/bin/ffmpeg -version
/c/tools/ffmpeg/bin/ffmpeg -version

# Add to your bash profile if needed
echo 'export PATH="$PATH:/c/ffmpeg/bin"' >> ~/.bashrc
source ~/.bashrc
```

## Installation on Linux/macOS (Using Bash)

### Option 1: Package Manager Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**CentOS/RHEL/Fedora:**
```bash
# For CentOS/RHEL (with EPEL repository)
sudo yum install epel-release
sudo yum install ffmpeg

# For Fedora
sudo dnf install ffmpeg
```

**macOS (using Homebrew):**
```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install FFmpeg
brew install ffmpeg
```

**Arch Linux:**
```bash
sudo pacman -S ffmpeg
```

### Option 2: Compile from Source (All Unix-like systems)

**Prerequisites:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential git pkg-config yasm libx264-dev libx265-dev libvpx-dev libfdk-aac-dev libmp3lame-dev libopus-dev

# CentOS/RHEL/Fedora
sudo yum groupinstall "Development Tools"
sudo yum install git pkgconfig yasm x264-devel x265-devel libvpx-devel fdk-aac-devel lame-devel opus-devel

# macOS (requires Xcode Command Line Tools)
xcode-select --install
brew install yasm pkg-config
```

**Compile FFmpeg:**
```bash
# Clone the FFmpeg repository
git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
cd ffmpeg

# Configure the build (basic configuration)
./configure --enable-gpl --enable-libx264 --enable-libx265 --enable-libvpx --enable-libfdk-aac --enable-libmp3lame --enable-libopus --enable-nonfree

# Compile (this may take a while)
make -j$(nproc)

# Install (requires sudo)
sudo make install

# Update library cache (Linux)
sudo ldconfig
```

**For a minimal build (faster compilation):**
```bash
git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
cd ffmpeg

# Minimal configuration
./configure --enable-gpl --enable-libx264

make -j$(nproc)
sudo make install
sudo ldconfig  # Linux only
```

## Verify Installation

Open a new terminal/command prompt and run:
```bash
ffmpeg -version
```

You should see FFmpeg version information if installed correctly.

### Example output:
```
ffmpeg version 4.4.2 Copyright (c) 2000-2021 the FFmpeg developers
built with gcc 9 (Ubuntu 9.4.0-1ubuntu1~20.04.1)
configuration: --enable-gpl --enable-libx264 ...
```

## Restart DigiConverter Server

After installing FFmpeg, restart your DigiConverter server:
```bash
npm start
```

Video conversion will now be available! 🎥

## Troubleshooting

- **"Cannot find ffmpeg" error**: Make sure FFmpeg is in your system PATH
- **Permission denied**: Run as administrator when installing
- **Command not found**: Restart your terminal after installation

## Current Features Without FFmpeg

✅ **Image Conversion**: JPEG, PNG, WebP, GIF, BMP, TIFF
⚠️ **Video Conversion**: Requires FFmpeg installation

Your application is fully functional for image conversion even without FFmpeg!


