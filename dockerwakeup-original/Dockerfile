FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    docker-cli

# Copy the entire embedded DockerWakeUp application
COPY . /app/

# Install and build wake-proxy
WORKDIR /app/wake-proxy
RUN npm install && npm run build

# Install nginx-generator dependencies  
WORKDIR /app/nginx-generator
RUN npm install

# Back to root
WORKDIR /app

# Make scripts executable
RUN chmod +x /app/*.sh 2>/dev/null || true

# Ensure config exists
RUN if [ ! -f /app/config.json ]; then cp /app/config.json.example /app/config.json; fi

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep -f node || exit 1

# Start the wake-proxy service (now using compiled JS)
CMD ["node", "/app/wake-proxy/dist/wake-proxy.js"]
