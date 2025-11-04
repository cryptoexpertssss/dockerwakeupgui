FROM python:3.11-slim

WORKDIR /app

# Install git and other dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Clone the original DockerWakeUp repository directly to /app
RUN git clone https://github.com/jelliott2021/DockerWakeUp.git /tmp/dockerwakeup && \
    cp -r /tmp/dockerwakeup/* /app/ || cp -r /tmp/dockerwakeup/.* /app/ 2>/dev/null || true && \
    rm -rf /tmp/dockerwakeup && \
    ls -la /app/

# Install Python dependencies
RUN pip install --no-cache-dir \
    docker \
    pyyaml \
    requests \
    pymongo \
    python-dotenv

# Copy config
COPY config.json /app/config.json

# Create a wrapper script to run whatever Python file exists
RUN echo '#!/bin/bash\n\
echo "DockerWakeUp Monitor Starting..."\n\
echo "Files in /app:"\n\
ls -la /app/\n\
\n\
# Find and run the first Python script\n\
if [ -f /app/dockerwakeup.py ]; then\n\
    echo "Running dockerwakeup.py"\n\
    python /app/dockerwakeup.py\n\
elif [ -f /app/main.py ]; then\n\
    echo "Running main.py"\n\
    python /app/main.py\n\
else\n\
    PYTHON_FILE=$(find /app -maxdepth 1 -name "*.py" -type f | head -1)\n\
    if [ -n "$PYTHON_FILE" ]; then\n\
        echo "Running $PYTHON_FILE"\n\
        python "$PYTHON_FILE"\n\
    else\n\
        echo "No Python files found. Original DockerWakeUp may not have been cloned."\n\
        echo "Running in monitor mode - keeping container alive"\n\
        tail -f /dev/null\n\
    fi\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep -f python || exit 1

# Run the start script
CMD ["/app/start.sh"]
