# DockerWakeUp Complete - Standalone Setup

**Complete Docker Management Solution with WebUI Dashboard**

This package combines the original [DockerWakeUp](https://github.com/jelliott2021/DockerWakeUp) container monitoring script with a powerful web-based management interface.

## 🌟 What's Included

### 1. Original DockerWakeUp
- Container wake-on-demand functionality  
- Idle timeout management
- Automatic container sleep/wake
- Compose and docker-run support

### 2. WebUI Dashboard
- 🎯 Real-time container monitoring
- 🚀 Start/Stop/Pause/Restart/Remove containers
- 📊 System metrics (CPU, Memory, Disk)
- 🌐 Detailed network information
- 📦 Image management
- 📝 Activity logging
- ⚙️ Settings configuration
- 🌓 Dark/Light theme
- 🔌 Nginx Proxy Manager integration

## 🚀 Quick Installation

### One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/dockerwakeup-complete/main/install.sh | sudo bash
```

### Manual Installation

```bash
# Download installer
wget https://github.com/your-repo/dockerwakeup-complete/archive/main.tar.gz
tar -xzf main.tar.gz
cd dockerwakeup-complete-main

# Run installer
sudo ./install.sh
```

## 📋 System Requirements

- **OS**: Ubuntu 20.04+, Debian 10+, CentOS 7+, RHEL 7+
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 10GB free space
- **Docker**: Version 20.10+
- **Ports**: 8001 (API), 9999 (WebUI)

## 📦 Installation Process

The installer will:

1. ✅ Install system dependencies (Docker, Python, Node.js, MongoDB)
2. ✅ Clone original DockerWakeUp repository
3. ✅ Set up WebUI backend (FastAPI)
4. ✅ Build and deploy frontend (React)
5. ✅ Create systemd services
6. ✅ Configure firewall rules
7. ✅ Start all services
8. ✅ Create management commands

### Installation Time
Approximately **5-10 minutes** depending on your server specs and internet speed.

## 🎯 Post-Installation

### Access the Dashboard

```
http://YOUR_SERVER_IP:9999
```

### Default Configuration

- **WebUI Port**: 9999
- **API Port**: 8001  
- **MongoDB**: localhost:27017
- **Installation Dir**: /opt/dockerwakeup

## 🔧 Management Commands

A convenient `dockerwakeup` CLI is installed:

```bash
# Start all services
dockerwakeup start

# Stop all services
dockerwakeup stop

# Restart all services
dockerwakeup restart

# Check status
dockerwakeup status

# View logs
dockerwakeup logs backend
dockerwakeup logs frontend
dockerwakeup logs monitor

# Update to latest version
dockerwakeup update
```

## 📁 Directory Structure

```
/opt/dockerwakeup/
├── backend/                    # FastAPI Backend
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/
├── frontend/                   # React Frontend  
│   ├── build/
│   ├── package.json
│   └── .env
├── scripts/                    # Original DockerWakeUp
│   └── *.py
├── config/                     # Configuration
│   └── config.json
├── logs/                       # Application logs
├── original-dockerwakeup/     # Git repository
└── dockerwakeup-ctl           # Management script
```

## 🌐 Nginx Proxy Manager Integration

### Auto-Detection
DockerWakeUp automatically detects NPM containers and provides:
- Special badges in UI
- Network integration guides  
- Internal IP addresses for proxy configuration

### Setup Reverse Proxy

1. **In NPM**, create a Proxy Host:
   - Domain: `dockerwakeup.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: `YOUR_SERVER_IP`
   - Forward Port: `9999`
   - ✅ Enable WebSockets Support
   - ✅ Request SSL Certificate

2. **Access via domain**:
   ```
   https://dockerwakeup.yourdomain.com
   ```

## 🔒 Security Recommendations

1. **Use Nginx Proxy Manager** with SSL
2. **Enable Firewall**:
   ```bash
   sudo ufw allow 9999/tcp
   sudo ufw allow 8001/tcp  # Only if needed externally
   ```
3. **Change default ports** (edit systemd services)
4. **Restrict access** to local network only
5. **Regular backups** of MongoDB

## 🔄 Updating

### Automatic Update

```bash
dockerwakeup update
```

### Manual Update

```bash
cd /opt/dockerwakeup/original-dockerwakeup
git pull
sudo systemctl restart dockerwakeup-backend
sudo systemctl restart dockerwakeup-frontend
```

## 🐛 Troubleshooting

### Check Service Status

```bash
dockerwakeup status
```

### View Logs

```bash
# Backend logs
journalctl -u dockerwakeup-backend -f

# Frontend logs  
journalctl -u dockerwakeup-frontend -f

# Monitor logs
journalctl -u dockerwakeup-monitor -f
```

### Common Issues

**1. Docker Not Available**
```bash
# Verify Docker is running
sudo systemctl status docker
sudo systemctl start docker

# Check socket permissions
ls -la /var/run/docker.sock
```

**2. Port Already in Use**
```bash
# Check what's using the ports
sudo lsof -i :9999
sudo lsof -i :8001

# Change ports in systemd services
sudo nano /etc/systemd/system/dockerwakeup-frontend.service
```

**3. MongoDB Connection Failed**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

**4. WebSocket Not Connecting**
```bash
# Check backend WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8001/ws

# Verify CORS settings
cat /opt/dockerwakeup/backend/.env
```

## 💾 Backup & Restore

### Backup

```bash
# Full backup
sudo tar -czf dockerwakeup-backup-$(date +%Y%m%d).tar.gz /opt/dockerwakeup

# Database backup
mongodump --db dockerwakeup --out /backup/mongodb-$(date +%Y%m%d)

# Configuration backup
sudo tar -czf config-backup.tar.gz \
    /opt/dockerwakeup/backend/.env \
    /opt/dockerwakeup/frontend/.env \
    /opt/dockerwakeup/config/
```

### Restore

```bash
# Stop services
dockerwakeup stop

# Restore files
sudo tar -xzf dockerwakeup-backup-20231103.tar.gz -C /

# Restore database
mongorestore --db dockerwakeup /backup/mongodb-20231103/dockerwakeup

# Restart services
dockerwakeup start
```

## 🗑️ Uninstallation

```bash
# Download uninstaller
wget https://raw.githubusercontent.com/your-repo/dockerwakeup-complete/main/uninstall.sh

# Run uninstaller
sudo bash uninstall.sh
```

Or manually:

```bash
# Stop and disable services
dockerwakeup stop
sudo systemctl disable dockerwakeup-backend
sudo systemctl disable dockerwakeup-frontend
sudo systemctl disable dockerwakeup-monitor

# Remove files
sudo rm -rf /opt/dockerwakeup
sudo rm /usr/local/bin/dockerwakeup
sudo rm /etc/systemd/system/dockerwakeup-*.service
sudo systemctl daemon-reload
```

## 📚 Documentation

- **Installation Guide**: See [INSTALL_GUIDE.md](INSTALL_GUIDE.md)
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Documentation**: Available at `http://YOUR_SERVER_IP:8001/docs`
- **Original DockerWakeUp**: https://github.com/jelliott2021/DockerWakeUp

## 🎯 Features Overview

### Dashboard
- Real-time container monitoring
- CPU, Memory, Disk metrics
- Container cards with actions
- Bulk operations
- WebSocket live updates

### Network Information
- Detailed network topology
- IP addresses per network
- Port mappings table
- NPM integration guide
- MAC addresses
- Gateway information

### Container Management
- Create new containers
- Start/Stop/Pause/Restart
- Remove containers
- View logs in real-time
- Network configuration
- Environment variables
- Volume mounts
- Port mappings

### Image Management
- List all Docker images
- Prune unused images
- Track space usage
- Image details

### Settings
- System configuration
- Container defaults
- Display preferences
- Notifications
- Dark/Light theme
- Advanced options

## 🤝 Support

### Getting Help

1. **Check Logs**: `dockerwakeup logs [service]`
2. **Service Status**: `dockerwakeup status`
3. **Documentation**: Review guides in /opt/dockerwakeup
4. **Original Project**: https://github.com/jelliott2021/DockerWakeUp

### Reporting Issues

When reporting issues, include:
- OS and version
- Docker version
- Installation method
- Relevant logs
- Steps to reproduce

## 📄 License

- **WebUI Dashboard**: MIT License
- **Original DockerWakeUp**: See https://github.com/jelliott2021/DockerWakeUp

## 🙏 Credits

- Original DockerWakeUp by [@jelliott2021](https://github.com/jelliott2021)
- WebUI Dashboard integration
- Built with FastAPI, React, and MongoDB

---

## 🚀 Quick Start Example

```bash
# Install DockerWakeUp Complete
curl -fsSL https://your-installer-url/install.sh | sudo bash

# Wait for installation to complete (5-10 minutes)

# Access the dashboard
firefox http://$(hostname -I | awk '{print $1}'):9999

# Or use the CLI
dockerwakeup status
```

---

**DockerWakeUp Complete - Professional Docker Management Made Easy** 🐳✨
