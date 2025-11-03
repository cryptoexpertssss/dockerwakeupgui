#!/bin/bash

#################################################################################
# DockerWakeUp - Quick Uninstall Script
#################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/dockerwakeup"

echo -e "${RED}"
echo "═══════════════════════════════════════════════════════════════"
echo "  DockerWakeUp Uninstallation"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

read -p "This will completely remove DockerWakeUp. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled"
    exit 0
fi

echo -e "\n${BLUE}Stopping services...${NC}"
systemctl stop dockerwakeup-backend 2>/dev/null || true
systemctl stop dockerwakeup-frontend 2>/dev/null || true
systemctl stop dockerwakeup-monitor 2>/dev/null || true
echo -e "${GREEN}✓ Services stopped${NC}"

echo -e "\n${BLUE}Disabling services...${NC}"
systemctl disable dockerwakeup-backend 2>/dev/null || true
systemctl disable dockerwakeup-frontend 2>/dev/null || true
systemctl disable dockerwakeup-monitor 2>/dev/null || true
echo -e "${GREEN}✓ Services disabled${NC}"

echo -e "\n${BLUE}Removing service files...${NC}"
rm -f /etc/systemd/system/dockerwakeup-backend.service
rm -f /etc/systemd/system/dockerwakeup-frontend.service
rm -f /etc/systemd/system/dockerwakeup-monitor.service
systemctl daemon-reload
echo -e "${GREEN}✓ Service files removed${NC}"

echo -e "\n${BLUE}Removing installation directory...${NC}"
rm -rf $INSTALL_DIR
echo -e "${GREEN}✓ Installation directory removed${NC}"

echo -e "\n${BLUE}Removing management script...${NC}"
rm -f /usr/local/bin/dockerwakeup
echo -e "${GREEN}✓ Management script removed${NC}"

read -p "Remove MongoDB database 'dockerwakeup'? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mongo dockerwakeup --eval "db.dropDatabase()" 2>/dev/null || true
    echo -e "${GREEN}✓ Database removed${NC}"
fi

echo -e "\n${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "  Uninstallation Complete"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo "DockerWakeUp has been completely removed from your system."
echo ""
