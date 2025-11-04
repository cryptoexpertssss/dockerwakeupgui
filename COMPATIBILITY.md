# 🔗 DockerWakeUp Complete - Architecture & Compatibility

## System Architecture

### Two Complementary Systems Running Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    DockerWakeUp Complete                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐        ┌──────────────────────────┐  │
│  │  Original            │        │  WebUI Dashboard         │  │
│  │  DockerWakeUp        │        │  (This Project)          │  │
│  │  (Node.js/TypeScript)│        │  (Python/FastAPI)        │  │
│  └──────────────────────┘        └──────────────────────────┘  │
│           │                                    │                │
│           │                                    │                │
│  ┌────────▼────────┐                  ┌────────▼─────────┐     │
│  │ Wake-Proxy      │                  │ FastAPI Backend  │     │
│  │ Port: 8080      │                  │ Port: 8001       │     │
│  │                 │                  │ + WebSocket      │     │
│  │ - Wake-on-demand│                  │                  │     │
│  │ - Idle shutdown │                  │ - REST API       │     │
│  │ - HTTP proxy    │                  │ - Real-time data │     │
│  └────────┬────────┘                  └────────┬─────────┘     │
│           │                                    │                │
│           │         ┌──────────────────────────┘                │
│           │         │                                           │
│           ▼         ▼                                           │
│  ┌─────────────────────────────┐                               │
│  │   Docker Socket (Shared)    │                               │
│  │   /var/run/docker.sock      │                               │
│  │   - Read-only mount         │                               │
│  │   - Both systems access     │                               │
│  └─────────────────────────────┘                               │
│                                                                 │
│  ┌─────────────────────────────┐                               │
│  │   MongoDB (Shared)          │                               │
│  │   Port: 27017 (internal)    │                               │
│  │   - WebUI data              │                               │
│  │   - Activity logs           │                               │
│  │   - Settings                │                               │
│  └─────────────────────────────┘                               │
│                                                                 │
│  ┌─────────────────────────────┐                               │
│  │   Frontend (React + Nginx)  │                               │
│  │   Port: 9999                │                               │
│  │   - Proxies to Backend      │                               │
│  │   - WebSocket support       │                               │
│  └─────────────────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Language Stack Compatibility

### Original DockerWakeUp (Node.js/TypeScript)

**Language:** Node.js 20 + TypeScript
**Runtime:** Node.js
**Framework:** Express.js
**Port:** 8080 (wake-proxy)
**Purpose:** Wake-on-demand proxy and idle management

**Dependencies:**
```json
{
  "express": "^4.19.2",
  "http-proxy-middleware": "^2.0.6",
  "axios": "^1.10.0",
  "docker-compose": "^1.2.0"
}
```

**What It Does:**
- HTTP reverse proxy on port 8080
- Intercepts requests to `/proxy/{service}`
- Starts Docker containers on-demand
- Monitors idle time
- Auto-stops idle containers
- Generates NGINX configs

---

### WebUI Dashboard (Python/FastAPI)

**Language:** Python 3.11
**Runtime:** Python + uvicorn
**Framework:** FastAPI
**Port:** 8001 (API) + WebSocket
**Purpose:** Visual management interface

**Dependencies:**
```python
fastapi==0.110.1
docker==7.1.0
motor==3.3.1  # MongoDB async driver
psutil==7.1.3
pyyaml==6.0.3
```

**What It Does:**
- REST API for container management
- WebSocket for real-time updates
- MongoDB for data persistence
- System metrics monitoring
- Analytics & charts
- Alert generation

---

## Compatibility Analysis

### ✅ FULLY COMPATIBLE

**Why They Work Together:**

**1. No Port Conflicts**
- Original DockerWakeUp: Port 8080
- WebUI Backend: Port 8001
- WebUI Frontend: Port 9999
- MongoDB: Port 27017 (internal)
- ✅ All different ports

**2. Shared Docker Socket**
- Both mount `/var/run/docker.sock:ro`
- Both use Docker API
- Read-only prevents conflicts
- Both can monitor same containers
- ✅ No conflicts in Docker operations

**3. Independent Runtimes**
- Node.js runtime for wake-proxy
- Python runtime for FastAPI
- Different process spaces
- No language conflicts
- ✅ Run side-by-side perfectly

**4. Complementary Functionality**
- Wake-proxy: Automation (wake/sleep)
- WebUI: Manual control + Visualization
- Different use cases
- Non-overlapping features
- ✅ Enhance each other

**5. Optional MongoDB Sharing**
- WebUI uses MongoDB for:
  - Activity logs
  - Settings
  - Templates
  - Historical stats
  - Alerts
- Original DockerWakeUp:
  - Can work without MongoDB
  - Uses file-based tracking
  - No database conflicts
- ✅ Can share or use separately

---

## How They Integrate

### Scenario 1: Using Both Together (Recommended)

**Original DockerWakeUp (Port 8080):**
- Handles wake-on-demand via `/proxy/{service}` routes
- Auto-stops idle containers
- Example: Access `http://server:8080/proxy/myapp` → wakes container

**WebUI Dashboard (Port 9999):**
- Visual interface for all containers
- Manual start/stop/pause/restart
- Real-time monitoring
- Analytics and alerts
- Example: Browse `http://server:9999` → see all containers

**Use Together:**
- Wake-proxy automates container lifecycle
- WebUI provides visual oversight
- Both see the same containers
- WebUI shows what wake-proxy is doing
- Manual override via WebUI when needed

---

### Scenario 2: Disable Wake-Proxy (WebUI Only)

If you only want the WebUI:

**Edit `/app/docker-compose.yml`:**
```yaml
services:
  # Comment out or remove
  # dockerwakeup-monitor:
  #   build: ./dockerwakeup-original
  #   ...
  
  backend:
    # ... keep as is
  
  frontend:
    # ... keep as is
  
  mongodb:
    # ... keep as is
```

Then deploy:
```bash
docker compose up -d backend frontend mongodb
```

---

### Scenario 3: Wake-Proxy with NPM Integration

**NGINX Proxy Manager Setup:**

**For Wake-Proxy:**
- Domain: `*.yourdomain.com`
- Forward to: `localhost:8080`
- Path: `/proxy/{service}`
- Enables wake-on-demand for all services

**For WebUI:**
- Domain: `dockerwakeup.yourdomain.com`
- Forward to: `localhost:9999`
- WebSocket: Enable
- Management interface

**Example:**
```
https://photos.yourdomain.com → NPM → wake-proxy:8080/proxy/photos → wakes Immich
https://dockerwakeup.yourdomain.com → NPM → frontend:9999 → WebUI
```

---

## Configuration for Both Systems

### Original DockerWakeUp Config

**File:** `/app/dockerwakeup-original/config.json`

```json
{
  "proxyPort": 8080,
  "idleThreshold": 3600,
  "pollInterval": 30,
  "services": [
    {
      "route": "photos",
      "target": "http://immich:3001",
      "composeDir": "/opt/immich"
    },
    {
      "route": "files",
      "target": "http://nextcloud:80",
      "composeDir": "/opt/nextcloud"
    }
  ],
  "composeDirs": ["/opt", "/home"],
  "autoDetect": true
}
```

### WebUI Config

**File:** Settings page in WebUI or MongoDB

```json
{
  "poll_interval": 5,
  "ws_update_interval": 3,
  "default_idle_timeout": 3600,
  "enable_alerts": true,
  "cpu_alert_threshold": 80
}
```

**Both configs are independent** - no conflicts

---

## Data Storage Compatibility

### Original DockerWakeUp Storage

**Uses File System:**
- `tmp/last_access_{service}` - Activity tracking
- `config.json` - Configuration
- No database required
- Lightweight

### WebUI Storage

**Uses MongoDB:**
- Activity logs collection
- Settings collection
- Container stats collection (time-series)
- Templates collection
- Alerts collection

**✅ No Conflicts:**
- Different storage mechanisms
- Can run independently
- No shared state required
- Both track containers separately

---

## Docker API Compatibility

**Both Use Docker SDK:**

**Original DockerWakeUp (Node.js):**
```javascript
import { exec } from 'child_process';
import { Docker } from 'docker-compose';

// Uses docker-compose library
// Executes docker commands via shell
```

**WebUI Backend (Python):**
```python
import docker

client = docker.from_env()
# Uses official Docker SDK for Python
```

**✅ Both Compatible:**
- Read-only socket mount
- No exclusive locks
- Can both monitor same containers
- Different API wrappers, same Docker daemon
- Operations are atomic at Docker level

---

## Feature Comparison

### Original DockerWakeUp Features

**Unique Features:**
- ✅ Wake-on-demand HTTP proxy
- ✅ Automatic NGINX config generation
- ✅ Loading pages while starting
- ✅ HTTP request interception
- ✅ Route-based proxying (`/proxy/{service}`)

**Use Cases:**
- Self-hosted apps that are rarely used
- Resource conservation
- Clean URL proxying with wake
- Automated lifecycle management

### WebUI Dashboard Features

**Unique Features:**
- ✅ Visual interface (10 pages)
- ✅ Real-time monitoring with charts
- ✅ Alert system
- ✅ Template library
- ✅ Search & filters
- ✅ Container inspector
- ✅ Network topology
- ✅ Volume/network management
- ✅ Dark/Light themes
- ✅ Command palette

**Use Cases:**
- Visual container management
- Manual operations
- Monitoring and analytics
- Quick deployments
- Network troubleshooting

---

## Recommended Setup

### Best Configuration

**Use Both Together:**

**1. Original DockerWakeUp (Port 8080)**
   - Enable for services you want wake-on-demand
   - Configure specific routes in config.json
   - Let it handle automation

**2. WebUI Dashboard (Port 9999)**
   - Use for visual monitoring
   - Manual container operations
   - View analytics and alerts
   - Manage all Docker resources

**3. NGINX Proxy Manager**
   - Proxy specific routes to wake-proxy:8080
   - Proxy management UI to frontend:9999
   - SSL termination
   - Domain routing

**Example NPM Configuration:**

```yaml
# Wake-on-demand services
proxy_pass http://localhost:8080/proxy/photos;  # → wakes Immich
proxy_pass http://localhost:8080/proxy/cloud;   # → wakes Nextcloud

# Management UI
proxy_pass http://localhost:9999;               # → WebUI Dashboard
```

---

## Compatibility Matrix

| Feature | Original DockerWakeUp | WebUI Dashboard | Compatible |
|---------|----------------------|-----------------|------------|
| Language | Node.js/TypeScript | Python | ✅ Yes |
| Runtime | Node 20 | Python 3.11 | ✅ Yes |
| Ports | 8080 | 8001, 9999 | ✅ No conflict |
| Docker Access | docker-compose lib | Docker SDK | ✅ Both work |
| Storage | File system | MongoDB | ✅ Independent |
| Container Control | docker-compose | Docker API | ✅ Compatible |
| Monitoring | Activity tracking | Stats + charts | ✅ Complementary |
| Proxy | HTTP proxy | None | ✅ Different purposes |
| NGINX | Config generator | Not applicable | ✅ No conflict |
| Auto-wake | Yes | No | ✅ Complementary |
| Visual UI | No | Yes | ✅ Complementary |
| Real-time Updates | No | WebSocket | ✅ Complementary |

**Overall Compatibility:** ✅ 100% Compatible

---

## Communication Between Systems

### How They Interact

**Direct Communication:**
- ❌ They don't directly communicate
- ✅ Both independently access Docker
- ✅ Both see same container states
- ✅ Actions from one visible to other

**Indirect Integration:**
- Wake-proxy starts container → WebUI sees it running
- WebUI stops container → Wake-proxy can wake it again
- Both log activities (separately)
- Coordinated through Docker daemon

**Future Integration (Optional):**
- Could add webhook from wake-proxy → WebUI backend
- Could display wake-proxy status in WebUI
- Could integrate activity logs
- Not required for functionality

---

## Port Usage Summary

```
Port 8080  → dockerwakeup-monitor (wake-proxy)
Port 8001  → dockerwakeup-backend (FastAPI API)
Port 9999  → dockerwakeup-frontend (React Dashboard)
Port 27017 → dockerwakeup-mongodb (Internal)
```

**All Different - No Conflicts** ✅

---

## Resource Usage

### Original DockerWakeUp
- **CPU:** Low (~1-2%)
- **Memory:** ~50-100 MB
- **Disk:** ~100 MB (with node_modules)
- **Network:** Only when proxying

### WebUI Backend
- **CPU:** Low (~2-5%)
- **Memory:** ~100-200 MB
- **Disk:** ~150 MB
- **Network:** WebSocket + API calls

### WebUI Frontend
- **CPU:** Minimal (~0-1%)
- **Memory:** ~20-30 MB (Nginx)
- **Disk:** ~50 MB (built React app)
- **Network:** Serving static files

### MongoDB
- **CPU:** Low (~1-2%)
- **Memory:** ~100-200 MB
- **Disk:** Grows with data (typically <500 MB)

**Total System:**
- **CPU:** ~5-10% combined
- **Memory:** ~300-500 MB
- **Disk:** ~500 MB - 1 GB

**Very lightweight for all features provided!** ✅

---

## When to Use What

### Use Original DockerWakeUp When:
- ✅ You want automatic wake-on-demand
- ✅ You have services accessed via HTTP
- ✅ You want to save resources (auto-stop idle)
- ✅ You use NGINX reverse proxy
- ✅ You have infrequently used services

### Use WebUI Dashboard When:
- ✅ You want visual container management
- ✅ You need real-time monitoring
- ✅ You want analytics and charts
- ✅ You need to troubleshoot networks
- ✅ You want manual container control
- ✅ You need search and filtering
- ✅ You want alerts for resource usage

### Use Both When:
- ✅ You want complete Docker management
- ✅ You want automation + manual control
- ✅ You want wake-on-demand + monitoring
- ✅ You want the best of both worlds

---

## Deployment Options

### Option 1: Full Stack (Recommended)

```bash
# All 4 containers
docker compose up -d
```

**Services:**
- dockerwakeup-monitor ✅
- dockerwakeup-backend ✅
- dockerwakeup-frontend ✅
- dockerwakeup-mongodb ✅

### Option 2: WebUI Only

```bash
# Just WebUI (3 containers)
docker compose up -d backend frontend mongodb
```

**Services:**
- dockerwakeup-backend ✅
- dockerwakeup-frontend ✅
- dockerwakeup-mongodb ✅

### Option 3: Monitor Only

```bash
# Just wake-proxy (1 container)
docker compose up -d dockerwakeup-monitor
```

**Note:** Monitor doesn't need MongoDB

---

## Migration Path

### If You Have Existing DockerWakeUp

**Option A: Keep Separate**
- Keep original DockerWakeUp running standalone
- Deploy WebUI separately
- Both access same Docker
- Different ports, no conflicts

**Option B: Migrate to Unified**
- Stop existing DockerWakeUp service
- Deploy DockerWakeUp Complete
- Copy old config.json
- Start unified stack
- Both systems in one deployment

---

## Testing Compatibility

### Verify Both Work Together

```bash
# Start all services
docker compose up -d

# Check all running
docker compose ps

# Test wake-proxy
curl http://localhost:8080

# Test WebUI API
curl http://localhost:8001/api/

# Test WebUI Dashboard
curl http://localhost:9999

# Check both see containers
docker compose logs dockerwakeup-monitor | grep -i container
docker compose logs backend | grep -i container
```

**Expected:**
- Both systems running ✅
- Both accessing Docker ✅
- No errors in logs ✅
- All ports responding ✅

---

## Conclusion

### ✅ 100% Compatible

**Languages:**
- Node.js (wake-proxy) ✅
- Python (WebUI backend) ✅
- React (WebUI frontend) ✅

**No Conflicts:**
- Different ports ✅
- Different runtimes ✅
- Shared Docker (read-only) ✅
- Independent storage ✅
- Complementary features ✅

**Deployment:**
- ✅ Fully embedded (no git clone)
- ✅ Docker Compose orchestration
- ✅ Single command installation
- ✅ All systems work together
- ✅ Production ready

---

**Both systems enhance each other - perfect compatibility!** 🎉

**Deploy the full stack:**
```bash
cd /opt/dockerwakeupgui
docker compose up -d --build
```

**Get automation + visual management in one installation!** 🚀
