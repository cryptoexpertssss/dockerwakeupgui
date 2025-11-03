#!/bin/bash

#################################################################################
# DockerWakeUp Complete Installation Script
# Installs both the original DockerWakeUp script and WebUI Dashboard
#################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

INSTALL_DIR="/opt/dockerwakeup"
WEBUI_PORT=9999
BACKEND_PORT=8001

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════"
echo "  DockerWakeUp Complete Installation"
echo "  WebUI Dashboard + Original DockerWakeUp Script"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Detected OS: $OS $VERSION${NC}"

#################################################################################
# Install System Dependencies
#################################################################################

echo -e "\n${BLUE}[1/8] Installing system dependencies...${NC}"

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y \
        docker.io \
        docker-compose \
        python3 \
        python3-pip \
        python3-venv \
        nodejs \
        npm \
        mongodb \
        git \
        curl \
        wget \
        jq
    
    # Install yarn
    npm install -g yarn
    
    # Enable and start services
    systemctl enable docker
    systemctl start docker
    systemctl enable mongodb
    systemctl start mongodb
    
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum install -y \
        docker \
        docker-compose \
        python3 \
        python3-pip \
        nodejs \
        npm \
        mongodb-server \
        git \
        curl \
        wget \
        jq
    
    npm install -g yarn
    
    systemctl enable docker
    systemctl start docker
    systemctl enable mongod
    systemctl start mongod
else
    echo -e "${RED}Unsupported OS: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ System dependencies installed${NC}"

#################################################################################
# Create Installation Directory
#################################################################################

echo -e "\n${BLUE}[2/8] Creating installation directory...${NC}"

mkdir -p $INSTALL_DIR
mkdir -p $INSTALL_DIR/backend
mkdir -p $INSTALL_DIR/frontend
mkdir -p $INSTALL_DIR/scripts
mkdir -p $INSTALL_DIR/logs
mkdir -p $INSTALL_DIR/config

echo -e "${GREEN}✓ Directory structure created at $INSTALL_DIR${NC}"

#################################################################################
# Clone Original DockerWakeUp
#################################################################################

echo -e "\n${BLUE}[3/8] Cloning original DockerWakeUp script...${NC}"

cd $INSTALL_DIR
git clone https://github.com/jelliott2021/DockerWakeUp.git original-dockerwakeup

# Copy the original script to scripts directory
cp original-dockerwakeup/*.py $INSTALL_DIR/scripts/ 2>/dev/null || true
cp original-dockerwakeup/*.sh $INSTALL_DIR/scripts/ 2>/dev/null || true
cp original-dockerwakeup/config.json $INSTALL_DIR/config/ 2>/dev/null || true

echo -e "${GREEN}✓ Original DockerWakeUp cloned${NC}"

#################################################################################
# Copy WebUI Files
#################################################################################

echo -e "\n${BLUE}[4/8] Setting up WebUI files...${NC}"

# This assumes the script is run from the app directory
# In production, these would be copied from the distribution package

if [ -d "/app/backend" ]; then
    cp -r /app/backend/* $INSTALL_DIR/backend/
    cp -r /app/frontend/* $INSTALL_DIR/frontend/
else
    echo -e "${YELLOW}⚠ WebUI files not found at /app. Please copy manually.${NC}"
    echo "Backend files should be in: $INSTALL_DIR/backend/"
    echo "Frontend files should be in: $INSTALL_DIR/frontend/"
fi

echo -e "${GREEN}✓ WebUI files copied${NC}"

#################################################################################
# Configure Backend
#################################################################################

echo -e "\n${BLUE}[5/8] Configuring backend...${NC}"

cd $INSTALL_DIR/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo -e "${YELLOW}⚠ requirements.txt not found${NC}"
fi

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
EOF

deactivate

echo -e "${GREEN}✓ Backend configured${NC}"

#################################################################################
# Configure Frontend
#################################################################################

echo -e "\n${BLUE}[6/8] Configuring frontend...${NC}"

cd $INSTALL_DIR/frontend

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://$SERVER_IP:$BACKEND_PORT
EOF

# Install dependencies and build
if [ -f "package.json" ]; then
    yarn install
    yarn build
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${YELLOW}⚠ package.json not found${NC}"
fi

#################################################################################
# Create Systemd Services
#################################################################################

echo -e "\n${BLUE}[7/8] Creating systemd services...${NC}"

# Backend service
cat > /etc/systemd/system/dockerwakeup-backend.service << EOF
[Unit]
Description=DockerWakeUp Backend API
After=docker.service mongodb.service network.target
Requires=docker.service mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port $BACKEND_PORT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/dockerwakeup-frontend.service << EOF
[Unit]
Description=DockerWakeUp Frontend Web Server
After=dockerwakeup-backend.service network.target
Requires=dockerwakeup-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=/usr/bin/npx serve -s build -l $WEBUI_PORT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Original DockerWakeUp service (if script exists)
if [ -f "$INSTALL_DIR/scripts/dockerwakeup.py" ] || [ -f "$INSTALL_DIR/scripts/main.py" ]; then
    SCRIPT_NAME=$(ls $INSTALL_DIR/scripts/*.py 2>/dev/null | head -1)
    
    cat > /etc/systemd/system/dockerwakeup-monitor.service << EOF
[Unit]
Description=DockerWakeUp Container Monitor
After=docker.service network.target
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/scripts
ExecStart=/usr/bin/python3 $SCRIPT_NAME
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    echo -e "${GREEN}✓ DockerWakeUp monitor service created${NC}"
fi

# Reload systemd
systemctl daemon-reload

echo -e "${GREEN}✓ Systemd services created${NC}"

#################################################################################
# Start Services
#################################################################################

echo -e "\n${BLUE}[8/8] Starting services...${NC}"

# Enable and start backend
systemctl enable dockerwakeup-backend
systemctl start dockerwakeup-backend

# Enable and start frontend
systemctl enable dockerwakeup-frontend
systemctl start dockerwakeup-frontend

# Enable and start monitor if exists
if [ -f "/etc/systemd/system/dockerwakeup-monitor.service" ]; then
    systemctl enable dockerwakeup-monitor
    systemctl start dockerwakeup-monitor
    echo -e "${GREEN}✓ DockerWakeUp monitor started${NC}"
fi

sleep 3

# Check service status
echo -e "\n${BLUE}Checking service status...${NC}"

if systemctl is-active --quiet dockerwakeup-backend; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo "Check logs: journalctl -u dockerwakeup-backend -n 50"
fi

if systemctl is-active --quiet dockerwakeup-frontend; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    echo "Check logs: journalctl -u dockerwakeup-frontend -n 50"
fi

#################################################################################
# Create Management Script
#################################################################################

cat > $INSTALL_DIR/dockerwakeup-ctl << 'EOF'
#!/bin/bash

# DockerWakeUp Control Script

case "$1" in
    start)
        echo "Starting DockerWakeUp services..."
        systemctl start dockerwakeup-backend
        systemctl start dockerwakeup-frontend
        systemctl start dockerwakeup-monitor 2>/dev/null || true
        echo "Services started"
        ;;
    stop)
        echo "Stopping DockerWakeUp services..."
        systemctl stop dockerwakeup-backend
        systemctl stop dockerwakeup-frontend
        systemctl stop dockerwakeup-monitor 2>/dev/null || true
        echo "Services stopped"
        ;;
    restart)
        echo "Restarting DockerWakeUp services..."
        systemctl restart dockerwakeup-backend
        systemctl restart dockerwakeup-frontend
        systemctl restart dockerwakeup-monitor 2>/dev/null || true
        echo "Services restarted"
        ;;
    status)
        echo "DockerWakeUp Service Status:"
        echo "----------------------------"
        systemctl status dockerwakeup-backend --no-pager
        echo ""
        systemctl status dockerwakeup-frontend --no-pager
        echo ""
        systemctl status dockerwakeup-monitor --no-pager 2>/dev/null || echo "Monitor service not installed"
        ;;
    logs)
        SERVICE="${2:-backend}"
        echo "Showing logs for dockerwakeup-$SERVICE..."
        journalctl -u dockerwakeup-$SERVICE -n 100 -f
        ;;
    update)
        echo "Updating DockerWakeUp..."
        cd /opt/dockerwakeup/original-dockerwakeup
        git pull
        systemctl restart dockerwakeup-backend
        systemctl restart dockerwakeup-frontend
        systemctl restart dockerwakeup-monitor 2>/dev/null || true
        echo "Update complete"
        ;;
    *)
        echo "DockerWakeUp Control Script"
        echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend|monitor]|update}"
        exit 1
        ;;
esac

exit 0
EOF

chmod +x $INSTALL_DIR/dockerwakeup-ctl
ln -sf $INSTALL_DIR/dockerwakeup-ctl /usr/local/bin/dockerwakeup

echo -e "${GREEN}✓ Management script created${NC}"

#################################################################################
# Installation Complete
#################################################################################

echo -e "\n${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "  Installation Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo -e "${BLUE}Access DockerWakeUp WebUI:${NC}"
echo -e "  http://$SERVER_IP:$WEBUI_PORT"
echo ""
echo -e "${BLUE}API Endpoint:${NC}"
echo -e "  http://$SERVER_IP:$BACKEND_PORT/api"
echo ""
echo -e "${BLUE}Installation Directory:${NC}"
echo -e "  $INSTALL_DIR"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  dockerwakeup start      - Start all services"
echo -e "  dockerwakeup stop       - Stop all services"
echo -e "  dockerwakeup restart    - Restart all services"
echo -e "  dockerwakeup status     - Check service status"
echo -e "  dockerwakeup logs       - View logs (backend/frontend/monitor)"
echo -e "  dockerwakeup update     - Update DockerWakeUp"
echo ""
echo -e "${BLUE}Service Logs:${NC}"
echo -e "  journalctl -u dockerwakeup-backend -f"
echo -e "  journalctl -u dockerwakeup-frontend -f"
echo -e "  journalctl -u dockerwakeup-monitor -f"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure Docker socket (/var/run/docker.sock) is accessible"
echo ""
echo -e "${GREEN}Enjoy DockerWakeUp! 🐳${NC}"
echo ""
