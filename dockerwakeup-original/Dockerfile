FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    docker-cli

# Copy the entire DockerWakeUp application (now embedded in repo)
COPY . /app/

# Install wake-proxy dependencies
WORKDIR /app/wake-proxy
RUN npm install

# Install nginx-generator dependencies  
WORKDIR /app/nginx-generator
RUN npm install

# Back to root
WORKDIR /app

# Make scripts executable
RUN chmod +x /app/*.sh 2>/dev/null || true
RUN chmod +x /app/wake-proxy/src/*.js 2>/dev/null || true
RUN chmod +x /app/nginx-generator/*.js 2>/dev/null || true

# Copy config if not exists
RUN if [ ! -f /app/config.json ]; then cp /app/config.json.example /app/config.json; fi

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep -f node || exit 1

# Start the wake-proxy service
CMD ["node", "/app/wake-proxy/src/index.js"]
