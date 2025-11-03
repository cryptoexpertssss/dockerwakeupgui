import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, RefreshCw, HardDrive, Cpu, Box } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SystemInfo = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/system/info`);
      setInfo(response.data);
    } catch (error) {
      console.error('Error fetching system info:', error);
      toast.error('Failed to fetch system information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
        <Sidebar active="system" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading system info...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
      <Sidebar active="system" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="system-info-title">System Information</h1>
                <p className="text-gray-400">Docker and system details</p>
              </div>
              <Button onClick={fetchInfo} className="bg-blue-600 hover:bg-blue-700" data-testid="refresh-system-info">
                <RefreshCw size={18} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {info && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Docker Info */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Server className="text-blue-400" size={24} />
                  Docker Engine
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white font-semibold">{info.docker_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Version:</span>
                    <span className="text-white font-semibold">{info.api_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Storage Driver:</span>
                    <Badge variant="outline" className="border-blue-500 text-blue-300">{info.storage_driver}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Architecture:</span>
                    <span className="text-white font-semibold">{info.architecture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Operating System:</span>
                    <span className="text-white font-semibold">{info.os}</span>
                  </div>
                </div>
              </div>

              {/* Hardware Info */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Cpu className="text-green-400" size={24} />
                  Hardware
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPUs:</span>
                    <span className="text-white font-semibold">{info.cpus} cores</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Memory:</span>
                    <span className="text-white font-semibold">{info.memory_total_gb} GB</span>
                  </div>
                </div>
              </div>

              {/* Container Stats */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Box className="text-purple-400" size={24} />
                  Containers
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-semibold">{info.containers_total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Running:</span>
                    <Badge className="bg-green-600">{info.containers_running}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paused:</span>
                    <Badge className="bg-yellow-600">{info.containers_paused}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stopped:</span>
                    <Badge className="bg-gray-600">{info.containers_stopped}</Badge>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <HardDrive className="text-orange-400" size={24} />
                  Images
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Images:</span>
                    <span className="text-white font-semibold">{info.images_count}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Network Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-gray-900 border-gray-700" data-testid="create-network-modal">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Network</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-white">Network Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="my-network"
                className="bg-gray-800 border-gray-700 text-white mt-2"
                required
                data-testid="network-name-input"
              />
            </div>
            <div>
              <Label className="text-white">Subnet (Optional)</Label>
              <Input
                value={formData.subnet}
                onChange={(e) => setFormData({...formData, subnet: e.target.value})}
                placeholder="172.20.0.0/16"
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-white">Gateway (Optional)</Label>
              <Input
                value={formData.gateway}
                onChange={(e) => setFormData({...formData, gateway: e.target.value})}
                placeholder="172.20.0.1"
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline" className="bg-gray-700 text-white border-gray-600">Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700" data-testid="confirm-create-network">
                {creating ? 'Creating...' : 'Create Network'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteNetwork} onOpenChange={() => setDeleteNetwork(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Network</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete network "{deleteNetwork}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="confirm-delete-network">
              Delete Network
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SystemInfo;
