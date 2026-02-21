# --- Stage 1: Builder ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy config files first to cache dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies needed for build)
RUN npm install

# Copy the rest of the code
COPY . .

# Set placeholder DATABASE_URL for Prisma generation during build
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"

# Build the app (this includes prisma generate from the build script)
RUN npm run build

# Verify the build output exists
RUN ls -la /app/dist

# --- Stage 2: Production ---
FROM node:18-alpine AS production

WORKDIR /app

# Copy package.json to install production dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies AND prisma (needed at runtime)
RUN npm install --omit=dev && npm cache clean --force

# Generate Prisma Client for production
RUN npx prisma generate

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Verify the dist folder exists in production
RUN ls -la /app/dist

# Expose the application port
EXPOSE 3000

# Start the app directly with node (lighter than npm start)
CMD ["node", "dist/src/main.js"]