# 🐳 DockerWakeUp COMPLETE - Installation Guide

## Single Docker Installation for Both Components

This installation includes **BOTH**:
1. ✅ **Original DockerWakeUp** - Container wake/sleep monitoring script
2. ✅ **WebUI Dashboard** - Modern web management interface

Both run together in a unified Docker Compose stack.

---

## 🚀 Quick Installation

### One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/dockerwakeup-complete/main/docker-install.sh | sudo bash
```

**What This Does:**
- Checks Docker & Docker Compose
- Creates `/opt/dockerwakeup` directory
- Clones original DockerWakeUp from GitHub
- Sets up WebUI backend and frontend
- Builds 4 Docker containers
- Starts all services
- Creates `dockerwakeup` CLI command

**Installation Time**: 5-10 minutes

---

## 📦 Services Installed

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DockerWakeUp COMPLETE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. DockerWakeUp Monitor (Original Script)          │  │
│  │     - Container wake/sleep automation               │  │
│  │     - Idle timeout management                       │  │
│  │     - Auto-detect compose containers                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. WebUI Backend (FastAPI)          Port: 8001     │  │
│  │     - REST API + WebSocket                          │  │
│  │     - Container management                          │  │
│  │     - Real-time monitoring                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. WebUI Frontend (React)           Port: 9999     │  │
│  │     - Modern dashboard                              │  │
│  │     - Search & filters                              │  │
│  │     - Dark/Light themes                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  4. MongoDB (Database)               Port: Internal │  │
│  │     - Shared by both systems                        │  │
│  │     - Persistent volume                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│              All connected to: dockerwakeup-network         │
└─────────────────────────────────────────────────────────────┘
```

### Docker Containers

1. **dockerwakeup-monitor** - Original DockerWakeUp script
2. **dockerwakeup-backend** - WebUI API (Port 8001)
3. **dockerwakeup-frontend** - WebUI Dashboard (Port 9999)
4. **dockerwakeup-mongodb** - Shared MongoDB database

---

## 🎯 How They Work Together

### Original DockerWakeUp
- **Monitors** container activity in background
- **Manages** idle timeout and auto-sleep
- **Wakes** containers on demand
- **Detects** compose projects automatically
- **Logs** activity to shared MongoDB

### WebUI Dashboard
- **Visualizes** all containers in real-time
- **Controls** containers (start/stop/pause/restart)
- **Displays** network topology and details
- **Manages** volumes, networks, images
- **Shows** system metrics and stats
- **Provides** search, filters, bulk operations

### Shared Database
- Both systems use the same MongoDB
- Activity logs from both visible in WebUI
- Unified monitoring and management
- Complete history tracking

---

## 🔧 Management Commands

### CLI Tool

After installation, use `dockerwakeup` command:

```bash
# Service Control
dockerwakeup start       # Start all 4 containers
dockerwakeup stop        # Stop all containers
dockerwakeup restart     # Restart everything
dockerwakeup status      # Show status of all services

# Logs
dockerwakeup logs all              # All logs
dockerwakeup logs monitor          # Original DockerWakeUp
dockerwakeup logs backend          # WebUI API
dockerwakeup logs frontend         # WebUI Dashboard
dockerwakeup logs mongodb          # Database

# Maintenance
dockerwakeup update      # Pull latest and restart
dockerwakeup rebuild     # Full rebuild
dockerwakeup down        # Stop and remove
dockerwakeup info        # Installation details
```

### Docker Compose

```bash
cd /opt/dockerwakeup

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f
docker-compose logs -f dockerwakeup-monitor
docker-compose logs -f backend

# Status
docker-compose ps

# Restart specific service
docker-compose restart dockerwakeup-monitor
```

---

## 📁 Directory Structure

```
/opt/dockerwakeup/
├── backend/                      # WebUI Backend
│   ├── Dockerfile
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/                     # WebUI Frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── src/
│   └── .env
├── dockerwakeup-original/       # Original DockerWakeUp
│   ├── Dockerfile
│   ├── config.json
│   └── *.py (cloned from GitHub)
└── docker-compose.yml           # Orchestration
```

---

## 🌐 Access the Applications

### WebUI Dashboard
```
http://YOUR_SERVER_IP:9999
```

**Features Available:**
- Container management
- Real-time monitoring
- Network topology
- Volume management
- Image operations
- System information
- Settings configuration

### API Documentation
```
http://YOUR_SERVER_IP:8001/docs
```

### Original DockerWakeUp
- Runs in background (no UI)
- Check logs: `dockerwakeup logs monitor`
- Configure: Edit `/opt/dockerwakeup/dockerwakeup-original/config.json`

---

## ⚙️ Configuration

### Original DockerWakeUp Config

Edit `/opt/dockerwakeup/dockerwakeup-original/config.json`:

```json
{
  "idleThreshold": 3600,      // Idle timeout in seconds
  "pollInterval": 30,          // Poll every 30 seconds
  "composeDirs": ["/opt"],    // Directories to scan
  "autoDetect": true,          // Auto-detect containers
  "wakeOnRequest": true        // Wake containers on request
}
```

### WebUI Backend Config

Edit `/opt/dockerwakeup/backend/.env`:

```env
MONGO_URL=mongodb://mongodb:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
```

### Frontend Config

Edit `/opt/dockerwakeup/frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:9999
```

After changes:
```bash
dockerwakeup rebuild
```

---

## 🔄 Updating

### Update Both Systems

```bash
dockerwakeup update
```

This will:
1. Pull latest original DockerWakeUp from GitHub
2. Pull latest Docker images
3. Rebuild and restart all services

### Manual Update

```bash
cd /opt/dockerwakeup

# Update original DockerWakeUp
cd dockerwakeup-original
git pull
cd ..

# Rebuild all
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Check All Services

```bash
dockerwakeup status
```

### View Logs

```bash
# All logs
dockerwakeup logs all

# Specific service
dockerwakeup logs monitor    # Original DockerWakeUp
dockerwakeup logs backend    # WebUI API
dockerwakeup logs frontend   # WebUI Dashboard
dockerwakeup logs mongodb    # Database
```

### Common Issues

**1. Original DockerWakeUp Not Running**
```bash
docker-compose logs dockerwakeup-monitor
docker exec -it dockerwakeup-monitor sh
ls -la /app
```

**2. WebUI Can't Connect**
```bash
# Check backend
curl http://localhost:8001/api/

# Check frontend
curl http://localhost:9999/

# Verify all running
docker-compose ps
```

**3. Docker Socket Access**
```bash
# Verify socket exists
ls -la /var/run/docker.sock

# Check mount in backend
docker inspect dockerwakeup-backend | grep docker.sock

# Check mount in monitor
docker inspect dockerwakeup-monitor | grep docker.sock
```

**4. Services Won't Start**
```bash
# Check Docker
systemctl status docker

# Check ports
sudo lsof -i :9999
sudo lsof -i :8001

# Rebuild
dockerwakeup rebuild
```

---

## 💾 Backup & Restore

### Backup Everything

```bash
# Stop services
dockerwakeup stop

# Backup MongoDB volume
docker run --rm \
  -v dockerwakeup_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup-$(date +%Y%m%d).tar.gz /data

# Backup configuration
tar -czf dockerwakeup-config-$(date +%Y%m%d).tar.gz \
  /opt/dockerwakeup/backend/.env \
  /opt/dockerwakeup/frontend/.env \
  /opt/dockerwakeup/dockerwakeup-original/config.json

# Start services
dockerwakeup start
```

### Restore

```bash
dockerwakeup down

# Restore volume
docker run --rm \
  -v dockerwakeup_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mongodb-backup-20231103.tar.gz -C /

dockerwakeup start
```

---

## 🔐 Security

- Docker socket mounted as **read-only** (`:ro`)
- Services isolated in dedicated network
- MongoDB not exposed externally
- Health checks prevent zombie containers
- Activity logging for audit trails

### Production Recommendations

1. Use Nginx Proxy Manager with SSL
2. Restrict CORS to specific domains
3. Enable firewall rules
4. Regular backups
5. Monitor container health
6. Keep Docker updated

---

## 🗑️ Uninstallation

```bash
# Stop and remove all containers
cd /opt/dockerwakeup
docker-compose down

# Remove volumes (⚠️ deletes data)
docker volume rm dockerwakeup_mongodb_data

# Remove images
docker rmi $(docker images | grep dockerwakeup | awk '{print $3}')

# Remove files
sudo rm -rf /opt/dockerwakeup
sudo rm /usr/local/bin/dockerwakeup
```

---

## 📊 Monitoring Both Systems

### Check Original DockerWakeUp

```bash
# View logs
dockerwakeup logs monitor

# Check if monitoring
docker exec dockerwakeup-monitor ps aux

# View config
docker exec dockerwakeup-monitor cat /app/config.json
```

### Check WebUI

```bash
# Access dashboard
open http://YOUR_SERVER_IP:9999

# Check API
curl http://YOUR_SERVER_IP:8001/api/

# View logs
dockerwakeup logs backend
```

### View Combined Activity

- All activities from both systems appear in WebUI Activity Logs
- Shared MongoDB database
- Unified monitoring

---

## 🎯 Use Cases

### Scenario 1: Automatic Container Management
- Original DockerWakeUp monitors and manages idle containers
- WebUI provides visual oversight
- Click containers in WebUI to wake/sleep
- Monitor logs in Activity Logs page

### Scenario 2: Manual Management
- Use WebUI for manual container control
- Original DockerWakeUp runs in background
- Both systems share Docker socket
- Coordinated container management

### Scenario 3: Hybrid Approach
- Original DockerWakeUp handles automation
- WebUI for manual interventions
- Complete visibility in dashboard
- Unified logging and monitoring

---

## 🔧 Advanced Configuration

### Add to Existing Networks

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    networks:
      - dockerwakeup
      - your_existing_network

networks:
  your_existing_network:
    external: true
```

### Custom Ports

```yaml
services:
  frontend:
    ports:
      - "3000:80"  # Change 3000 to your port
```

### Resource Limits

```yaml
services:
  dockerwakeup-monitor:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

---

## 📈 What Each System Does

### Original DockerWakeUp (Monitor Service)

**Primary Functions:**
- Monitors container idle time
- Auto-sleeps idle containers
- Wakes containers on request
- Detects docker-compose projects
- Manages container lifecycle

**Access:**
- No UI (background service)
- Configure via `config.json`
- View logs: `dockerwakeup logs monitor`

### WebUI Dashboard

**Primary Functions:**
- Visual container management
- Real-time monitoring dashboard
- Network topology viewing
- Image, volume, network management
- Search, filter, bulk operations
- Settings configuration

**Access:**
- Web UI: `http://YOUR_SERVER_IP:9999`
- API: `http://YOUR_SERVER_IP:8001/docs`

---

## 🌟 Benefits of Combined Installation

✅ **Automation + Control** - Best of both worlds
✅ **Single Installation** - One command setup
✅ **Unified Logging** - Shared MongoDB database
✅ **Coordinated Management** - Both access same containers
✅ **Complete Visibility** - WebUI shows all activity
✅ **Easy Updates** - Update both with one command
✅ **Persistent Data** - Shared database and volumes
✅ **Production Ready** - Health checks, auto-restart

---

## 📞 Support

- **Check Status**: `dockerwakeup status`
- **View Logs**: `dockerwakeup logs all`
- **Original Repo**: https://github.com/jelliott2021/DockerWakeUp
- **Documentation**: See `/opt/dockerwakeup/README.md`

---

**Single Installation. Dual Functionality. Complete Solution.** 🚀

**Install Command:**
```bash
curl -fsSL https://your-url/docker-install.sh | sudo bash
```

**Access:**
```
http://YOUR_SERVER_IP:9999
```
