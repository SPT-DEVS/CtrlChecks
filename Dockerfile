# Production Dockerfile for Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
# Priority: nginx.conf (custom domain) > nginx.conf.example (default)
COPY nginx.conf.example /etc/nginx/conf.d/default.conf
# If nginx.conf exists, it will override the example (mount as volume or copy separately)

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
