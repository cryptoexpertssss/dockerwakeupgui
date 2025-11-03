#!/bin/bash

#################################################################################
# DockerWakeUp WebUI - Docker Installation Script
# One-command installation using Docker Compose
#################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/dockerwakeup"
WEBUI_PORT=9999

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════════════"
echo "  DockerWakeUp WebUI - Docker Installation"
echo "  Complete Docker Management Dashboard"
echo "═══════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/engine/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Check Docker service
if ! systemctl is-active --quiet docker; then
    echo -e "${YELLOW}Starting Docker service...${NC}"
    systemctl start docker
fi

echo -e "${GREEN}✓ Docker service running${NC}"

#################################################################################
# Create Installation Directory
#################################################################################

echo -e "\n${BLUE}[1/5] Creating installation directory...${NC}"

mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

echo -e "${GREEN}✓ Directory created: $INSTALL_DIR${NC}"

#################################################################################
# Clone/Download Application Files
#################################################################################

echo -e "\n${BLUE}[2/5] Downloading application files...${NC}"

# If running from /app (development), copy files
if [ -d "/app/backend" ] && [ -d "/app/frontend" ]; then
    echo "Copying from development environment..."
    cp -r /app/backend $INSTALL_DIR/
    cp -r /app/frontend $INSTALL_DIR/
    cp /app/docker-compose.yml $INSTALL_DIR/
    echo -e "${GREEN}✓ Files copied from /app${NC}"
else
    echo -e "${YELLOW}⚠ Development files not found at /app${NC}"
    echo "Please ensure backend/, frontend/, and docker-compose.yml are in $INSTALL_DIR"
    echo "Or clone from repository"
fi

#################################################################################
# Configure Environment
#################################################################################

echo -e "\n${BLUE}[3/5] Configuring environment...${NC}"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Create backend .env if not exists
if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
    cat > $INSTALL_DIR/backend/.env << EOF
MONGO_URL=mongodb://mongodb:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
EOF
    echo -e "${GREEN}✓ Backend .env created${NC}"
fi

# Create frontend .env for build
cat > $INSTALL_DIR/frontend/.env << EOF
REACT_APP_BACKEND_URL=http://$SERVER_IP:$WEBUI_PORT
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

#################################################################################
# Build and Start Services
#################################################################################

echo -e "\n${BLUE}[4/5] Building Docker images...${NC}"
echo "This may take 5-10 minutes on first run..."

cd $INSTALL_DIR

# Build images
docker-compose build --no-cache

echo -e "${GREEN}✓ Docker images built${NC}"

echo -e "\n${BLUE}[5/5] Starting services...${NC}"

# Start services
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check service status
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services started successfully${NC}"
else
    echo -e "${RED}✗ Some services failed to start${NC}"
    echo "Check logs: docker-compose logs"
fi

#################################################################################
# Create Management Script
#################################################################################

cat > /usr/local/bin/dockerwakeup << 'EOF'
#!/bin/bash

INSTALL_DIR="/opt/dockerwakeup"

cd $INSTALL_DIR

case "$1" in
    start)
        echo "Starting DockerWakeUp services..."
        docker-compose start
        ;;
    stop)
        echo "Stopping DockerWakeUp services..."
        docker-compose stop
        ;;
    restart)
        echo "Restarting DockerWakeUp services..."
        docker-compose restart
        ;;
    status)
        docker-compose ps
        ;;
    logs)
        SERVICE="${2:-backend}"
        docker-compose logs -f $SERVICE
        ;;
    update)
        echo "Updating DockerWakeUp..."
        docker-compose pull
        docker-compose up -d --build
        ;;
    down)
        echo "Stopping and removing DockerWakeUp containers..."
        docker-compose down
        ;;
    rebuild)
        echo "Rebuilding DockerWakeUp..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    *)
        echo "DockerWakeUp Control Script"
        echo "Usage: dockerwakeup {start|stop|restart|status|logs [service]|update|down|rebuild}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - View logs (backend/frontend/mongodb)"
        echo "  update   - Pull latest images and restart"
        echo "  down     - Stop and remove containers"
        echo "  rebuild  - Rebuild and restart everything"
        exit 1
        ;;
esac

exit 0
EOF

chmod +x /usr/local/bin/dockerwakeup

echo -e "${GREEN}✓ Management script created${NC}"

#################################################################################
# Installation Complete
#################################################################################

echo -e "\n${GREEN}"
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Installation Complete!"
echo "═══════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo -e "${BLUE}Access DockerWakeUp WebUI:${NC}"
echo -e "  http://$SERVER_IP:$WEBUI_PORT"
echo ""
echo -e "${BLUE}API Endpoint:${NC}"
echo -e "  http://$SERVER_IP:8001/api"
echo -e "  API Docs: http://$SERVER_IP:8001/docs"
echo ""
echo -e "${BLUE}Installation Directory:${NC}"
echo -e "  $INSTALL_DIR"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  dockerwakeup start     - Start all services"
echo -e "  dockerwakeup stop      - Stop all services"
echo -e "  dockerwakeup restart   - Restart all services"
echo -e "  dockerwakeup status    - Check service status"
echo -e "  dockerwakeup logs      - View logs"
echo -e "  dockerwakeup update    - Update to latest version"
echo -e "  dockerwakeup rebuild   - Rebuild from scratch"
echo ""
echo -e "${BLUE}Docker Commands:${NC}"
echo -e "  cd $INSTALL_DIR"
echo -e "  docker-compose ps           - Check status"
echo -e "  docker-compose logs -f      - Follow logs"
echo -e "  docker-compose down         - Stop everything"
echo ""
echo -e "${YELLOW}Note:${NC} Docker socket (/var/run/docker.sock) is mounted read-only"
echo ""
echo -e "${GREEN}Enjoy DockerWakeUp! 🐳${NC}"
echo ""
