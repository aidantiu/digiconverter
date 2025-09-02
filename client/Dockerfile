# Multi-stage Dockerfile for DigiConverter Frontend
# Supports both development and production builds

# Base stage with common dependencies - Updated to Node 20
FROM node:20-alpine AS base

# Install git for better npm package resolution
RUN apk add --no-cache git curl

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set working directory with proper ownership from start
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

# Copy source code with proper ownership (will be volume mounted in dev)
COPY --chown=nodejs:nodejs . .

# Build argument for API URL
ARG VITE_API_BASE_URL=http://localhost:5000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Expose Vite dev server port
EXPOSE 5173

# Development health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

# Development command with Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage for production
FROM node:20-alpine AS builder

# Install git and curl
RUN apk add --no-cache git curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for building with better timeout handling and clean cache
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Copy source code
COPY . .

# Build argument for API URL (configurable at build time)
ARG VITE_API_BASE_URL=http://localhost:5000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the Vite application
RUN npm run build

# Production stage with nginx
FROM nginxinc/nginx-unprivileged:alpine AS production

# Install curl for healthcheck
USER root
RUN apk add --no-cache curl
USER nginx

# Copy nginx configuration
COPY --link nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (nginx-unprivileged default)
EXPOSE 8080

# Production health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ping || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]