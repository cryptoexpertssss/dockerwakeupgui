#!/bin/bash

#################################################################################
# DockerWakeUp Complete - Docker Uninstall Script
# Removes all Docker containers, volumes, images, and files
#################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/dockerwakeup"

echo -e "${RED}"
echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║  DockerWakeUp Complete - Uninstallation                        ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}This will completely remove DockerWakeUp Complete including:${NC}"
echo "  • All Docker containers (4)"
echo "  • Docker images"
echo "  • Docker volumes (including MongoDB data)"
echo "  • Installation directory"
echo "  • Management scripts"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Uninstallation cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting uninstallation...${NC}"
echo ""

#################################################################################
# Stop and Remove Docker Containers
#################################################################################

echo -e "${BLUE}[1/6] Stopping Docker containers...${NC}"

if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
    cd $INSTALL_DIR
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    echo -e "${GREEN}✓ Containers stopped and removed${NC}"
else
    # Try to stop containers manually if docker-compose.yml is missing
    docker stop dockerwakeup-mongodb dockerwakeup-backend dockerwakeup-frontend dockerwakeup-monitor 2>/dev/null || true
    docker rm dockerwakeup-mongodb dockerwakeup-backend dockerwakeup-frontend dockerwakeup-monitor 2>/dev/null || true
    echo -e "${GREEN}✓ Containers removed${NC}"
fi

#################################################################################
# Remove Docker Volumes
#################################################################################

echo -e "\n${BLUE}[2/6] Removing Docker volumes...${NC}"

read -p "Remove MongoDB data volume? This will delete all data (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    docker volume rm dockerwakeup_mongodb_data 2>/dev/null || true
    docker volume rm dockerwakeupgui_mongodb_data 2>/dev/null || true
    echo -e "${GREEN}✓ Volumes removed (data deleted)${NC}"
else
    echo -e "${YELLOW}⚠ Volumes kept (data preserved)${NC}"
fi

#################################################################################
# Remove Docker Images
#################################################################################

echo -e "\n${BLUE}[3/6] Removing Docker images...${NC}"

read -p "Remove DockerWakeUp Docker images? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    # Remove images
    docker rmi dockerwakeupgui-backend 2>/dev/null || true
    docker rmi dockerwakeupgui-frontend 2>/dev/null || true
    docker rmi dockerwakeupgui-dockerwakeup-monitor 2>/dev/null || true
    docker rmi dockerwakeup-backend 2>/dev/null || true
    docker rmi dockerwakeup-frontend 2>/dev/null || true
    docker rmi dockerwakeup-dockerwakeup-monitor 2>/dev/null || true
    echo -e "${GREEN}✓ Images removed${NC}"
else
    echo -e "${YELLOW}⚠ Images kept${NC}"
fi

#################################################################################
# Remove Docker Network
#################################################################################

echo -e "\n${BLUE}[4/6] Removing Docker network...${NC}"

docker network rm dockerwakeup-network 2>/dev/null || true
docker network rm dockerwakeupgui_dockerwakeup 2>/dev/null || true
echo -e "${GREEN}✓ Network removed${NC}"

#################################################################################
# Remove Installation Directory
#################################################################################

echo -e "\n${BLUE}[5/6] Removing installation directory...${NC}"

if [ -d "$INSTALL_DIR" ]; then
    rm -rf $INSTALL_DIR
    echo -e "${GREEN}✓ Installation directory removed: $INSTALL_DIR${NC}"
fi

# Also remove if installed at /opt/dockerwakeupgui
if [ -d "/opt/dockerwakeupgui" ]; then
    rm -rf /opt/dockerwakeupgui
    echo -e "${GREEN}✓ Installation directory removed: /opt/dockerwakeupgui${NC}"
fi

#################################################################################
# Remove Management Script
#################################################################################

echo -e "\n${BLUE}[6/6] Removing management script...${NC}"

rm -f /usr/local/bin/dockerwakeup
echo -e "${GREEN}✓ Management script removed${NC}"

#################################################################################
# Cleanup
#################################################################################

echo -e "\n${BLUE}Running Docker cleanup...${NC}"

read -p "Run 'docker system prune' to clean up unused resources? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    docker system prune -f
    echo -e "${GREEN}✓ Docker cleanup complete${NC}"
fi

#################################################################################
# Uninstallation Complete
#################################################################################

echo ""
echo -e "${GREEN}"
echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║  Uninstallation Complete                                       ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "DockerWakeUp Complete has been removed from your system."
echo ""
echo "What was removed:"
echo "  ✓ 4 Docker containers"
echo "  ✓ Docker network"
echo "  ✓ Installation files"
echo "  ✓ Management CLI"
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "  ✓ Docker volumes (data deleted)"
fi
echo ""
echo "To reinstall, run:"
echo "  curl -fsSL https://your-url/docker-install.sh | sudo bash"
echo ""
