# ---------- Base Image ----------
FROM node:18 AS base

WORKDIR /app

# Avoid copying everything early to maximize caching
COPY package*.json ./

# Install only production dependencies by default
RUN npm install --omit=dev


# ----------- Development Stage -----------
FROM base AS development

# Install dev dependencies for hot-reload
RUN npm install

# Copy source code
COPY . .

# Expose port (optional but good practice)
EXPOSE 5000

# Start with nodemon for dev
CMD ["npm", "run", "dev"]



