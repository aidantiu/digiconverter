# Multi-stage Dockerfile for DigiConverter Backend
# Supports both development and production builds
# Base stage with common dependencies - Updated to Node 20
FROM node:20-alpine AS base

# Install system dependencies for video processing and development
RUN apk add --no-cache \
    ffmpeg \
    curl \
    git \
    bash

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create app directory with proper ownership from start
WORKDIR /app
RUN chown nodejs:nodejs /app

# Switch to non-root user early
USER nodejs

# Copy package files for dependency installation
COPY --chown=nodejs:nodejs package*.json ./

# Development stage
FROM base AS development

# Install all dependencies with better timeout handling and clean cache
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Create necessary directories with proper permissions
RUN mkdir -p temp processed uploads logs && \
    chmod 755 temp processed uploads logs

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Expose development port
EXPOSE 5000

# Development health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Development command with nodemon for hot reload
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS prod-deps

# Install only production dependencies with better timeout handling and clean cache
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Install only runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    curl \
    dumb-init

# Create non-root user for production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create app directory with proper ownership
WORKDIR /app
RUN chown nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy production dependencies with proper ownership
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code with proper ownership
COPY --chown=nodejs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p temp processed uploads logs && \
    chmod 755 temp processed uploads logs

# Expose production port
EXPOSE 5000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Production command
CMD ["npm", "start"]



