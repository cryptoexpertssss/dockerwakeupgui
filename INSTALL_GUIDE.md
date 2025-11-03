# DockerWakeUp Complete - Installation & Deployment Guide

## Overview

DockerWakeUp Complete is a comprehensive Docker container management solution that combines:

1. **Original DockerWakeUp Script** - Container wake-on-demand and idle management
2. **WebUI Dashboard** - Modern web interface for Docker management

## Quick Install

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/dockerwakeup/main/install.sh | sudo bash
```

### Manual Installation

```bash
# Download the installer
wget https://raw.githubusercontent.com/your-repo/dockerwakeup/main/install.sh

# Make it executable
chmod +x install.sh

# Run the installer
sudo ./install.sh
```

## What Gets Installed

### Directory Structure

```
/opt/dockerwakeup/
├── backend/                  # WebUI Backend (FastAPI)
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/
├── frontend/                 # WebUI Frontend (React)
│   ├── build/
│   ├── package.json
│   └── .env
├── scripts/                  # Original DockerWakeUp scripts
│   └── *.py
├── config/                   # Configuration files
│   └── config.json
├── logs/                     # Application logs
└── original-dockerwakeup/   # Git clone of original repo
```

### Services Installed

1. **dockerwakeup-backend.service** - WebUI API server (Port 8001)
2. **dockerwakeup-frontend.service** - WebUI web server (Port 9999)
3. **dockerwakeup-monitor.service** - Original DockerWakeUp monitor

### System Dependencies

- Docker
- Docker Compose
- Python 3
- Node.js & Yarn
- MongoDB
- Git

## Post-Installation

### Access the Dashboard

```bash
http://YOUR_SERVER_IP:9999
```

### Management Commands

A convenient `dockerwakeup` command is installed:

```bash
# Start all services
dockerwakeup start

# Stop all services
dockerwakeup stop

# Restart all services
dockerwakeup restart

# Check service status
dockerwakeup status

# View logs
dockerwakeup logs backend
dockerwakeup logs frontend
dockerwakeup logs monitor

# Update to latest version
dockerwakeup update
```

### Manual Service Control

```bash
# Backend
systemctl start dockerwakeup-backend
systemctl stop dockerwakeup-backend
systemctl status dockerwakeup-backend
journalctl -u dockerwakeup-backend -f

# Frontend
systemctl start dockerwakeup-frontend
systemctl stop dockerwakeup-frontend
systemctl status dockerwakeup-frontend
journalctl -u dockerwakeup-frontend -f

# Monitor
systemctl start dockerwakeup-monitor
systemctl stop dockerwakeup-monitor
systemctl status dockerwakeup-monitor
journalctl -u dockerwakeup-monitor -f
```

## Configuration

### Backend Configuration

Edit `/opt/dockerwakeup/backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
```

### Frontend Configuration

Edit `/opt/dockerwakeup/frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:8001
```

### Original DockerWakeUp Configuration

Edit `/opt/dockerwakeup/config/config.json`:

```json
{
  "idleThreshold": 3600,
  "pollInterval": 30,
  "proxyPort": 8080,
  "composeDirs": ["/opt", "/home"]
}
```

## Nginx Proxy Manager Integration

### Setup Reverse Proxy

1. **Create Proxy Host in NPM**:
   - Domain: `dockerwakeup.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `YOUR_SERVER_IP`
   - Forward Port: `9999`
   - Enable WebSockets Support

2. **SSL Configuration**:
   - Request Let's Encrypt SSL Certificate
   - Force SSL
   - Enable HTTP/2 Support

### Sample Nginx Configuration

```nginx
server {
    listen 80;
    server_name dockerwakeup.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dockerwakeup.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Firewall Configuration

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 9999/tcp  # WebUI
sudo ufw allow 8001/tcp  # API (if needed externally)

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=9999/tcp
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --reload
```

## Docker Socket Access

Ensure the Docker socket is accessible:

```bash
# Check socket permissions
ls -la /var/run/docker.sock

# Add user to docker group (if needed)
sudo usermod -aG docker $USER

# Verify Docker access
docker ps
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
journalctl -u dockerwakeup-backend -n 50

# Check Docker socket
ls -la /var/run/docker.sock

# Test MongoDB
mongo --eval "db.adminCommand('ping')"

# Check port availability
sudo lsof -i :8001
```

### Frontend Won't Start

```bash
# Check logs
journalctl -u dockerwakeup-frontend -n 50

# Check build directory
ls -la /opt/dockerwakeup/frontend/build/

# Check port availability
sudo lsof -i :9999

# Rebuild frontend
cd /opt/dockerwakeup/frontend
yarn build
sudo systemctl restart dockerwakeup-frontend
```

### WebSocket Connection Issues

```bash
# Check backend WebSocket endpoint
curl http://localhost:8001/ws

# Verify CORS settings
cat /opt/dockerwakeup/backend/.env

# Check firewall
sudo ufw status
sudo firewall-cmd --list-all
```

### Docker Not Available

```bash
# Check Docker service
systemctl status docker

# Start Docker
sudo systemctl start docker

# Verify socket
ls -la /var/run/docker.sock

# Test Docker connection
docker version
```

## Updating

### Update All Components

```bash
dockerwakeup update
```

### Manual Update

```bash
# Update original DockerWakeUp
cd /opt/dockerwakeup/original-dockerwakeup
git pull

# Update WebUI (replace files from new release)
cd /opt/dockerwakeup
# Copy new files...

# Restart services
dockerwakeup restart
```

## Backup

```bash
# Backup MongoDB database
mongodump --db dockerwakeup --out /backup/mongodb/$(date +%Y%m%d)

# Backup configuration
tar -czf /backup/dockerwakeup-config-$(date +%Y%m%d).tar.gz \
    /opt/dockerwakeup/backend/.env \
    /opt/dockerwakeup/frontend/.env \
    /opt/dockerwakeup/config/

# Backup everything
tar -czf /backup/dockerwakeup-full-$(date +%Y%m%d).tar.gz \
    /opt/dockerwakeup
```

## Uninstallation

```bash
# Stop services
dockerwakeup stop

# Disable services
sudo systemctl disable dockerwakeup-backend
sudo systemctl disable dockerwakeup-frontend
sudo systemctl disable dockerwakeup-monitor

# Remove service files
sudo rm /etc/systemd/system/dockerwakeup-*.service
sudo systemctl daemon-reload

# Remove installation directory
sudo rm -rf /opt/dockerwakeup

# Remove management script
sudo rm /usr/local/bin/dockerwakeup

# Optional: Remove MongoDB data
sudo systemctl stop mongodb
sudo rm -rf /var/lib/mongodb/dockerwakeup
```

## Security Recommendations

1. **Change Default Ports** (if exposed to internet)
2. **Use Nginx Proxy Manager** with SSL
3. **Enable Authentication** (add to WebUI settings)
4. **Restrict Docker Socket Access**
5. **Use Firewall Rules**
6. **Regular Backups**
7. **Keep Systems Updated**

## Advanced Configuration

### Custom Port Configuration

Edit systemd service files:

```bash
# Backend port
sudo nano /etc/systemd/system/dockerwakeup-backend.service
# Change --port 8001 to desired port

# Frontend port
sudo nano /etc/systemd/system/dockerwakeup-frontend.service
# Change -l 9999 to desired port

# Reload and restart
sudo systemctl daemon-reload
dockerwakeup restart
```

### Running Behind Proxy

Update frontend `.env`:

```env
REACT_APP_BACKEND_URL=https://yourdomain.com/api
```

### Multiple Server Setup

DockerWakeUp can manage Docker on the local server. For multi-server:

1. Install DockerWakeUp on each server
2. Use Nginx Proxy Manager to route to each instance
3. Or implement Docker remote API access (advanced)

## Support

- Original DockerWakeUp: https://github.com/jelliott2021/DockerWakeUp
- WebUI Issues: Report in your deployment repo
- Docker Documentation: https://docs.docker.com

## License

DockerWakeUp Complete combines:
- Original DockerWakeUp (see original repository license)
- WebUI Dashboard (MIT License)

---

**DockerWakeUp Complete - Full-Featured Docker Management** 🐳
