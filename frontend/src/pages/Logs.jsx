import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/activity-logs?limit=100`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    return status === 'success' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusBg = (status) => {
    return status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20';
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131a] to-[#0a0a0f]">
      <Sidebar active="logs" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="logs-title">
                  Activity Logs
                </h1>
                <p className="text-gray-400">{logs.length} recent activities</p>
              </div>
              <button
                onClick={fetchLogs}
                data-testid="refresh-logs-button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12" data-testid="loading-logs">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading activity logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700" data-testid="no-logs">
                <Activity size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No activity logs found</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={log.id || index}
                  data-testid={`log-entry-${index}`}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBg(log.status)} ${getStatusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-blue-400 font-medium">{log.event_type}</span>
                        {log.container_name && (
                          <span className="text-gray-400">• {log.container_name}</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{log.message}</p>
                    </div>
                    <span className="text-gray-500 text-xs whitespace-nowrap ml-4">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
