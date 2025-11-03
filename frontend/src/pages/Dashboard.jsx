import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, Box, Image as ImageIcon, Settings as SettingsIcon, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import ContainerCard from '../components/ContainerCard';
import SystemMetrics from '../components/SystemMetrics';
import BulkActionBar from '../components/BulkActionBar';
import CreateContainerModal from '../components/CreateContainerModal';
import { useWebSocket } from '../hooks/useWebSocket';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dockerAvailable, setDockerAvailable] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { systemMetrics, containerStats, connected } = useWebSocket();

  const fetchContainers = async () => {
    try {
      const response = await axios.get(`${API}/containers`);
      setContainers(response.data.containers || []);
      setDockerAvailable(true);
    } catch (error) {
      console.error('Error fetching containers:', error);
      if (error.response?.status === 503) {
        setDockerAvailable(false);
        toast.error('Docker is not available. Please ensure Docker is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update containers with WebSocket stats
  useEffect(() => {
    if (containerStats && containerStats.length > 0) {
      setContainers(containerStats);
    }
  }, [containerStats]);

  const handleSelectContainer = (name) => {
    setSelectedContainers(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchContainers();
    toast.success('Refreshed containers list');
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchContainers();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131a] to-[#0a0a0f]">
      <Sidebar active="dashboard" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="dashboard-title">
                  Docker Dashboard
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                  {connected ? 'Connected' : 'Disconnected'} • {containers.length} containers
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  data-testid="add-container-button"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Add Container
                </button>
                <button
                  onClick={handleRefresh}
                  data-testid="refresh-button"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Docker unavailable warning */}
          {!dockerAvailable && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3" data-testid="docker-unavailable-warning">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-red-500 font-semibold mb-1">Docker Not Available</h3>
                <p className="text-red-400 text-sm">Cannot connect to Docker. Ensure Docker is installed and the socket is mounted at /var/run/docker.sock</p>
              </div>
            </div>
          )}

          {/* System Metrics */}
          <SystemMetrics metrics={systemMetrics} />

          {/* Bulk Action Bar */}
          {selectedContainers.length > 0 && (
            <BulkActionBar
              selectedCount={selectedContainers.length}
              selectedContainers={selectedContainers}
              onClear={() => setSelectedContainers([])}
              onActionComplete={fetchContainers}
            />
          )}

          {/* Containers Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Containers</h2>
            {loading ? (
              <div className="text-center py-12" data-testid="loading-spinner">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading containers...</p>
              </div>
            ) : containers.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700" data-testid="no-containers">
                <Box size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 mb-4">No containers found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Your First Container
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="containers-grid">
                {containers.map((container, index) => (
                  <ContainerCard
                    key={container.name}
                    container={container}
                    selected={selectedContainers.includes(container.name)}
                    onSelect={handleSelectContainer}
                    onActionComplete={fetchContainers}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Container Modal */}
      {showCreateModal && (
        <CreateContainerModal
          containers={containers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
