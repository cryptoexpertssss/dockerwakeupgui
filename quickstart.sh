#!/bin/bash

#################################################################################
# DockerWakeUp WebUI - Quick Start Script
# For servers with Docker already installed
#################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}DockerWakeUp WebUI - Quick Start${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker first."
    exit 1
fi

# Check if already running
if docker ps | grep -q "dockerwakeup"; then
    echo "DockerWakeUp is already running!"
    echo "Access at: http://$(hostname -I | awk '{print $1}'):9999"
    exit 0
fi

# Quick start using docker-compose
if [ -f "docker-compose.yml" ]; then
    echo "Starting DockerWakeUp..."
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}✓ DockerWakeUp started!${NC}"
    echo ""
    echo "Access at: http://$(hostname -I | awk '{print $1}'):9999"
    echo "API Docs: http://$(hostname -I | awk '{print $1}'):8001/docs"
    echo ""
    echo "Commands:"
    echo "  docker-compose ps       - Check status"
    echo "  docker-compose logs -f  - View logs"
    echo "  docker-compose down     - Stop services"
else
    echo "docker-compose.yml not found!"
    echo "Please run the full installation script first."
    exit 1
fi
