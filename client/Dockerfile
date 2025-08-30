# Multi-stage Dockerfile for DigiConverter Frontend
# Supports both development and production builds

# Base stage with common dependencies - Updated to Node 20
FROM node:20-alpine AS base

# Install git for better npm package resolution
RUN apk add --no-cache git curl

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies with better timeout handling
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --prefer-offline --no-audit

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy source code (will be volume mounted in dev)
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
FROM base AS builder

# Install all dependencies for building with better timeout handling
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --prefer-offline --no-audit

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