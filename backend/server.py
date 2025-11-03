from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
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
from datetime import datetime, timezone, timedelta
import docker
import psutil
import subprocess
import yaml


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
    action: str

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
    mode: str = "rw"

class CreateContainerRequest(BaseModel):
    name: str
    image: str
    ports: List[PortMapping] = []
    volumes: List[VolumeMount] = []
    environment: Dict[str, str] = {}
    command: Optional[str] = None
    network_mode: str = "bridge"
    restart_policy: str = "unless-stopped"
    depends_on: List[str] = []
    idle_timeout: Optional[int] = None
    detach: bool = True
    auto_remove: bool = False
    labels: Dict[str, str] = {}
    # New metadata fields
    route: Optional[str] = None
    docker_url: Optional[str] = None
    docker_path: Optional[str] = None
    deployment_type: str = "docker_run"  # 'docker_run' or 'compose'
    run_command: Optional[str] = None

class CreateVolumeRequest(BaseModel):
    name: str
    driver: str = "local"
    labels: Dict[str, str] = {}

class CreateNetworkRequest(BaseModel):
    name: str
    driver: str = "bridge"
    subnet: Optional[str] = None
    gateway: Optional[str] = None
    labels: Dict[str, str] = {}

class PullImageRequest(BaseModel):
    image: str
    tag: str = "latest"

class ContainerTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    config: Dict[str, Any]
    category: str = "custom"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: str  # cpu, memory, disk, container_stopped
    severity: str  # info, warning, critical
    message: str
    container_name: Optional[str] = None
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    acknowledged: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WebhookConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    webhook_type: str  # slack, discord, telegram, custom
    events: List[str] = []  # container_start, container_stop, alert, etc
    enabled: bool = True

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    poll_interval: int = 5
    auto_refresh: bool = True
    ws_update_interval: int = 3
    default_restart_policy: str = "unless-stopped"
    default_network_mode: str = "bridge"
    default_idle_timeout: int = 3600
    theme: str = "dark"
    containers_per_page: int = 50
    show_stopped_containers: bool = True
    enable_notifications: bool = True
    notify_on_container_stop: bool = True
    notify_on_container_start: bool = False
    notify_on_errors: bool = True
    docker_socket_path: str = "/var/run/docker.sock"
    log_retention_days: int = 30
    enable_auto_prune: bool = False
    auto_prune_schedule: str = "weekly"
    enable_alerts: bool = True
    cpu_alert_threshold: int = 80
    memory_alert_threshold: int = 80
    disk_alert_threshold: int = 85
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    container_name: Optional[str] = None
    status: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContainerStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    container_name: str
    cpu_percent: float
    memory_mb: float
    memory_percent: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExecCommand(BaseModel):
    command: str
    workdir: Optional[str] = None

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
        
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
        system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
        cpu_percent = (cpu_delta / system_delta) * len(stats['cpu_stats']['cpu_usage'].get('percpu_usage', [0])) * 100 if system_delta > 0 else 0
        
        mem_usage = stats['memory_stats'].get('usage', 0) / (1024 * 1024)
        mem_limit = stats['memory_stats'].get('limit', 1) / (1024 * 1024)
        
        network_settings = container.attrs['NetworkSettings']
        networks_detailed = {}
        
        for network_name, network_info in network_settings['Networks'].items():
            networks_detailed[network_name] = {
                "ip_address": network_info.get('IPAddress', 'N/A'),
                "gateway": network_info.get('Gateway', 'N/A'),
                "mac_address": network_info.get('MacAddress', 'N/A'),
                "network_id": network_info.get('NetworkID', 'N/A')[:12],
                "ip_prefix_len": network_info.get('IPPrefixLen', 0),
                "subnet": f"{network_info.get('IPAddress', '').rsplit('.', 1)[0]}.0/{network_info.get('IPPrefixLen', 0)}" if network_info.get('IPAddress') else 'N/A'
            }
        
        ports_detailed = []
        if container.ports:
            for container_port, host_bindings in container.ports.items():
                if host_bindings:
                    for binding in host_bindings:
                        port_num, protocol = container_port.split('/')
                        ports_detailed.append({
                            "host_ip": binding.get('HostIp', '0.0.0.0'),
                            "host_port": binding['HostPort'],
                            "container_port": port_num,
                            "protocol": protocol.upper(),
                            "mapping": f"{binding.get('HostIp', '0.0.0.0')}:{binding['HostPort']}->{port_num}/{protocol}"
                        })
                else:
                    port_num, protocol = container_port.split('/')
                    ports_detailed.append({
                        "host_ip": None,
                        "host_port": None,
                        "container_port": port_num,
                        "protocol": protocol.upper(),
                        "mapping": f"{port_num}/{protocol} (exposed)"
                    })
        
        is_npm = 'nginx-proxy-manager' in container.name.lower() or 'npm' in container.name.lower()
        hostname = container.attrs['Config'].get('Hostname', 'N/A')
        domainname = container.attrs['Config'].get('Domainname', '')
        health_status = container.attrs['State'].get('Health', {}).get('Status', None)
        
        return {
            "id": container.short_id,
            "name": container.name,
            "status": container.status,
            "state": container.attrs['State']['Status'],
            "health": health_status,
            "image": container.image.tags[0] if container.image.tags else container.image.short_id,
            "created": container.attrs['Created'],
            "type": "compose" if container.labels.get('com.docker.compose.project') else "docker_run",
            "compose_project": container.labels.get('com.docker.compose.project', ''),
            "hostname": hostname,
            "domainname": domainname,
            "is_npm": is_npm,
            "ports": [p["mapping"] for p in ports_detailed],
            "ports_detailed": ports_detailed,
            "networks": list(container.attrs['NetworkSettings']['Networks'].keys()),
            "networks_detailed": networks_detailed,
            "ip_address": network_settings.get('IPAddress', 'N/A'),
            "gateway": network_settings.get('Gateway', 'N/A'),
            "mac_address": network_settings.get('MacAddress', 'N/A'),
            "network_mode": container.attrs['HostConfig'].get('NetworkMode', 'default'),
            "labels": container.labels,
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
            "health": None,
            "image": "unknown",
            "created": "",
            "type": "unknown",
            "compose_project": "",
            "hostname": "N/A",
            "domainname": "",
            "is_npm": False,
            "ports": [],
            "ports_detailed": [],
            "networks": [],
            "networks_detailed": {},
            "ip_address": "N/A",
            "gateway": "N/A",
            "mac_address": "N/A",
            "network_mode": "unknown",
            "labels": {},
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
        "disk_total_gb": round(disk.total / (1024 * 1024 * 1024), 2),
        "timestamp": datetime.now(timezone.utc).isoformat()
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


async def save_container_stats(container_name: str, stats: dict):
    """Save container stats for historical data"""
    try:
        stat_entry = ContainerStats(
            container_name=container_name,
            cpu_percent=stats['cpu_percent'],
            memory_mb=stats['memory_mb'],
            memory_percent=stats['memory_percent']
        )
        doc = stat_entry.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.container_stats.insert_one(doc)
        
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        await db.container_stats.delete_many({"timestamp": {"$lt": cutoff.isoformat()}})
    except Exception as e:
        logging.error(f"Error saving stats: {e}")


async def check_and_create_alerts(containers: list, system_metrics: dict, settings: dict):
    """Check for alert conditions and create alerts"""
    if not settings.get('enable_alerts', True):
        return
    
    try:
        # System alerts
        if system_metrics['cpu_percent'] > settings.get('cpu_alert_threshold', 80):
            alert = Alert(
                alert_type="cpu",
                severity="warning" if system_metrics['cpu_percent'] < 90 else "critical",
                message=f"High CPU usage: {system_metrics['cpu_percent']}%",
                threshold=settings.get('cpu_alert_threshold'),
                current_value=system_metrics['cpu_percent']
            )
            doc = alert.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.alerts.insert_one(doc)
        
        if system_metrics['memory_percent'] > settings.get('memory_alert_threshold', 80):
            alert = Alert(
                alert_type="memory",
                severity="warning" if system_metrics['memory_percent'] < 90 else "critical",
                message=f"High memory usage: {system_metrics['memory_percent']}%",
                threshold=settings.get('memory_alert_threshold'),
                current_value=system_metrics['memory_percent']
            )
            doc = alert.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.alerts.insert_one(doc)
        
        # Container alerts
        for container in containers:
            if container['stats']['cpu_percent'] > 90:
                alert = Alert(
                    alert_type="container_cpu",
                    severity="warning",
                    message=f"Container {container['name']} high CPU: {container['stats']['cpu_percent']}%",
                    container_name=container['name'],
                    current_value=container['stats']['cpu_percent']
                )
                doc = alert.model_dump()
                doc['timestamp'] = doc['timestamp'].isoformat()
                await db.alerts.insert_one(doc)
    except Exception as e:
        logging.error(f"Error checking alerts: {e}")


# API Routes
@api_router.get("/")
async def root():
    return {"message": "DockerWakeUp WebUI API", "version": "3.0.0", "docker_available": DOCKER_AVAILABLE}


@api_router.get("/containers")
async def list_containers(all: bool = True):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        containers = docker_client.containers.list(all=all)
        container_list = [get_container_info(c) for c in containers]
        return {"containers": container_list, "count": len(container_list)}
    except Exception as e:
        logging.error(f"Error listing containers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/container/{container_name}/inspect")
async def inspect_container(container_name: str):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        container = docker_client.containers.get(container_name)
        return {"inspect": container.attrs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/container/{container_name}/exec")
async def exec_container(container_name: str, command: ExecCommand):
    """Execute command in container"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        container = docker_client.containers.get(container_name)
        exec_result = container.exec_run(
            command.command,
            workdir=command.workdir,
            demux=True
        )
        
        output = exec_result.output
        if isinstance(output, tuple):
            stdout, stderr = output
            output_str = (stdout.decode('utf-8') if stdout else '') + (stderr.decode('utf-8') if stderr else '')
        else:
            output_str = output.decode('utf-8') if output else ''
        
        return {
            "exit_code": exec_result.exit_code,
            "output": output_str
        }
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/container/{container_name}/{action}")
async def container_action(container_name: str, action: str):
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
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        try:
            existing = docker_client.containers.get(request.name)
            raise HTTPException(status_code=400, detail=f"Container with name '{request.name}' already exists")
        except docker.errors.NotFound:
            pass
        
        if request.depends_on:
            for dep_name in request.depends_on:
                try:
                    dep_container = docker_client.containers.get(dep_name)
                    if dep_container.status != 'running':
                        dep_container.start()
                        await log_activity("start_dependency", dep_name, "success", f"Started dependency for {request.name}")
                except docker.errors.NotFound:
                    raise HTTPException(status_code=400, detail=f"Dependency container '{dep_name}' not found")
        
        port_bindings = {}
        exposed_ports = {}
        for port in request.ports:
            container_port_key = f"{port.container_port}/{port.protocol}"
            exposed_ports[container_port_key] = {}
            port_bindings[container_port_key] = port.host_port
        
        volumes = {}
        for vol in request.volumes:
            volumes[vol.host_path] = {'bind': vol.container_path, 'mode': vol.mode}
        
        restart_policy_map = {
            "no": {"Name": "no"},
            "always": {"Name": "always"},
            "on-failure": {"Name": "on-failure", "MaximumRetryCount": 3},
            "unless-stopped": {"Name": "unless-stopped"}
        }
        restart_policy = restart_policy_map.get(request.restart_policy, {"Name": "no"})
        
        labels = request.labels.copy()
        if request.idle_timeout:
            labels['dockerwakeup.idle_timeout'] = str(request.idle_timeout)
        
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
    except Exception as e:
        error_msg = f"Error creating container: {str(e)}"
        await log_activity("create_container", request.name, "error", error_msg)
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@api_router.get("/container/{container_name}/export")
async def export_container_config(container_name: str):
    """Export container configuration as docker-compose format"""
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        container = docker_client.containers.get(container_name)
        attrs = container.attrs
        
        config = {
            "version": "3.8",
            "services": {
                container_name: {
                    "image": attrs['Config']['Image'],
                    "container_name": container_name,
                    "restart": attrs['HostConfig']['RestartPolicy']['Name'] or 'no',
                    "environment": attrs['Config']['Env'],
                    "ports": [f"{b['HostPort']}:{cp.split('/')[0]}" for cp, bindings in (attrs['HostConfig']['PortBindings'] or {}).items() for b in bindings] if attrs['HostConfig']['PortBindings'] else [],
                    "volumes": [f"{k}:{v['bind']}" for k, v in (attrs['HostConfig']['Binds'] or {}).items()] if attrs['HostConfig'].get('Binds') else [],
                    "networks": list(attrs['NetworkSettings']['Networks'].keys())
                }
            }
        }
        
        return {"config": yaml.dump(config, default_flow_style=False)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/logs/{container_name}")
async def get_logs(container_name: str, tail: int = 100):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        container = docker_client.containers.get(container_name)
        logs = container.logs(tail=tail).decode('utf-8', errors='replace')
        return {"container": container_name, "logs": logs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        logging.error(f"Error getting logs for {container_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/container/{container_name}/stats/history")
async def get_stats_history(container_name: str, hours: int = 1):
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        stats = await db.container_stats.find(
            {"container_name": container_name, "timestamp": {"$gte": cutoff.isoformat()}},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        return {"container": container_name, "stats": stats, "count": len(stats)}
    except Exception as e:
        logging.error(f"Error getting stats history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Images
@api_router.get("/images")
async def list_images():
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


@api_router.post("/images/pull")
async def pull_image(request: PullImageRequest):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        full_image = f"{request.image}:{request.tag}"
        image = docker_client.images.pull(request.image, tag=request.tag)
        
        await log_activity("pull_image", None, "success", f"Pulled image {full_image}")
        await manager.broadcast({"type": "image_event", "action": "pull", "image": full_image})
        
        return {"success": True, "message": f"Image {full_image} pulled successfully", "image_id": image.short_id}
    except Exception as e:
        error_msg = f"Error pulling image: {str(e)}"
        await log_activity("pull_image", None, "error", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@api_router.post("/images/prune")
async def prune_images():
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        result = docker_client.images.prune(filters={'dangling': False})
        space_reclaimed = result.get('SpaceReclaimed', 0) / (1024 * 1024)
        
        await log_activity("prune_images", None, "success", f"Reclaimed {space_reclaimed:.2f} MB")
        await manager.broadcast({"type": "image_event", "action": "prune", "space_reclaimed_mb": space_reclaimed})
        
        return {"success": True, "space_reclaimed_mb": round(space_reclaimed, 2), "images_deleted": len(result.get('ImagesDeleted', []))}
    except Exception as e:
        logging.error(f"Error pruning images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Volumes
@api_router.get("/volumes")
async def list_volumes():
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        volumes = docker_client.volumes.list()
        volume_list = []
        
        for vol in volumes:
            volume_list.append({
                "name": vol.name,
                "driver": vol.attrs['Driver'],
                "mountpoint": vol.attrs['Mountpoint'],
                "created": vol.attrs.get('CreatedAt', ''),
                "labels": vol.attrs.get('Labels', {}),
                "scope": vol.attrs.get('Scope', 'local')
            })
        
        return {"volumes": volume_list, "count": len(volume_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/volumes/create")
async def create_volume(request: CreateVolumeRequest):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        volume = docker_client.volumes.create(
            name=request.name,
            driver=request.driver,
            labels=request.labels
        )
        
        await log_activity("create_volume", request.name, "success", f"Volume {request.name} created")
        return {"success": True, "message": f"Volume {request.name} created", "volume_name": volume.name}
    except Exception as e:
        error_msg = f"Error creating volume: {str(e)}"
        await log_activity("create_volume", request.name, "error", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@api_router.delete("/volumes/{volume_name}")
async def delete_volume(volume_name: str):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        volume = docker_client.volumes.get(volume_name)
        volume.remove()
        
        await log_activity("delete_volume", volume_name, "success", f"Volume {volume_name} deleted")
        return {"success": True, "message": f"Volume {volume_name} deleted"}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Volume not found")
    except Exception as e:
        error_msg = f"Error deleting volume: {str(e)}"
        await log_activity("delete_volume", volume_name, "error", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# Networks
@api_router.get("/networks")
async def list_networks():
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        networks = docker_client.networks.list()
        network_list = []
        
        for net in networks:
            containers_in_network = []
            if net.attrs.get('Containers'):
                containers_in_network = [c['Name'] for c in net.attrs['Containers'].values()]
            
            network_list.append({
                "id": net.short_id,
                "name": net.name,
                "driver": net.attrs['Driver'],
                "scope": net.attrs['Scope'],
                "subnet": net.attrs['IPAM']['Config'][0].get('Subnet', 'N/A') if net.attrs['IPAM']['Config'] else 'N/A',
                "gateway": net.attrs['IPAM']['Config'][0].get('Gateway', 'N/A') if net.attrs['IPAM']['Config'] else 'N/A',
                "containers": containers_in_network,
                "container_count": len(containers_in_network)
            })
        
        return {"networks": network_list, "count": len(network_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/networks/create")
async def create_network(request: CreateNetworkRequest):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        ipam_config = None
        if request.subnet:
            ipam_pool = docker.types.IPAMPool(
                subnet=request.subnet,
                gateway=request.gateway
            )
            ipam_config = docker.types.IPAMConfig(pool_configs=[ipam_pool])
        
        network = docker_client.networks.create(
            name=request.name,
            driver=request.driver,
            ipam=ipam_config,
            labels=request.labels
        )
        
        await log_activity("create_network", request.name, "success", f"Network {request.name} created")
        return {"success": True, "message": f"Network {request.name} created", "network_id": network.short_id}
    except Exception as e:
        error_msg = f"Error creating network: {str(e)}"
        await log_activity("create_network", request.name, "error", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@api_router.delete("/networks/{network_name}")
async def delete_network(network_name: str):
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        network = docker_client.networks.get(network_name)
        network.remove()
        
        await log_activity("delete_network", network_name, "success", f"Network {network_name} deleted")
        return {"success": True, "message": f"Network {network_name} deleted"}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Network not found")
    except Exception as e:
        error_msg = f"Error deleting network: {str(e)}"
        await log_activity("delete_network", network_name, "error", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# System
@api_router.get("/system/info")
async def system_info():
    if not DOCKER_AVAILABLE:
        return JSONResponse({"error": "Docker not available"}, status_code=503)
    
    try:
        info = docker_client.info()
        version = docker_client.version()
        df = docker_client.df()
        
        return {
            "docker_version": version.get('Version', 'Unknown'),
            "api_version": version.get('ApiVersion', 'Unknown'),
            "os": info.get('OperatingSystem', 'Unknown'),
            "architecture": info.get('Architecture', 'Unknown'),
            "cpus": info.get('NCPU', 0),
            "memory_total_gb": round(info.get('MemTotal', 0) / (1024**3), 2),
            "containers_total": info.get('Containers', 0),
            "containers_running": info.get('ContainersRunning', 0),
            "containers_paused": info.get('ContainersPaused', 0),
            "containers_stopped": info.get('ContainersStopped', 0),
            "images_count": info.get('Images', 0),
            "storage_driver": info.get('Driver', 'Unknown'),
            "disk_usage": {
                "images": df.get('Images', []),
                "containers": df.get('Containers', []),
                "volumes": df.get('Volumes', [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/system/metrics/history")
async def get_system_metrics_history(hours: int = 1):
    """Get historical system metrics"""
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        metrics = await db.system_metrics.find(
            {"timestamp": {"$gte": cutoff.isoformat()}},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        return {"metrics": metrics, "count": len(metrics)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Templates
@api_router.get("/templates")
async def list_templates():
    try:
        templates = await db.templates.find({}, {"_id": 0}).to_list(100)
        return {"templates": templates, "count": len(templates)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/templates")
async def create_template(template: ContainerTemplate):
    try:
        doc = template.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.templates.insert_one(doc)
        return {"success": True, "template_id": template.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    try:
        result = await db.templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Alerts
@api_router.get("/alerts")
async def list_alerts(limit: int = 50, acknowledged: Optional[bool] = None):
    try:
        query = {}
        if acknowledged is not None:
            query['acknowledged'] = acknowledged
        
        alerts = await db.alerts.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    try:
        result = await db.alerts.update_one(
            {"id": alert_id},
            {"$set": {"acknowledged": True}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Webhooks
@api_router.get("/webhooks")
async def list_webhooks():
    try:
        webhooks = await db.webhooks.find({}, {"_id": 0}).to_list(100)
        return {"webhooks": webhooks, "count": len(webhooks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/webhooks")
async def create_webhook(webhook: WebhookConfig):
    try:
        doc = webhook.model_dump()
        await db.webhooks.insert_one(doc)
        return {"success": True, "webhook_id": webhook.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str):
    try:
        result = await db.webhooks.delete_one({"id": webhook_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Webhook not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/activity-logs")
async def get_activity_logs(limit: int = 50):
    try:
        logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logging.error(f"Error getting activity logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/system/metrics")
async def system_metrics():
    return get_system_metrics()


# Settings
@api_router.get("/settings")
async def get_settings():
    try:
        settings_doc = await db.settings.find_one({}, {"_id": 0})
        if not settings_doc:
            default_settings = Settings()
            return default_settings.model_dump()
        return settings_doc
    except Exception as e:
        logging.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/settings")
async def update_settings(settings: Settings):
    try:
        settings_dict = settings.model_dump()
        settings_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.settings.delete_many({})
        await db.settings.insert_one(settings_dict)
        
        await log_activity("update_settings", None, "success", "Application settings updated")
        await manager.broadcast({"type": "settings_updated", "settings": settings_dict})
        
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        logging.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/settings/reset")
async def reset_settings():
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
        system_metrics = get_system_metrics()
        await websocket.send_json({"type": "system_metrics", "data": system_metrics})
        
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=3.0)
            except asyncio.TimeoutError:
                if DOCKER_AVAILABLE:
                    try:
                        containers = docker_client.containers.list(all=True)
                        container_stats = [get_container_info(c) for c in containers]
                        
                        for container_stat in container_stats:
                            if container_stat['status'] == 'running':
                                await save_container_stats(
                                    container_stat['name'],
                                    container_stat['stats']
                                )
                        
                        await websocket.send_json({"type": "container_stats", "data": container_stats})
                    except:
                        pass
                
                system_metrics = get_system_metrics()
                await websocket.send_json({"type": "system_metrics", "data": system_metrics})
                
                # Save system metrics history
                try:
                    await db.system_metrics.insert_one(system_metrics)
                    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
                    await db.system_metrics.delete_many({"timestamp": {"$lt": cutoff.isoformat()}})
                except:
                    pass
                
                # Check alerts
                try:
                    settings = await get_settings()
                    await check_and_create_alerts(container_stats if DOCKER_AVAILABLE else [], system_metrics, settings)
                except:
                    pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client_mongo.close()
