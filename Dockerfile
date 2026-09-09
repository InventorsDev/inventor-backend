# ===========================
# Stage 1 - Build the application
# ===========================
FROM node:20-alpine AS builder

# Create and use the application directory
WORKDIR /app

# Copy package files first (better Docker caching)
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application
COPY . .

# Compile the NestJS application
RUN npm run build


# ===========================
# Stage 2 - Production image
# ===========================
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the compiled application
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3888

# Start the application
CMD ["npm", "run", "start:prod"]