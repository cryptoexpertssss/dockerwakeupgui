import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, RefreshCw, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import PullImageModal from '../components/PullImageModal';
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
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Images = () => {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPruneDialog, setShowPruneDialog] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/images`);
      setImages(response.data.images || []);
      setFilteredImages(response.data.images || []);
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

  useEffect(() => {
    if (searchQuery) {
      const filtered = images.filter(img =>
        img.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredImages(filtered);
    } else {
      setFilteredImages(images);
    }
  }, [searchQuery, images]);

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

  const handlePullSuccess = () => {
    setShowPullModal(false);
    fetchImages();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
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
                <p className="text-gray-400">{filteredImages.length} of {images.length} images</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPullModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="pull-image-button"
                >
                  <Download size={18} className="mr-2" />
                  Pull Image
                </Button>
                <Button
                  onClick={fetchImages}
                  className="bg-gray-700 hover:bg-gray-600"
                  data-testid="refresh-images-button"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowPruneDialog(true)}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="prune-images-button"
                >
                  <Trash2 size={18} className="mr-2" />
                  Prune Unused
                </Button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search images by repository, tag, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800/40 border-gray-700 text-white pl-10"
                data-testid="search-images"
              />
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
                    {filteredImages.map((image, index) => (
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

      {/* Pull Image Modal */}
      {showPullModal && (
        <PullImageModal
          onClose={() => setShowPullModal(false)}
          onSuccess={handlePullSuccess}
        />
      )}

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
