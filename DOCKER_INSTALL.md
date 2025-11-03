# DockerWakeUp WebUI - Docker Installation Guide

## Quick Start with Docker Compose

### Prerequisites

- Docker Engine 20.10+
- Docker Compose V2 or docker-compose
- Linux server with Docker socket access
- 2GB RAM minimum
- 10GB disk space

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/dockerwakeup/main/docker-install.sh | sudo bash
```

### Manual Installation

```bash
# Download installer
wget https://raw.githubusercontent.com/your-repo/dockerwakeup/main/docker-install.sh

# Make executable
chmod +x docker-install.sh

# Run installer
sudo ./docker-install.sh
```

## What Gets Installed

### Docker Containers

1. **dockerwakeup-mongodb** - MongoDB database (Port 27017, internal)
2. **dockerwakeup-backend** - FastAPI backend (Port 8001)
3. **dockerwakeup-frontend** - Nginx + React frontend (Port 9999)

### Docker Network

- **dockerwakeup-network** - Bridge network for container communication

### Docker Volume

- **mongodb_data** - Persistent MongoDB data storage

### Directory Structure

```
/opt/dockerwakeup/
├── backend/
│   ├── Dockerfile
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── src/
│   └── .env
└── docker-compose.yml
```

## Management Commands

After installation, use the `dockerwakeup` command:

```bash
# Start services
dockerwakeup start

# Stop services
dockerwakeup stop

# Restart services
dockerwakeup restart

# Check status
dockerwakeup status

# View logs
dockerwakeup logs backend
dockerwakeup logs frontend
dockerwakeup logs mongodb

# Update to latest
dockerwakeup update

# Rebuild everything
dockerwakeup rebuild

# Stop and remove
dockerwakeup down
```

## Docker Compose Commands

```bash
cd /opt/dockerwakeup

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Check status
docker-compose ps

# Restart a service
docker-compose restart backend

# Rebuild a service
docker-compose up -d --build backend

# Pull latest images
docker-compose pull

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

## Configuration

### Backend Environment (`/opt/dockerwakeup/backend/.env`)

```env
MONGO_URL=mongodb://mongodb:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
```

### Frontend Environment

Set during build in docker-compose.yml:

```yaml
args:
  - REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:9999
```

Or create `/opt/dockerwakeup/frontend/.env.production`:

```env
REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:9999
```

## Accessing the Application

### Web Interface

```
http://YOUR_SERVER_IP:9999
```

### API Documentation

```
http://YOUR_SERVER_IP:8001/docs
```

### Health Checks

```bash
# Backend health
curl http://localhost:8001/api/

# Frontend health
curl http://localhost:9999/

# Check all container health
docker ps --filter "name=dockerwakeup"
```

## Nginx Proxy Manager Integration

### Create Proxy Host in NPM

1. **Domain Names**: `dockerwakeup.yourdomain.com`
2. **Scheme**: `http`
3. **Forward Hostname/IP**: `YOUR_SERVER_IP` or `dockerwakeup-frontend` (if NPM in same network)
4. **Forward Port**: `9999` (or `80` if using container name)
5. **WebSockets Support**: ✅ Enable
6. **SSL**: Request Let's Encrypt certificate
7. **Force SSL**: ✅ Enable

### Advanced Configuration

If NPM is in the same Docker network:

```yaml
# Add to docker-compose.yml
services:
  frontend:
    networks:
      - dockerwakeup
      - npm_network  # Your NPM network

networks:
  npm_network:
    external: true
    name: npm_default  # Or your NPM network name
```

Then in NPM:
- Forward Hostname: `dockerwakeup-frontend`
- Forward Port: `80`

## Firewall Configuration

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 9999/tcp
sudo ufw allow 8001/tcp  # Only if accessing API externally

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=9999/tcp
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --reload
```

## Updating

### Quick Update

```bash
dockerwakeup update
```

### Manual Update

```bash
cd /opt/dockerwakeup

# Pull new code (if using git)
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Backup

### Backup MongoDB Data

```bash
# Using docker exec
docker exec dockerwakeup-mongodb mongodump --out=/dump --db=dockerwakeup

# Copy from container
docker cp dockerwakeup-mongodb:/dump ./mongodb-backup-$(date +%Y%m%d)
```

### Backup Everything

```bash
# Backup docker-compose and config
tar -czf dockerwakeup-backup-$(date +%Y%m%d).tar.gz \
    /opt/dockerwakeup/docker-compose.yml \
    /opt/dockerwakeup/backend/.env \
    /opt/dockerwakeup/frontend/.env

# Backup volume
docker run --rm \
    -v dockerwakeup_mongodb_data:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/mongodb-volume-$(date +%Y%m%d).tar.gz /data
```

### Restore

```bash
# Stop services
dockerwakeup down

# Restore volume
docker run --rm \
    -v dockerwakeup_mongodb_data:/data \
    -v $(pwd):/backup \
    alpine tar xzf /backup/mongodb-volume-20231103.tar.gz -C /

# Start services
dockerwakeup start
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker service
systemctl status docker

# Check logs
cd /opt/dockerwakeup
docker-compose logs

# Check individual service
docker-compose logs backend
```

### Backend Can't Connect to Docker

```bash
# Verify socket is mounted
docker inspect dockerwakeup-backend | grep -A 5 Mounts

# Check socket permissions on host
ls -la /var/run/docker.sock

# Restart backend
docker-compose restart backend
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker ps | grep mongodb

# Test MongoDB connection
docker exec dockerwakeup-mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB logs
docker-compose logs mongodb
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:8001/api/

# Check frontend environment
docker exec dockerwakeup-frontend cat /usr/share/nginx/html/env-config.js

# Rebuild frontend with correct URL
cd /opt/dockerwakeup
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :9999
sudo lsof -i :8001

# Change ports in docker-compose.yml
nano /opt/dockerwakeup/docker-compose.yml
# Edit the ports section, then:
docker-compose down
docker-compose up -d
```

## Advanced Configuration

### Custom Ports

Edit `/opt/dockerwakeup/docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8080:8001"  # Change 8080 to your preferred port
  
  frontend:
    ports:
      - "3000:80"    # Change 3000 to your preferred port
```

### Add to Existing Docker Network

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

### Enable HTTPS (with Let's Encrypt)

Use Nginx Proxy Manager or add Traefik:

```yaml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dockerwakeup.rule=Host(`dockerwakeup.yourdomain.com`)"
      - "traefik.http.routers.dockerwakeup.entrypoints=websecure"
      - "traefik.http.routers.dockerwakeup.tls.certresolver=letsencrypt"
```

## Resource Limits

Add resource limits in docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

## Uninstallation

```bash
# Stop and remove containers
cd /opt/dockerwakeup
docker-compose down

# Remove images
docker rmi $(docker images | grep dockerwakeup | awk '{print $3}')

# Remove volumes (⚠️ This deletes data)
docker volume rm dockerwakeup_mongodb_data

# Remove installation directory
sudo rm -rf /opt/dockerwakeup

# Remove management script
sudo rm /usr/local/bin/dockerwakeup
```

## Production Recommendations

1. **Use Nginx Proxy Manager** with SSL
2. **Set resource limits** on containers
3. **Enable logging** with log rotation
4. **Regular backups** of MongoDB data
5. **Monitor container health** checks
6. **Use specific image tags** instead of latest
7. **Enable auto-restart** policies
8. **Restrict network access** with firewall

## Security Notes

⚠️ **Important**: This application has access to the Docker socket which provides root-level access to the Docker daemon.

**Security Measures:**
- Docker socket mounted as read-only (`:ro`)
- Runs in isolated Docker network
- CORS can be restricted to specific domains
- Use behind reverse proxy with authentication
- Keep Docker and images updated

## Support

- **Issues**: Check logs with `dockerwakeup logs`
- **Status**: Run `dockerwakeup status`
- **Documentation**: See README.md
- **Docker Docs**: https://docs.docker.com

---

**DockerWakeUp WebUI - Professional Docker Management** 🐳
