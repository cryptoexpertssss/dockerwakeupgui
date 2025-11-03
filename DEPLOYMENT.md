# DockerWakeUp WebUI - Deployment Guide for 192.168.1.102

## Prerequisites

1. **Server**: Linux server at 192.168.1.102 with Docker installed
2. **Permissions**: Root or sudo access
3. **Ports**: Ensure ports 8001 (backend) and 9999 (frontend) are available

## Deployment Steps

### Step 1: Prepare the Server

```bash
# SSH into your server
ssh user@192.168.1.102

# Install required packages
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm mongodb-server docker.io

# Install yarn
sudo npm install -g yarn

# Enable and start services
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl enable mongodb
sudo systemctl start mongodb
```

### Step 2: Copy Application Files

```bash
# Create application directory
sudo mkdir -p /opt/dockerwakeup-webui
sudo chown $USER:$USER /opt/dockerwakeup-webui

# Copy files from development environment to server
# From your local machine:
scp -r /app/backend user@192.168.1.102:/opt/dockerwakeup-webui/
scp -r /app/frontend user@192.168.1.102:/opt/dockerwakeup-webui/
```

### Step 3: Configure Backend

```bash
cd /opt/dockerwakeup-webui/backend

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=dockerwakeup
CORS_ORIGINS=*
EOF

# Install Python dependencies
pip3 install -r requirements.txt
```

### Step 4: Configure Frontend

```bash
cd /opt/dockerwakeup-webui/frontend

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://192.168.1.102:8001
EOF

# Install dependencies and build
yarn install
yarn build
```

### Step 5: Create Systemd Services

#### Backend Service

```bash
sudo cat > /etc/systemd/system/dockerwakeup-backend.service << 'EOF'
[Unit]
Description=DockerWakeUp Backend API
After=docker.service mongodb.service network.target
Requires=docker.service mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dockerwakeup-webui/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="MONGO_URL=mongodb://localhost:27017"
Environment="DB_NAME=dockerwakeup"
ExecStart=/usr/local/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

#### Frontend Service

```bash
sudo cat > /etc/systemd/system/dockerwakeup-frontend.service << 'EOF'
[Unit]
Description=DockerWakeUp Frontend Web Server
After=dockerwakeup-backend.service network.target
Requires=dockerwakeup-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dockerwakeup-webui/frontend
ExecStart=/usr/bin/npx serve -s build -l 9999
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### Step 6: Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable dockerwakeup-backend
sudo systemctl enable dockerwakeup-frontend

# Start services
sudo systemctl start dockerwakeup-backend
sudo systemctl start dockerwakeup-frontend

# Check status
sudo systemctl status dockerwakeup-backend
sudo systemctl status dockerwakeup-frontend
```

### Step 7: Verify Installation

```bash
# Check if backend is responding
curl http://192.168.1.102:8001/api/

# Check if frontend is accessible
curl http://192.168.1.102:9999/

# View logs
sudo journalctl -u dockerwakeup-backend -f
sudo journalctl -u dockerwakeup-frontend -f
```

### Step 8: Configure Firewall (if applicable)

```bash
# Allow ports
sudo ufw allow 8001/tcp  # Backend API
sudo ufw allow 9999/tcp  # Frontend
```

## Using Docker Compose (Alternative Method)

### Step 1: Create Docker Compose File

```bash
cd /opt/dockerwakeup-webui

cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  mongodb:
    image: mongo:7
    container_name: dockerwakeup-mongodb
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    networks:
      - dockerwakeup

  backend:
    build:
      context: ./backend
    container_name: dockerwakeup-backend
    ports:
      - "8001:8001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=dockerwakeup
      - CORS_ORIGINS=*
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - dockerwakeup

  frontend:
    build:
      context: ./frontend
    container_name: dockerwakeup-frontend
    ports:
      - "9999:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - dockerwakeup

volumes:
  mongodb_data:

networks:
  dockerwakeup:
    driver: bridge
EOF
```

### Step 2: Create Dockerfiles

#### Backend Dockerfile

```bash
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
EOF
```

#### Frontend Dockerfile

```bash
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
```

### Step 3: Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Accessing the Application

1. **Frontend Dashboard**: http://192.168.1.102:9999
2. **Backend API**: http://192.168.1.102:8001/api
3. **API Documentation**: http://192.168.1.102:8001/docs

## Management Commands

```bash
# Systemd method
sudo systemctl restart dockerwakeup-backend
sudo systemctl restart dockerwakeup-frontend
sudo systemctl stop dockerwakeup-backend dockerwakeup-frontend
sudo journalctl -u dockerwakeup-backend -n 100

# Docker Compose method
docker-compose restart
docker-compose down
docker-compose up -d
docker-compose logs backend -f
```

## Updating the Application

```bash
# Pull latest code
cd /opt/dockerwakeup-webui
git pull

# Update backend
cd backend
pip3 install -r requirements.txt
sudo systemctl restart dockerwakeup-backend

# Update frontend
cd ../frontend
yarn install
yarn build
sudo systemctl restart dockerwakeup-frontend
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u dockerwakeup-backend -n 50

# Check if port is in use
sudo lsof -i :8001

# Test Docker connection
docker ps
ls -la /var/run/docker.sock
```

### Frontend won't start
```bash
# Check logs
sudo journalctl -u dockerwakeup-frontend -n 50

# Check if port is in use
sudo lsof -i :9999

# Check build
cd /opt/dockerwakeup-webui/frontend
ls -la build/
```

### MongoDB connection issues
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

## Security Hardening

1. **Use HTTPS**: Set up nginx reverse proxy with SSL
2. **Add Authentication**: Implement JWT auth in backend
3. **Firewall**: Restrict access to specific IPs
4. **Docker Socket**: Consider using Docker API over TCP with TLS
5. **Regular Updates**: Keep all dependencies updated

## Backup

```bash
# Backup MongoDB
mongodump --db dockerwakeup --out /backup/mongodb

# Backup application
tar -czf /backup/dockerwakeup-$(date +%Y%m%d).tar.gz /opt/dockerwakeup-webui
```

---

**Your DockerWakeUp WebUI is now deployed and ready to use at http://192.168.1.102:9999!**
