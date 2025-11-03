import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, Box, Image as ImageIcon, Settings as SettingsIcon, RefreshCw, AlertCircle, Plus, Search, Grid, List, Filter } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import ContainerCard from '../components/ContainerCard';
import SystemMetrics from '../components/SystemMetrics';
import BulkActionBar from '../components/BulkActionBar';
import CreateContainerModal from '../components/CreateContainerModal';
import PullImageModal from '../components/PullImageModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dockerAvailable, setDockerAvailable] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') || 'grid');
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

  useEffect(() => {
    if (containerStats && containerStats.length > 0) {
      setContainers(containerStats);
    }
  }, [containerStats]);

  // Filter containers
  useEffect(() => {
    let filtered = containers;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    setFilteredContainers(filtered);
  }, [containers, searchQuery, statusFilter, typeFilter]);

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

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
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
                  {connected ? 'Connected' : 'Disconnected'} • {filteredContainers.length} of {containers.length} containers
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPullModal(true)}
                  data-testid="pull-image-button"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <ImageIcon size={18} />
                  Pull Image
                </button>
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
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 animate-fade-in" data-testid="docker-unavailable-warning">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-red-500 font-semibold mb-1">Docker Not Available</h3>
                <p className="text-red-400 text-sm">Cannot connect to Docker. Ensure Docker is installed and the socket is mounted at /var/run/docker.sock</p>
              </div>
            </div>
          )}

          {/* System Metrics */}
          <SystemMetrics metrics={systemMetrics} />

          {/* Search and Filters */}
          <div className="mb-6 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search containers by name, image, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white pl-10"
                    data-testid="search-containers"
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="exited">Stopped</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="compose">Compose</SelectItem>
                    <SelectItem value="docker_run">Docker Run</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
                  <span>Showing {filteredContainers.length} of {containers.length} containers</span>
                ) : (
                  <span>Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+K</kbd> for quick navigation</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleViewMode('grid')}
                  data-testid="grid-view"
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => toggleViewMode('list')}
                  data-testid="list-view"
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedContainers.length > 0 && (
            <BulkActionBar
              selectedCount={selectedContainers.length}
              selectedContainers={selectedContainers}
              onClear={() => setSelectedContainers([])}
              onActionComplete={fetchContainers}
            />
          )}

          {/* Containers Grid/List */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Containers</h2>
            {loading ? (
              <div className="text-center py-12" data-testid="loading-spinner">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading containers...</p>
              </div>
            ) : filteredContainers.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700" data-testid="no-containers">
                <Box size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 mb-4">
                  {containers.length === 0 ? 'No containers found' : 'No containers match your filters'}
                </p>
                {containers.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Your First Container
                  </button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'} data-testid="containers-grid">
                {filteredContainers.map((container, index) => (
                  <ContainerCard
                    key={container.name}
                    container={container}
                    selected={selectedContainers.includes(container.name)}
                    onSelect={handleSelectContainer}
                    onActionComplete={fetchContainers}
                    viewMode={viewMode}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateContainerModal
          containers={containers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showPullModal && (
        <PullImageModal
          onClose={() => setShowPullModal(false)}
          onSuccess={() => {
            setShowPullModal(false);
            toast.success('Image pulled successfully!');
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
