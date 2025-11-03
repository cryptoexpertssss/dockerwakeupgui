# DockerWakeUp WebUI

**A modern, real-time Docker container management dashboard**

DockerWakeUp WebUI is a web-based Docker management tool for monitoring, controlling, and managing both Docker Compose and docker run containers with real-time WebSocket updates and a beautiful dark theme.

## 🚀 Features

### Core Functionality
- ✅ **Container Management**: Start, stop, pause, restart, remove containers
- ✅ **Real-time Monitoring**: Live CPU, memory, and disk usage via WebSockets
- ✅ **Bulk Operations**: Manage multiple containers simultaneously
- ✅ **Image Management**: View, prune, and manage Docker images
- ✅ **Activity Logging**: Track all container operations
- ✅ **Container Logs**: View and stream container logs in real-time
- ✅ **Type Detection**: Automatically detect Docker Compose vs docker run containers

### Technical Stack
- **Backend**: FastAPI (Python) with native WebSockets
- **Frontend**: React 19 with modern UI components
- **Database**: MongoDB for activity logs
- **Real-time**: WebSocket for live updates
- **Styling**: TailwindCSS with custom dark theme
- **Components**: shadcn/ui components

## 📋 Requirements

- Docker installed and running
- Docker socket access (`/var/run/docker.sock`)
- Python 3.11+
- Node.js 18+
- MongoDB

## 🛠️ Installation

### Method 1: Direct Installation on Server (192.168.1.102)

1. **Clone the repository**:
```bash
git clone <repository-url>
cd dockerwakeup-webui
```

2. **Install Backend Dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure Backend Environment**:
```bash
cp .env.example .env
# Edit .env and set:
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=dockerwakeup
# CORS_ORIGINS=*
```

4. **Install Frontend Dependencies**:
```bash
cd ../frontend
yarn install
```

5. **Build Frontend**:
```bash
yarn build
```

6. **Start the Application**:
```bash
# Start backend (from backend directory)
uvicorn server:app --host 0.0.0.0 --port 8001

# Serve frontend build (use nginx or serve package)
npx serve -s build -l 3000
```

### Method 2: Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:latest
    container_name: dockerwakeup-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: dockerwakeup-backend
    ports:
      - "8001:8001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=dockerwakeup
      - CORS_ORIGINS=*
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: dockerwakeup-frontend
    ports:
      - "9999:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

Then run:
```bash
docker-compose up -d
```

### Method 3: Using Systemd Service

Create `/etc/systemd/system/dockerwakeup-backend.service`:

```ini
[Unit]
Description=DockerWakeUp Backend
After=docker.service mongodb.service
Requires=docker.service

[Service]
WorkingDirectory=/opt/dockerwakeup-webui/backend
ExecStart=/usr/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
User=root
Environment=MONGO_URL=mongodb://localhost:27017
Environment=DB_NAME=dockerwakeup
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dockerwakeup-backend

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/dockerwakeup-frontend.service`:

```ini
[Unit]
Description=DockerWakeUp Frontend
After=dockerwakeup-backend.service

[Service]
WorkingDirectory=/opt/dockerwakeup-webui/frontend/build
ExecStart=/usr/bin/npx serve -s . -l 9999
Restart=always
User=root
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dockerwakeup-frontend

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dockerwakeup-backend dockerwakeup-frontend
sudo systemctl start dockerwakeup-backend dockerwakeup-frontend
```

## 🔧 Configuration

### Backend Configuration (backend/.env)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
```

### Frontend Configuration (frontend/.env)

```env
REACT_APP_BACKEND_URL=http://192.168.1.102:8001
```

## 📡 API Endpoints

### Container Operations
- `GET /api/containers` - List all containers
- `POST /api/container/{name}/{action}` - Perform action on container
- `POST /api/containers/bulk` - Bulk operations
- `GET /api/logs/{name}` - Get container logs

### Image Operations
- `GET /api/images` - List all images
- `POST /api/images/prune` - Prune unused images

### System
- `GET /api/system/metrics` - Get system metrics
- `GET /api/activity-logs` - Get activity logs
- `WS /ws` - WebSocket endpoint for real-time updates

## 🎨 Features Overview

### Dashboard
- Real-time container grid view
- System metrics (CPU, Memory, Disk)
- Container status indicators
- Quick action buttons
- Bulk selection and operations

### Container Management
- Start/Stop/Pause/Restart/Remove actions
- Real-time stats per container
- Port mappings display
- Container logs viewer
- Type detection (Compose 📦 vs Docker Run 🐋)

### Image Management
- List all Docker images
- Image details (repository, tag, size, created)
- Prune unused images
- Space reclamation tracking

### Activity Logs
- Chronological event log
- Success/failure tracking
- Container-specific logs
- Real-time updates

## 🚀 Usage

1. **Access the Dashboard**:
   - Open browser to `http://192.168.1.102:9999`
   - Dashboard loads with real-time container data

2. **Manage Containers**:
   - Click on container cards to view details
   - Use action buttons for control
   - Select multiple containers for bulk operations

3. **View Logs**:
   - Click log icon on container card
   - Real-time log streaming
   - Auto-scroll to latest

4. **Manage Images**:
   - Navigate to Images page
   - View all Docker images
   - Prune unused images to reclaim space

5. **Monitor Activity**:
   - Navigate to Activity Logs
   - View all operations history
   - Filter by success/failure

## 🔒 Security Considerations

⚠️ **Important**: This application requires access to Docker socket which provides full Docker control.

- Ensure proper network security (firewall rules)
- Use HTTPS in production
- Implement authentication for production use
- Limit access to trusted networks only

## 🐛 Troubleshooting

### Docker Not Available
**Symptom**: "Docker is not available" warning

**Solutions**:
1. Ensure Docker is installed and running
2. Verify Docker socket exists: `ls -la /var/run/docker.sock`
3. Check Docker socket permissions
4. For Docker Compose deployment, ensure socket is mounted

### WebSocket Connection Failed
**Symptom**: "Disconnected" status in dashboard

**Solutions**:
1. Check backend is running on port 8001
2. Verify no firewall blocking WebSocket connections
3. Check backend logs: `journalctl -u dockerwakeup-backend -f`

### Containers Not Loading
**Symptom**: Empty container list

**Solutions**:
1. Verify Docker containers exist: `docker ps -a`
2. Check backend API: `curl http://localhost:8001/api/containers`
3. Review backend logs for errors

## 📊 Performance

- Handles 50+ containers efficiently
- WebSocket updates every 3 seconds
- Minimal CPU overhead
- Real-time responsiveness

## 🛣️ Roadmap

- [ ] Multi-host support (remote Docker APIs)
- [ ] JWT authentication
- [ ] Webhook notifications (Telegram/Slack)
- [ ] Container templates
- [ ] GraphQL API
- [ ] Export logs (JSON/CSV)
- [ ] Docker Swarm support
- [ ] Kubernetes integration

## 📝 License

MIT License - Feel free to use for personal and commercial projects

## 🤝 Contributing

Contributions welcome! Please submit issues and pull requests.

## 📧 Support

For issues and questions, please open a GitHub issue.

---

**Built with FastAPI + React + MongoDB**

Made with ❤️ for the Docker community
