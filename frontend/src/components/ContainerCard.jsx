import React, { useState } from 'react';
import axios from 'axios';
import { Play, Square, RotateCw, Trash2, Pause, FileText, Network } from 'lucide-react';
import { toast } from 'sonner';
import LogsModal from './LogsModal';
import NetworkInfoModal from './NetworkInfoModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContainerCard = ({ container, selected, onSelect, onActionComplete, style }) => {
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

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

  const getTypeIcon = (type) => {
    return type === 'compose' ? '📦' : '🐋';
  };

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
          <span className={`w-3 h-3 rounded-full ${getStatusColor(container.status)} animate-pulse`} data-testid={`status-${container.name}`}></span>
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

        {/* Network Info Badge */}
        {container.is_npm && (
          <div className="mb-3">
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
              🔧 Nginx Proxy Manager
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-6 gap-2">{container.status === 'running' ? (
            <>
              <button
                onClick={() => handleAction('stop')}
                disabled={loading}
                data-testid={`stop-${container.name}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Square size={14} />
                Stop
              </button>
              <button
                onClick={() => handleAction('pause')}
                disabled={loading}
                data-testid={`pause-${container.name}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
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
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Play size={14} />
              Unpause
            </button>
          ) : (
            <button
              onClick={() => handleAction('start')}
              disabled={loading}
              data-testid={`start-${container.name}`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Play size={14} />
              Start
            </button>
          )}
          <button
            onClick={() => handleAction('restart')}
            disabled={loading}
            data-testid={`restart-${container.name}`}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => setShowLogs(true)}
            data-testid={`logs-${container.name}`}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => handleAction('remove')}
            disabled={loading}
            data-testid={`remove-${container.name}`}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
    </>
  );
};

export default ContainerCard;
