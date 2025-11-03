import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Images = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPruneDialog, setShowPruneDialog] = useState(false);
  const [pruning, setPruning] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/images`);
      setImages(response.data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handlePrune = async () => {
    setPruning(true);
    try {
      const response = await axios.post(`${API}/images/prune`);
      toast.success(`Pruned images! Reclaimed ${response.data.space_reclaimed_mb} MB`);
      setShowPruneDialog(false);
      fetchImages();
    } catch (error) {
      console.error('Error pruning images:', error);
      toast.error('Failed to prune images');
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131a] to-[#0a0a0f]">
      <Sidebar active="images" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="images-title">
                  Docker Images
                </h1>
                <p className="text-gray-400">{images.length} images</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchImages}
                  data-testid="refresh-images-button"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                <button
                  onClick={() => setShowPruneDialog(true)}
                  data-testid="prune-images-button"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  Prune Unused
                </button>
              </div>
            </div>
          </div>

          {/* Images Table */}
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12" data-testid="loading-images">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading images...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="images-table">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Repository</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tag</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Image ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Size</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {images.map((image, index) => (
                      <tr key={`${image.id}-${index}`} className="hover:bg-gray-700/30 transition-colors" data-testid={`image-row-${index}`}>
                        <td className="px-6 py-4 text-sm text-white font-medium">{image.repository}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">{image.tag}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">{image.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{image.size_mb} MB</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{new Date(image.created).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prune Confirmation Dialog */}
      <AlertDialog open={showPruneDialog} onOpenChange={setShowPruneDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Prune Unused Images</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove all dangling and unused images. This action cannot be undone and may reclaim significant disk space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600" data-testid="cancel-prune">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePrune}
              disabled={pruning}
              data-testid="confirm-prune"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {pruning ? 'Pruning...' : 'Prune Images'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Images;
