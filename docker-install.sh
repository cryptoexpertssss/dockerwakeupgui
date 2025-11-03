#!/bin/bash

#################################################################################
# DockerWakeUp Complete - Single Docker Installation
# Installs both Original DockerWakeUp + WebUI Dashboard
#################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

INSTALL_DIR="/opt/dockerwakeup"
WEBUI_PORT=9999

echo -e "${MAGENTA}"
echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║  DockerWakeUp COMPLETE - Single Docker Installation            ║"
echo "║                                                                   ║"
echo "║  ✅ Original DockerWakeUp (Container Wake/Sleep Monitor)       ║"
echo "║  ✅ WebUI Dashboard (Modern Web Interface)                     ║"
echo "║                                                                   ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Install Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo -e "${GREEN}✓ Docker installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not installed${NC}"
    echo "Install: sudo apt-get install docker-compose-plugin"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Ensure Docker is running
if ! systemctl is-active --quiet docker 2>/dev/null; then
    echo -e "${YELLOW}Starting Docker service...${NC}"
    systemctl start docker 2>/dev/null || true
fi

echo -e "${GREEN}✓ Docker service running${NC}"

echo ""
echo -e "${BLUE}═════════════════════════════════════════════════════════════════════${NC}"

#################################################################################
# Create Installation Directory
#################################################################################

echo -e "\n${BLUE}[1/7] Creating installation directory...${NC}"

mkdir -p $INSTALL_DIR
mkdir -p $INSTALL_DIR/backend
mkdir -p $INSTALL_DIR/frontend
mkdir -p $INSTALL_DIR/dockerwakeup-original
cd $INSTALL_DIR

echo -e "${GREEN}✓ Directory structure created at $INSTALL_DIR${NC}"

#################################################################################
# Clone Original DockerWakeUp Repository
#################################################################################

echo -e "\n${BLUE}[2/7] Cloning original DockerWakeUp from GitHub...${NC}"

if [ -d "$INSTALL_DIR/dockerwakeup-original/.git" ]; then
    echo "Repository already exists, pulling latest..."
    cd $INSTALL_DIR/dockerwakeup-original
    git pull
else
    cd $INSTALL_DIR
    git clone https://github.com/jelliott2021/DockerWakeUp.git dockerwakeup-original-repo
    
    # Copy files to dockerwakeup-original directory
    cp -r dockerwakeup-original-repo/* dockerwakeup-original/ 2>/dev/null || true
    rm -rf dockerwakeup-original-repo
fi

echo -e "${GREEN}✓ Original DockerWakeUp cloned${NC}"

#################################################################################
# Copy WebUI Application Files
#################################################################################

echo -e "\n${BLUE}[3/7] Setting up WebUI files...${NC}"

# Copy from development environment if available
if [ -d "/app/backend" ] && [ -d "/app/frontend" ]; then
    echo "Copying WebUI from development environment..."
    cp -r /app/backend/* $INSTALL_DIR/backend/
    cp -r /app/frontend/* $INSTALL_DIR/frontend/
    cp /app/docker-compose.yml $INSTALL_DIR/ 2>/dev/null || true
    echo -e "${GREEN}✓ WebUI files copied${NC}"
else
    echo -e "${YELLOW}⚠ WebUI files not found. Please ensure files are in $INSTALL_DIR${NC}"
fi

#################################################################################
# Configure Environment Variables
#################################################################################

echo -e "\n${BLUE}[4/7] Configuring environment...${NC}"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Backend .env
cat > $INSTALL_DIR/backend/.env << EOF
MONGO_URL=mongodb://mongodb:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
EOF

# Frontend .env
cat > $INSTALL_DIR/frontend/.env << EOF
REACT_APP_BACKEND_URL=http://$SERVER_IP:$WEBUI_PORT
EOF

# DockerWakeUp config.json (if not exists)
if [ ! -f "$INSTALL_DIR/dockerwakeup-original/config.json" ]; then
    cat > $INSTALL_DIR/dockerwakeup-original/config.json << 'EOF'
{
  "idleThreshold": 3600,
  "pollInterval": 30,
  "proxyPort": 8080,
  "composeDirs": ["/opt", "/home", "/var/lib/docker"],
  "autoDetect": true,
  "wakeOnRequest": true,
  "logLevel": "info"
}
EOF
fi

# Create Dockerfile for original DockerWakeUp
cat > $INSTALL_DIR/dockerwakeup-original/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git curl procps && rm -rf /var/lib/apt/lists/*

COPY . /app/

RUN pip install --no-cache-dir docker pyyaml requests pymongo || true

RUN chmod +x /app/*.py 2>/dev/null || true

CMD ["sh", "-c", "python $(find /app -name '*.py' -type f | head -1) || tail -f /dev/null"]
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

#################################################################################
# Build Docker Images
#################################################################################

echo -e "\n${BLUE}[5/7] Building Docker images...${NC}"
echo "This will take 5-10 minutes on first run..."
echo ""

cd $INSTALL_DIR

echo -e "${BLUE}  - Building DockerWakeUp Monitor...${NC}"
docker-compose build dockerwakeup-monitor

echo -e "${BLUE}  - Building Backend API...${NC}"
docker-compose build backend

echo -e "${BLUE}  - Building Frontend...${NC}"
docker-compose build frontend

echo -e "${GREEN}✓ All Docker images built${NC}"

#################################################################################
# Start Services
#################################################################################

echo -e "\n${BLUE}[6/7] Starting all services...${NC}"

docker-compose up -d

echo "Waiting for services to become healthy..."
sleep 15

# Check service status
RUNNING_COUNT=$(docker-compose ps --services --filter "status=running" | wc -l)
TOTAL_COUNT=$(docker-compose ps --services | wc -l)

if [ "$RUNNING_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo -e "${GREEN}✓ All services started successfully ($RUNNING_COUNT/$TOTAL_COUNT running)${NC}"
else
    echo -e "${YELLOW}⚠ Some services may not be running ($RUNNING_COUNT/$TOTAL_COUNT running)${NC}"
    echo "Check status: docker-compose ps"
    echo "Check logs: docker-compose logs"
fi

#################################################################################
# Create Management Script
#################################################################################

echo -e "\n${BLUE}[7/7] Creating management tools...${NC}"

cat > /usr/local/bin/dockerwakeup << 'EOF'
#!/bin/bash

INSTALL_DIR="/opt/dockerwakeup"
cd $INSTALL_DIR

case "$1" in
    start)
        echo "Starting DockerWakeUp Complete..."
        docker-compose start
        echo "✓ Services started"
        ;;
    stop)
        echo "Stopping DockerWakeUp Complete..."
        docker-compose stop
        echo "✓ Services stopped"
        ;;
    restart)
        echo "Restarting DockerWakeUp Complete..."
        docker-compose restart
        echo "✓ Services restarted"
        ;;
    status)
        echo "DockerWakeUp Service Status:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        docker-compose ps
        ;;
    logs)
        SERVICE="${2:-all}"
        if [ "$SERVICE" = "all" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f $SERVICE
        fi
        ;;
    update)
        echo "Updating DockerWakeUp Complete..."
        cd dockerwakeup-original
        git pull
        cd ..
        docker-compose pull
        docker-compose up -d --build
        echo "✓ Update complete"
        ;;
    rebuild)
        echo "Rebuilding DockerWakeUp Complete..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo "✓ Rebuild complete"
        ;;
    down)
        echo "Stopping and removing DockerWakeUp containers..."
        docker-compose down
        echo "✓ Containers removed"
        ;;
    info)
        echo "DockerWakeUp Complete - Installation Info"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Installation Directory: $INSTALL_DIR"
        echo "WebUI: http://$(hostname -I | awk '{print $1}'):9999"
        echo "API:   http://$(hostname -I | awk '{print $1}'):8001/docs"
        echo ""
        echo "Services:"
        echo "  • dockerwakeup-monitor  - Original DockerWakeUp script"
        echo "  • dockerwakeup-backend  - WebUI API server"
        echo "  • dockerwakeup-frontend - WebUI web interface"
        echo "  • dockerwakeup-mongodb  - Database"
        ;;
    *)
        echo "DockerWakeUp Complete - Management CLI"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Usage: dockerwakeup {command} [options]"
        echo ""
        echo "Commands:"
        echo "  start              Start all services"
        echo "  stop               Stop all services"
        echo "  restart            Restart all services"
        echo "  status             Show service status"
        echo "  logs [service]     View logs (all/monitor/backend/frontend/mongodb)"
        echo "  update             Update to latest version"
        echo "  rebuild            Rebuild everything from scratch"
        echo "  down               Stop and remove containers"
        echo "  info               Show installation information"
        echo ""
        echo "Examples:"
        echo "  dockerwakeup status"
        echo "  dockerwakeup logs backend"
        echo "  dockerwakeup logs all"
        exit 1
        ;;
esac

exit 0
EOF

chmod +x /usr/local/bin/dockerwakeup

echo -e "${GREEN}✓ Management CLI created${NC}"

#################################################################################
# Installation Complete
#################################################################################

echo ""
echo -e "${GREEN}"
echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║             ✅ Installation Complete!                          ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}⚙️  Services Running:${NC}"
echo "  ✅ DockerWakeUp Monitor  (Original container wake/sleep script)"
echo "  ✅ WebUI Backend API     (FastAPI + WebSocket)"
echo "  ✅ WebUI Frontend        (React Dashboard)"
echo "  ✅ MongoDB Database      (Shared data storage)"
echo ""

echo -e "${MAGENTA}🌐 Access DockerWakeUp WebUI:${NC}"
echo -e "  ${GREEN}http://$SERVER_IP:$WEBUI_PORT${NC}"
echo ""

echo -e "${BLUE}📖 API Documentation:${NC}"
echo -e "  http://$SERVER_IP:8001/docs"
echo ""

echo -e "${BLUE}📂 Installation Directory:${NC}"
echo -e "  $INSTALL_DIR"
echo ""

echo -e "${BLUE}🛠️  Quick Commands:${NC}"
echo -e "  ${GREEN}dockerwakeup status${NC}      - Check all services"
echo -e "  ${GREEN}dockerwakeup logs${NC}        - View all logs"
echo -e "  ${GREEN}dockerwakeup logs monitor${NC} - Original DockerWakeUp logs"
echo -e "  ${GREEN}dockerwakeup logs backend${NC} - WebUI API logs"
echo -e "  ${GREEN}dockerwakeup restart${NC}      - Restart everything"
echo -e "  ${GREEN}dockerwakeup info${NC}        - Show detailed info"
echo ""

echo -e "${BLUE}🐋 Docker Commands:${NC}"
echo -e "  cd $INSTALL_DIR"
echo -e "  docker-compose ps           - Check containers"
echo -e "  docker-compose logs -f      - Follow all logs"
echo ""

echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  Docker socket (/var/run/docker.sock) is mounted read-only"
echo "  Both services share the same MongoDB database"
echo "  Original DockerWakeUp runs in background monitoring containers"
echo "  WebUI provides visual management interface"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Enjoy DockerWakeUp Complete! 🐳 🚀${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
