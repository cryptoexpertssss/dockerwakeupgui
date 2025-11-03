import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wifi, Plus, Trash2, RefreshCw, Network } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Networks = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteNetwork, setDeleteNetwork] = useState(null);
  const [formData, setFormData] = useState({ name: '', driver: 'bridge', subnet: '', gateway: '' });
  const [creating, setCreating] = useState(false);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/networks`);
      setNetworks(response.data.networks || []);
    } catch (error) {
      console.error('Error fetching networks:', error);
      toast.error('Failed to fetch networks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API}/networks/create`, formData);
      toast.success(`Network ${formData.name} created!`);
      setShowCreateModal(false);
      setFormData({ name: '', driver: 'bridge', subnet: '', gateway: '' });
      fetchNetworks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create network');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/networks/${deleteNetwork}`);
      toast.success(`Network ${deleteNetwork} deleted`);
      setDeleteNetwork(null);
      fetchNetworks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete network');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
      <Sidebar active="networks" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="networks-title">Docker Networks</h1>
                <p className="text-gray-400">{networks.length} networks</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={fetchNetworks} className="bg-gray-700 hover:bg-gray-600" data-testid="refresh-networks">
                  <RefreshCw size={18} className="mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700" data-testid="create-network-button">
                  <Plus size={18} className="mr-2" />
                  Create Network
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading networks...</p>
              </div>
            ) : (
              networks.map((network, index) => (
                <div key={network.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-purple-500/50 transition-all animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }} data-testid={`network-card-${index}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Wifi size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{network.name}</h3>
                        <p className="text-gray-400 text-xs">{network.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Driver:</span>
                      <Badge variant="outline" className="border-purple-500 text-purple-300">{network.driver}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subnet:</span>
                      <span className="text-white font-mono text-xs">{network.subnet}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Gateway:</span>
                      <span className="text-white font-mono text-xs">{network.gateway}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Containers:</span>
                      <span className="text-white font-semibold">{network.container_count}</span>
                    </div>
                  </div>

                  {network.containers.length > 0 && (
                    <div className="mb-4">
                      <p className="text-gray-400 text-xs mb-2">Connected:</p>
                      <div className="flex flex-wrap gap-1">
                        {network.containers.slice(0, 3).map((container, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                            {container}
                          </span>
                        ))}
                        {network.containers.length > 3 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                            +{network.containers.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {!['bridge', 'host', 'none'].includes(network.name) && (
                    <Button
                      onClick={() => setDeleteNetwork(network.name)}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="sm"
                      data-testid={`delete-network-${index}`}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Network
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
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

export default Networks;
