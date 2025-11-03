FROM python:3.11-slim

WORKDIR /app

# Install git and other dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Clone the original DockerWakeUp repository
RUN git clone https://github.com/jelliott2021/DockerWakeUp.git /tmp/dockerwakeup && \
    cp -r /tmp/dockerwakeup/* /app/ && \
    rm -rf /tmp/dockerwakeup

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Install common dependencies for Docker monitoring
RUN pip install --no-cache-dir \
    docker \
    pyyaml \
    requests \
    pymongo

# Copy default config if not exists
COPY config.json /app/config.json

# Make scripts executable
RUN chmod +x /app/*.py 2>/dev/null || true
RUN chmod +x /app/*.sh 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep -f python || exit 1

# Run the main script (detect automatically or use default)
CMD ["sh", "-c", "if [ -f main.py ]; then python main.py; elif [ -f dockerwakeup.py ]; then python dockerwakeup.py; else python *.py; fi"]
