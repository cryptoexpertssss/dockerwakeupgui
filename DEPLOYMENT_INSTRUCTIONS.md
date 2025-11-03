# 🚀 DockerWakeUp Complete - Quick Deployment Instructions

## For Your Server (skynet - 192.168.1.102)

### Current Status
✅ Docker is installed and working
✅ You're in `/opt/dockerwakeupgui`
✅ Files are present

### Issues Fixed
- ✅ Removed obsolete `version` from docker-compose.yml
- ✅ Fixed frontend Dockerfile to handle missing yarn.lock

---

## 🔧 Deployment Steps

### Step 1: Copy Latest Files

From your development environment, copy these files to the server:

```bash
# On your development machine (or where you have the /app files)
scp -r /app/backend root@192.168.1.102:/opt/dockerwakeupgui/
scp -r /app/frontend root@192.168.1.102:/opt/dockerwakeupgui/
scp /app/docker-compose.yml root@192.168.1.102:/opt/dockerwakeupgui/
scp -r /app/dockerwakeup-original root@192.168.1.102:/opt/dockerwakeupgui/
```

### Step 2: On Server, Build and Start

```bash
# SSH to server
ssh root@skynet

# Navigate to directory
cd /opt/dockerwakeupgui

# Build and start (this will take 5-10 minutes on first build)
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 3: Access the Application

```
http://192.168.1.102:9999
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Build Failures

```bash
# Clean everything and rebuild
docker compose down
docker system prune -a -f
docker compose build --no-cache
docker compose up -d
```

### Issue 2: yarn.lock Missing

This is now fixed in the Dockerfile, but if you still have issues:

```bash
# On server, generate yarn.lock
cd /opt/dockerwakeupgui/frontend
docker run --rm -v $(pwd):/app -w /app node:18-alpine yarn install

# Then rebuild
cd /opt/dockerwakeupgui
docker compose up -d --build frontend
```

### Issue 3: Services Not Starting

```bash
# Check logs for each service
docker compose logs mongodb
docker compose logs backend
docker compose logs frontend
docker compose logs dockerwakeup-monitor

# Check Docker socket access
ls -la /var/run/docker.sock

# Restart specific service
docker compose restart backend
```

### Issue 4: Port Already in Use

```bash
# Check what's using the ports
sudo lsof -i :9999
sudo lsof -i :8001

# If needed, change ports in docker-compose.yml before starting
nano docker-compose.yml
# Change "9999:80" to "8080:80" for example
```

---

## 📋 Verification Steps

### 1. Check All Containers Running

```bash
docker compose ps
```

Expected output (all should be "Up"):
```
NAME                        STATUS
dockerwakeup-backend        Up (healthy)
dockerwakeup-frontend       Up (healthy)
dockerwakeup-mongodb        Up (healthy)
dockerwakeup-monitor        Up (healthy)
```

### 2. Test Backend API

```bash
curl http://localhost:8001/api/
```

Expected: `{"message":"DockerWakeUp WebUI API","version":"3.0.0"...}`

### 3. Test Frontend

```bash
curl http://localhost:9999/
```

Expected: HTML content

### 4. Check Docker Socket Access

```bash
docker exec dockerwakeup-backend python -c "import docker; print(docker.from_env().ping())"
```

Expected: `True`

---

## 🎯 What Each Container Does

**dockerwakeup-mongodb**
- Stores all application data
- Activity logs
- Settings
- Templates
- Historical stats

**dockerwakeup-monitor**
- Runs original DockerWakeUp script
- Monitors container idle time
- Auto-sleep/wake functionality
- Background service

**dockerwakeup-backend**
- FastAPI REST API (Port 8001)
- WebSocket server
- Container management
- Stats collection

**dockerwakeup-frontend**
- Nginx web server (Port 9999)
- React dashboard
- Proxies API calls to backend
- WebSocket support

---

## 🔄 Management After Deployment

### Create CLI Management Script

```bash
cat > /usr/local/bin/dockerwakeup << 'EOF'
#!/bin/bash
cd /opt/dockerwakeupgui
case "$1" in
    start) docker compose start ;;
    stop) docker compose stop ;;
    restart) docker compose restart ;;
    status) docker compose ps ;;
    logs) docker compose logs -f ${2:-} ;;
    rebuild) docker compose down && docker compose up -d --build ;;
    update) 
        cd dockerwakeup-original && git pull && cd ..
        docker compose up -d --build
        ;;
    *) echo "Usage: dockerwakeup {start|stop|restart|status|logs|rebuild|update}" ;;
esac
EOF

chmod +x /usr/local/bin/dockerwakeup
```

Then use:
```bash
dockerwakeup status
dockerwakeup logs backend
dockerwakeup restart
```

---

## 🌐 Nginx Proxy Manager Setup (If Using NPM)

### Create Proxy Host in NPM

1. **Domain Names**: `dockerwakeup.yourdomain.com`
2. **Scheme**: `http`
3. **Forward Hostname/IP**: 
   - If NPM is on same server: `localhost` or `192.168.1.102`
   - If in same Docker network: `dockerwakeup-frontend`
4. **Forward Port**: 
   - If using localhost/IP: `9999`
   - If using container name: `80`
5. **WebSockets Support**: ✅ ENABLE (Required!)
6. **SSL**: Request Let's Encrypt certificate
7. **Force SSL**: ✅ Enable

### If NPM in Same Docker Network

Edit `/opt/dockerwakeupgui/docker-compose.yml`:

```yaml
services:
  frontend:
    networks:
      - dockerwakeup
      - npm_default  # Add your NPM network
      
networks:
  npm_default:
    external: true
```

Then in NPM:
- Forward Hostname: `dockerwakeup-frontend`
- Forward Port: `80`

---

## 📊 Quick Health Check Script

Create `/opt/dockerwakeupgui/health-check.sh`:

```bash
#!/bin/bash

echo "DockerWakeUp Health Check"
echo "========================="

# Check containers
echo -e "\n1. Container Status:"
docker compose ps

# Test backend
echo -e "\n2. Backend API:"
curl -s http://localhost:8001/api/ | jq .

# Test frontend
echo -e "\n3. Frontend:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:9999/

# Check Docker socket
echo -e "\n4. Docker Socket:"
ls -la /var/run/docker.sock

# Check logs for errors
echo -e "\n5. Recent Errors:"
docker compose logs --tail=20 | grep -i error || echo "No errors found"

echo -e "\n✅ Health check complete"
```

Run: `bash /opt/dockerwakeupgui/health-check.sh`

---

## 🎯 Next Steps After Deployment

1. **Access Dashboard**: http://192.168.1.102:9999
2. **Check all pages work** (10 pages total)
3. **Configure settings** (alerts, themes, etc)
4. **Set up NPM** if using reverse proxy
5. **Create templates** for your common containers
6. **Monitor alerts** for resource warnings

---

## 💡 Pro Tips

**Performance:**
- Monitor the Analytics page for resource trends
- Set alert thresholds in Settings
- Use templates for faster deployment

**Security:**
- Put behind NPM with SSL
- Change default MongoDB port if exposed
- Use Docker networks for isolation

**Maintenance:**
- Check alerts daily
- Review activity logs weekly
- Update monthly: `dockerwakeup update`
- Backup MongoDB monthly

---

## 📞 If You Need Help

```bash
# View all logs
docker compose logs

# View specific service
docker compose logs backend
docker compose logs frontend
docker compose logs dockerwakeup-monitor

# Check Docker status
systemctl status docker

# Restart everything
docker compose restart

# Full rebuild
docker compose down
docker compose up -d --build
```

---

**Ready to deploy! Just run `docker compose up -d --build` and you're good to go!** 🚀
