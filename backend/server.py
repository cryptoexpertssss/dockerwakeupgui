from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
import docker
import psutil
import subprocess


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client_mongo = AsyncIOMotorClient(mongo_url)
db = client_mongo[os.environ['DB_NAME']]

# Docker client
try:
    docker_client = docker.from_env()
    DOCKER_AVAILABLE = True
except Exception as e:
    logging.error(f"Docker not available: {e}")
    docker_client = None
    DOCKER_AVAILABLE = False

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Models
class ContainerAction(BaseModel):
    action: str  # start, stop, pause, restart, remove

class BulkAction(BaseModel):
    container_names: List[str]
    action: str

class PortMapping(BaseModel):
    host_port: str
    container_port: str
    protocol: str = "tcp"

class VolumeMount(BaseModel):
    host_path: str
    container_path: str
    mode: str = "rw"  # rw or ro

class CreateContainerRequest(BaseModel):
    name: str
    image: str
    ports: List[PortMapping] = []
    volumes: List[VolumeMount] = []
    environment: Dict[str, str] = {}
    command: Optional[str] = None
    network_mode: str = "bridge"
    restart_policy: str = "unless-stopped"  # no, always, on-failure, unless-stopped
    depends_on: List[str] = []  # Container names that should start before this
    idle_timeout: Optional[int] = None  # Timeout in seconds
    detach: bool = True
    auto_remove: bool = False
    labels: Dict[str, str] = {}

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    # System Settings
    poll_interval: int = 5  # seconds
    auto_refresh: bool = True
    ws_update_interval: int = 3  # seconds for WebSocket updates
    
    # Container Defaults
    default_restart_policy: str = "unless-stopped"
    default_network_mode: str = "bridge"
    default_idle_timeout: int = 3600  # seconds
    
    # Display Settings
    theme: str = "dark"  # dark or light
    containers_per_page: int = 50
    show_stopped_containers: bool = True
    
    # Notifications
    enable_notifications: bool = True
    notify_on_container_stop: bool = True
    notify_on_container_start: bool = False
    notify_on_errors: bool = True
    
    # Advanced
    docker_socket_path: str = "/var/run/docker.sock"
    log_retention_days: int = 30
    enable_auto_prune: bool = False
    auto_prune_schedule: str = "weekly"  # daily, weekly, monthly
    
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    container_name: Optional[str] = None
    status: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()


# Helper functions
def get_container_info(container):
    """Extract container information"""
    try:
        stats = container.stats(stream=False)
        
        # CPU calculation
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
        system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
        cpu_percent = (cpu_delta / system_delta) * len(stats['cpu_stats']['cpu_usage'].get('percpu_usage', [0])) * 100 if system_delta > 0 else 0
        
        # Memory
        mem_usage = stats['memory_stats'].get('usage', 0) / (1024 * 1024)  # MB
        mem_limit = stats['memory_stats'].get('limit', 1) / (1024 * 1024)
        
        # Network
        networks = stats.get('networks', {})
        
        # Ports
        ports = []
        if container.ports:
            for container_port, host_bindings in container.ports.items():
                if host_bindings:
                    for binding in host_bindings:
                        ports.append(f"{binding['HostPort']}->{container_port}")
                else:
                    ports.append(container_port)
        
        return {
            "id": container.short_id,
            "name": container.name,
            "status": container.status,
            "state": container.attrs['State']['Status'],
            "image": container.image.tags[0] if container.image.tags else container.image.short_id,
            "created": container.attrs['Created'],
            "type": "compose" if container.labels.get('com.docker.compose.project') else "docker_run",
            "compose_project": container.labels.get('com.docker.compose.project', ''),
            "ports": ports,
            "networks": list(container.attrs['NetworkSettings']['Networks'].keys()),
            "stats": {
                "cpu_percent": round(cpu_percent, 2),
                "memory_mb": round(mem_usage, 2),
                "memory_limit_mb": round(mem_limit, 2),
                "memory_percent": round((mem_usage / mem_limit * 100) if mem_limit > 0 else 0, 2)
            }
        }
    except Exception as e:
        logging.error(f"Error getting container info for {container.name}: {e}")
        return {
            "id": container.short_id,
            "name": container.name,
            "status": container.status,
            "state": "unknown",
            "image": "unknown",
            "created": "",
            "type": "unknown",
            "compose_project": "",
            "ports": [],
            "networks": [],
            "stats": {"cpu_percent": 0, "memory_mb": 0, "memory_limit_mb": 0, "memory_percent": 0}
        }


def get_system_metrics():
    """Get system-level metrics"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_percent": round(cpu_percent, 2),
        "memory_percent": round(memory.percent, 2),
        "memory_used_mb": round(memory.used / (1024 * 1024), 2),
        "memory_total_mb": round(memory.total / (1024 * 1024), 2),
        "disk_percent": round(disk.percent, 2),
        "disk_used_gb": round(disk.used / (1024 * 1024 * 1024), 2),
        "disk_total_gb": round(disk.total / (1024 * 1024 * 1024), 2)
    }


async def log_activity(event_type: str, container_name: str = None, status: str = "success", message: str = ""):
    """Log activity to MongoDB"""
    try:
        activity = ActivityLog(
            event_type=event_type,
            container_name=container_name,
            status=status,
            message=message
        )
        doc = activity.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.activity_logs.insert_one(doc)
    except Exception as e:
        logging.error(f"Error logging activity: {e}")


# API Routes
@api_router.get("/")
async def root():
    return {"message": "DockerWakeUp WebUI API", "version": "1.0.0", "docker_available": DOCKER_AVAILABLE}


@api_router.get("/containers")
async def list_containers():
    """List all containers"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        containers = docker_client.containers.list(all=True)
        container_list = [get_container_info(c) for c in containers]
        return {"containers": container_list, "count": len(container_list)}
    except Exception as e:
        logging.error(f"Error listing containers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/container/{container_name}/{action}")
async def container_action(container_name: str, action: str):
    """Perform action on a container"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        container = docker_client.containers.get(container_name)
        
        if action == "start":
            container.start()
            message = f"Container {container_name} started"
        elif action == "stop":
            container.stop()
            message = f"Container {container_name} stopped"
        elif action == "pause":
            container.pause()
            message = f"Container {container_name} paused"
        elif action == "unpause":
            container.unpause()
            message = f"Container {container_name} unpaused"
        elif action == "restart":
            container.restart()
            message = f"Container {container_name} restarted"
        elif action == "remove":
            container.remove(force=True)
            message = f"Container {container_name} removed"
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        await log_activity(action, container_name, "success", message)
        await manager.broadcast({"type": "container_event", "action": action, "container": container_name, "status": "success"})
        
        return {"success": True, "message": message}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        await log_activity(action, container_name, "error", str(e))
        logging.error(f"Error performing {action} on {container_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/containers/bulk")
async def bulk_action(bulk: BulkAction):
    """Perform bulk action on multiple containers"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    results = []
    for container_name in bulk.container_names:
        try:
            container = docker_client.containers.get(container_name)
            
            if bulk.action == "start":
                container.start()
            elif bulk.action == "stop":
                container.stop()
            elif bulk.action == "restart":
                container.restart()
            elif bulk.action == "remove":
                container.remove(force=True)
            
            results.append({"container": container_name, "success": True})
            await log_activity(bulk.action, container_name, "success", f"Bulk {bulk.action} successful")
        except Exception as e:
            results.append({"container": container_name, "success": False, "error": str(e)})
            await log_activity(bulk.action, container_name, "error", str(e))
    
    await manager.broadcast({"type": "bulk_action", "action": bulk.action, "results": results})
    return {"results": results}


@api_router.post("/container/create")
async def create_container(request: CreateContainerRequest):
    """Create a new container"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        # Check if container name already exists
        try:
            existing = docker_client.containers.get(request.name)
            raise HTTPException(status_code=400, detail=f"Container with name '{request.name}' already exists")
        except docker.errors.NotFound:
            pass  # Good, container doesn't exist
        
        # Start dependent containers first
        if request.depends_on:
            for dep_name in request.depends_on:
                try:
                    dep_container = docker_client.containers.get(dep_name)
                    if dep_container.status != 'running':
                        dep_container.start()
                        await log_activity("start_dependency", dep_name, "success", f"Started dependency for {request.name}")
                except docker.errors.NotFound:
                    raise HTTPException(status_code=400, detail=f"Dependency container '{dep_name}' not found")
        
        # Prepare port bindings
        port_bindings = {}
        exposed_ports = {}
        for port in request.ports:
            container_port_key = f"{port.container_port}/{port.protocol}"
            exposed_ports[container_port_key] = {}
            port_bindings[container_port_key] = port.host_port
        
        # Prepare volume bindings
        volumes = {}
        for vol in request.volumes:
            volumes[vol.host_path] = {'bind': vol.container_path, 'mode': vol.mode}
        
        # Prepare restart policy
        restart_policy_map = {
            "no": {"Name": "no"},
            "always": {"Name": "always"},
            "on-failure": {"Name": "on-failure", "MaximumRetryCount": 3},
            "unless-stopped": {"Name": "unless-stopped"}
        }
        restart_policy = restart_policy_map.get(request.restart_policy, {"Name": "no"})
        
        # Add idle timeout to labels if specified
        labels = request.labels.copy()
        if request.idle_timeout:
            labels['dockerwakeup.idle_timeout'] = str(request.idle_timeout)
        
        # Create container
        container = docker_client.containers.create(
            image=request.image,
            name=request.name,
            command=request.command,
            environment=request.environment,
            ports=exposed_ports,
            volumes=volumes,
            network_mode=request.network_mode,
            restart_policy=restart_policy,
            detach=request.detach,
            auto_remove=request.auto_remove,
            labels=labels
        )
        
        # Start the container
        container.start()
        
        await log_activity("create_container", request.name, "success", f"Container {request.name} created and started")
        await manager.broadcast({"type": "container_event", "action": "create", "container": request.name, "status": "success"})
        
        return {
            "success": True,
            "message": f"Container {request.name} created successfully",
            "container_id": container.short_id,
            "container_name": request.name
        }
    
    except docker.errors.ImageNotFound:
        error_msg = f"Image '{request.image}' not found. Pull the image first."
        await log_activity("create_container", request.name, "error", error_msg)
        raise HTTPException(status_code=404, detail=error_msg)
    except docker.errors.APIError as e:
        error_msg = f"Docker API error: {str(e)}"
        await log_activity("create_container", request.name, "error", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Error creating container: {str(e)}"
        await log_activity("create_container", request.name, "error", error_msg)
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@api_router.get("/logs/{container_name}")
async def get_logs(container_name: str, tail: int = 100):
    """Get container logs"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        container = docker_client.containers.get(container_name)
        logs = container.logs(tail=tail).decode('utf-8')
        return {"container": container_name, "logs": logs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        logging.error(f"Error getting logs for {container_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/images")
async def list_images():
    """List all Docker images"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        images = docker_client.images.list()
        image_list = []
        
        for img in images:
            tags = img.tags if img.tags else ["<none>"]
            for tag in tags:
                repo_tag = tag.split(":")
                image_list.append({
                    "id": img.short_id.replace("sha256:", ""),
                    "repository": repo_tag[0] if len(repo_tag) > 0 else "<none>",
                    "tag": repo_tag[1] if len(repo_tag) > 1 else "<none>",
                    "size_mb": round(img.attrs['Size'] / (1024 * 1024), 2),
                    "created": img.attrs['Created']
                })
        
        return {"images": image_list, "count": len(image_list)}
    except Exception as e:
        logging.error(f"Error listing images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/images/prune")
async def prune_images():
    """Prune unused images"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        result = docker_client.images.prune(filters={'dangling': False})
        space_reclaimed = result.get('SpaceReclaimed', 0) / (1024 * 1024)  # MB
        
        await log_activity("prune_images", None, "success", f"Reclaimed {space_reclaimed:.2f} MB")
        await manager.broadcast({"type": "image_event", "action": "prune", "space_reclaimed_mb": space_reclaimed})
        
        return {"success": True, "space_reclaimed_mb": round(space_reclaimed, 2), "images_deleted": len(result.get('ImagesDeleted', []))}
    except Exception as e:
        logging.error(f"Error pruning images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/activity-logs")
async def get_activity_logs(limit: int = 50):
    """Get activity logs"""
    try:
        logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logging.error(f"Error getting activity logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/system/metrics")
async def system_metrics():
    """Get system metrics"""
    return get_system_metrics()


# Settings endpoints
@api_router.get("/settings")
async def get_settings():
    """Get application settings"""
    try:
        settings_doc = await db.settings.find_one({}, {"_id": 0})
        if not settings_doc:
            # Return default settings if none exist
            default_settings = Settings()
            return default_settings.model_dump()
        return settings_doc
    except Exception as e:
        logging.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/settings")
async def update_settings(settings: Settings):
    """Update application settings"""
    try:
        settings_dict = settings.model_dump()
        settings_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        # Upsert settings (update if exists, insert if not)
        await db.settings.delete_many({})  # Only keep one settings document
        await db.settings.insert_one(settings_dict)
        
        await log_activity("update_settings", None, "success", "Application settings updated")
        await manager.broadcast({"type": "settings_updated", "settings": settings_dict})
        
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        logging.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/settings/reset")
async def reset_settings():
    """Reset settings to defaults"""
    try:
        default_settings = Settings()
        settings_dict = default_settings.model_dump()
        settings_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.settings.delete_many({})
        await db.settings.insert_one(settings_dict)
        
        await log_activity("reset_settings", None, "success", "Settings reset to defaults")
        
        return {"success": True, "message": "Settings reset to defaults", "settings": settings_dict}
    except Exception as e:
        logging.error(f"Error resetting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial system metrics
        await websocket.send_json({"type": "system_metrics", "data": get_system_metrics()})
        
        # Keep connection alive and send periodic updates
        while True:
            try:
                # Wait for client message or timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=3.0)
            except asyncio.TimeoutError:
                # Send periodic updates
                if DOCKER_AVAILABLE:
                    try:
                        containers = docker_client.containers.list(all=True)
                        container_stats = [get_container_info(c) for c in containers]
                        await websocket.send_json({"type": "container_stats", "data": container_stats})
                    except:
                        pass
                
                await websocket.send_json({"type": "system_metrics", "data": get_system_metrics()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client_mongo.close()
