import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HardDrive, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Volumes = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteVolume, setDeleteVolume] = useState(null);
  const [volumeName, setVolumeName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchVolumes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/volumes`);
      setVolumes(response.data.volumes || []);
    } catch (error) {
      console.error('Error fetching volumes:', error);
      toast.error('Failed to fetch volumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API}/volumes/create`, { name: volumeName, driver: 'local' });
      toast.success(`Volume ${volumeName} created!`);
      setShowCreateModal(false);
      setVolumeName('');
      fetchVolumes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create volume');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/volumes/${deleteVolume}`);
      toast.success(`Volume ${deleteVolume} deleted`);
      setDeleteVolume(null);
      fetchVolumes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete volume');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
      <Sidebar active="volumes" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="volumes-title">Docker Volumes</h1>
                <p className="text-gray-400">{volumes.length} volumes</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={fetchVolumes} className="bg-gray-700 hover:bg-gray-600" data-testid="refresh-volumes">
                  <RefreshCw size={18} className="mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700" data-testid="create-volume-button">
                  <Plus size={18} className="mr-2" />
                  Create Volume
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading volumes...</p>
              </div>
            ) : (
              <table className="w-full" data-testid="volumes-table">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Driver</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Mountpoint</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Scope</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {volumes.map((volume, index) => (
                    <tr key={volume.name} className="hover:bg-gray-700/30 transition-colors" data-testid={`volume-row-${index}`}>
                      <td className="px-6 py-4 text-sm text-white font-medium">{volume.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{volume.driver}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">{volume.mountpoint}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{volume.scope}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => setDeleteVolume(volume.name)}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          data-testid={`delete-volume-${index}`}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Volume Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-gray-900 border-gray-700" data-testid="create-volume-modal">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Volume</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-white">Volume Name</Label>
              <Input
                value={volumeName}
                onChange={(e) => setVolumeName(e.target.value)}
                placeholder="my-volume"
                className="bg-gray-800 border-gray-700 text-white mt-2"
                required
                data-testid="volume-name-input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline" className="bg-gray-700 text-white border-gray-600">Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700" data-testid="confirm-create-volume">
                {creating ? 'Creating...' : 'Create Volume'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteVolume} onOpenChange={() => setDeleteVolume(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Volume</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete volume "{deleteVolume}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="confirm-delete-volume">
              Delete Volume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Volumes;
