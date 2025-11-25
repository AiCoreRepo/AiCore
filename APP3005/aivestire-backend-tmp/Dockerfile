# --- Stage 1: Builder ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy config files first to cache dependencies
COPY package*.json ./

# Use 'npm ci' instead of 'install' for a faster, reliable build from lockfile
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine AS production

WORKDIR /app

# Copy package.json to install production dependencies
COPY package*.json ./

# Install ONLY production dependencies (skips typescript, eslint, etc.)
RUN npm ci --omit=dev && npm cache clean --force

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the app directly with node (lighter than npm start)
CMD ["node", "dist/main"]