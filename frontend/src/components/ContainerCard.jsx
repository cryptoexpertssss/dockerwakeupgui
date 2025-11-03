import React, { useState } from 'react';
import axios from 'axios';
import { Play, Square, RotateCw, Trash2, Pause, FileText, Network, Code } from 'lucide-react';
import { toast } from 'sonner';
import LogsModal from './LogsModal';
import NetworkInfoModal from './NetworkInfoModal';
import InspectModal from './InspectModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContainerCard = ({ container, selected, onSelect, onActionComplete, viewMode = 'grid', style }) => {
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);
  const [showInspect, setShowInspect] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await axios.post(`${API}/container/${container.name}/${action}`);
      toast.success(`Container ${action} successful`);
      onActionComplete();
    } catch (error) {
      console.error(`Error ${action} container:`, error);
      toast.error(`Failed to ${action} container`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'running') return 'bg-green-500';
    if (status === 'paused') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getHealthColor = (health) => {
    if (health === 'healthy') return 'text-green-400';
    if (health === 'unhealthy') return 'text-red-400';
    return 'text-gray-400';
  };

  const getTypeIcon = (type) => {
    return type === 'compose' ? '📦' : '🐋';
  };

  if (viewMode === 'list') {
    return (
      <>
        <div
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all animate-fade-in flex items-center gap-4"
          style={style}
          data-testid={`container-card-${container.name}`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(container.name)}
            data-testid={`checkbox-${container.name}`}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
          />
          <div className="flex-1 grid grid-cols-6 gap-4 items-center">
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(container.type)}</span>
                <div>
                  <h3 className="text-white font-semibold">{container.name}</h3>
                  <p className="text-gray-400 text-xs">{container.id}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(container.status)}`}></span>
              <span className="text-white text-sm capitalize">{container.status}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">CPU: </span>
              <span className="text-white font-semibold">{container.stats?.cpu_percent || 0}%</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">RAM: </span>
              <span className="text-white font-semibold">{container.stats?.memory_mb || 0} MB</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowInspect(true)} className="p-1.5 bg-gray-600 hover:bg-gray-700 rounded" title="Inspect">
                <Code size={14} className="text-white" />
              </button>
              <button onClick={() => setShowNetworkInfo(true)} className="p-1.5 bg-purple-600 hover:bg-purple-700 rounded" title="Network">
                <Network size={14} className="text-white" />
              </button>
              <button onClick={() => setShowLogs(true)} className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded" title="Logs">
                <FileText size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {showLogs && <LogsModal containerName={container.name} onClose={() => setShowLogs(false)} />}
        {showNetworkInfo && <NetworkInfoModal container={container} onClose={() => setShowNetworkInfo(false)} />}
        {showInspect && <InspectModal containerName={container.name} onClose={() => setShowInspect(false)} />}
      </>
    );
  }

  return (
    <>
      <div
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-blue-500/50 transition-all animate-fade-in"
        style={style}
        data-testid={`container-card-${container.name}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(container.name)}
              data-testid={`checkbox-${container.name}`}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(container.type)}</span>
                <h3 className="text-white font-semibold truncate" data-testid={`container-name-${container.name}`}>{container.name}</h3>
              </div>
              <p className="text-gray-400 text-xs mt-1">{container.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {container.health && (
              <span className={`text-xs ${getHealthColor(container.health)}`}>♥</span>
            )}
            <span className={`w-3 h-3 rounded-full ${getStatusColor(container.status)} animate-pulse`} data-testid={`status-${container.name}`}></span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-900/50 rounded-lg">
          <div>
            <p className="text-gray-400 text-xs mb-1">CPU</p>
            <p className="text-white font-semibold" data-testid={`cpu-${container.name}`}>{container.stats?.cpu_percent || 0}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Memory</p>
            <p className="text-white font-semibold" data-testid={`memory-${container.name}`}>{container.stats?.memory_mb || 0} MB</p>
          </div>
        </div>

        {/* Ports */}
        {container.ports && container.ports.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-400 text-xs mb-2">Ports</p>
            <div className="flex flex-wrap gap-1">
              {container.ports.slice(0, 3).map((port, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                  {port}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Route & Docker URL */}
        {(container.route || container.docker_url) && (
          <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-xs">
            {container.route && (
              <div className="mb-1">
                <span className="text-purple-400">Route:</span> 
                <span className="text-purple-200 ml-2 font-mono">{container.route}</span>
              </div>
            )}
            {container.docker_url && (
              <div>
                <span className="text-purple-400">URL:</span> 
                <span className="text-purple-200 ml-2 font-mono">{container.docker_url}</span>
              </div>
            )}
          </div>
        )}

        {/* NPM Badge */}
        {container.is_npm && (
          <div className="mb-3">
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
              🔧 Nginx Proxy Manager
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-6 gap-2">
          {container.status === 'running' ? (
            <>
              <button
                onClick={() => handleAction('stop')}
                disabled={loading}
                data-testid={`stop-${container.name}`}
                className="col-span-3 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Square size={14} />
                Stop
              </button>
              <button
                onClick={() => handleAction('pause')}
                disabled={loading}
                data-testid={`pause-${container.name}`}
                className="col-span-3 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Pause size={14} />
                Pause
              </button>
            </>
          ) : container.status === 'paused' ? (
            <button
              onClick={() => handleAction('unpause')}
              disabled={loading}
              data-testid={`unpause-${container.name}`}
              className="col-span-6 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Play size={14} />
              Unpause
            </button>
          ) : (
            <button
              onClick={() => handleAction('start')}
              disabled={loading}
              data-testid={`start-${container.name}`}
              className="col-span-6 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Play size={14} />
              Start
            </button>
          )}
          <button
            onClick={() => handleAction('restart')}
            disabled={loading}
            data-testid={`restart-${container.name}`}
            className="col-span-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            title="Restart"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => setShowInspect(true)}
            data-testid={`inspect-${container.name}`}
            className="col-span-2 p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            title="Inspect"
          >
            <Code size={14} />
          </button>
          <button
            onClick={() => setShowNetworkInfo(true)}
            data-testid={`network-${container.name}`}
            className="col-span-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="Network Info"
          >
            <Network size={14} />
          </button>
          <button
            onClick={() => setShowLogs(true)}
            data-testid={`logs-${container.name}`}
            className="col-span-3 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="View Logs"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => handleAction('remove')}
            disabled={loading}
            data-testid={`remove-${container.name}`}
            className="col-span-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {showLogs && (
        <LogsModal
          containerName={container.name}
          onClose={() => setShowLogs(false)}
        />
      )}

      {showNetworkInfo && (
        <NetworkInfoModal
          container={container}
          onClose={() => setShowNetworkInfo(false)}
        />
      )}

      {showInspect && (
        <InspectModal
          containerName={container.name}
          onClose={() => setShowInspect(false)}
        />
      )}
    </>
  );
};

export default ContainerCard;
