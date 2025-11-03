# 🐳 DockerWakeUp WebUI - Complete Edition

**Professional Docker Container Management Dashboard with Real-Time Monitoring**

A modern, feature-rich web interface for managing Docker containers, images, volumes, and networks with real-time WebSocket updates, beautiful dark/light themes, and comprehensive monitoring capabilities.

## ✨ Key Features

- 🎯 **Complete Container Management** - Start, stop, pause, restart, remove, create
- 📊 **Real-Time Monitoring** - Live CPU, memory, disk via WebSockets  
- 🌐 **Network Management** - Create, view, delete networks with topology
- 💾 **Volume Management** - Create, list, delete Docker volumes
- 🖼️ **Image Management** - Pull, list, prune images
- 🔍 **Advanced Search & Filters** - Instant search and filtering
- 📱 **Grid/List View Toggle** - Switch layouts
- ⌨️ **Keyboard Shortcuts** - Ctrl+K command palette
- 🌓 **Dark/Light Themes** - Beautiful theme switching
- 🔧 **NPM Integration** - Nginx Proxy Manager support
- 📝 **Activity Logging** - Complete operation history
- 🔎 **Container Inspect** - Full container details
- 📡 **Network Details** - IPs, gateways, subnets, ports

## 🚀 Quick Start (Docker)

### One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/dockerwakeup/main/docker-install.sh | sudo bash
```

### Docker Compose (Recommended)

```bash
# Clone or download files
cd /opt/dockerwakeup

# Start services
docker-compose up -d

# Access dashboard
http://YOUR_SERVER_IP:9999
```

### Quick Start

```bash
./quickstart.sh
```

## 📦 What Gets Installed

**Docker Containers:**
1. **dockerwakeup-frontend** - Nginx + React (Port 9999)
2. **dockerwakeup-backend** - FastAPI + WebSocket (Port 8001)
3. **dockerwakeup-mongodb** - MongoDB database

**Management CLI:**
```bash
dockerwakeup start|stop|restart|status|logs|update|rebuild
```

## 🎯 All Features

### 7 Complete Pages
1. **Dashboard** - Container management with search/filter
2. **Images** - Pull, list, prune images
3. **Volumes** - Volume management
4. **Networks** - Network topology
5. **System Info** - Docker system details
6. **Activity Logs** - Operation history
7. **Settings** - Full configuration

### Container Operations
✅ Create with full config (ports, volumes, env, networks)
✅ Start/Stop/Pause/Restart/Remove
✅ Bulk operations (multi-select)
✅ View real-time logs
✅ Inspect full details
✅ Network information
✅ Health checks
✅ Dependencies

### UI/UX
✅ Search & filter system
✅ Grid/List view toggle
✅ Command palette (Ctrl+K)
✅ Dark/Light themes
✅ Real-time updates
✅ Beautiful animations
✅ Toast notifications
✅ Responsive design

## 📚 Documentation

- **[Docker Install Guide](DOCKER_INSTALL.md)** - Complete Docker setup
- **[Installation Guide](INSTALL_GUIDE.md)** - Alternative methods
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment
- **API Docs**: `http://YOUR_SERVER_IP:8001/docs`

## 🔧 Configuration

See [DOCKER_INSTALL.md](DOCKER_INSTALL.md) for detailed configuration options.

## 🌐 NPM Integration

Automatically detects Nginx Proxy Manager and provides integration guides with network IPs for easy proxy configuration.

## 📊 Tech Stack

- React 19 + TailwindCSS + shadcn/ui
- FastAPI + Python 3.11
- MongoDB 7
- Docker SDK
- WebSocket (native)
- Nginx

## 📄 License

MIT License

## 🙏 Credits

Built with FastAPI, React, and MongoDB for the Docker community.

---

**Access at: `http://YOUR_SERVER_IP:9999`**

**Manage Docker Like a Pro** 🚀
