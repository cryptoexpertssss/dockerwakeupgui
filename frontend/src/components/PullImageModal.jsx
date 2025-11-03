import React, { useState } from 'react';
import axios from 'axios';
import { X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PullImageModal = ({ onClose, onSuccess }) => {
  const [pulling, setPulling] = useState(false);
  const [imageName, setImageName] = useState('');
  const [tag, setTag] = useState('latest');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageName.trim()) {
      toast.error('Image name is required');
      return;
    }

    setPulling(true);
    
    try {
      const response = await axios.post(`${API}/images/pull`, {
        image: imageName,
        tag: tag || 'latest'
      });
      
      toast.success(`Image ${imageName}:${tag} pulled successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error pulling image:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to pull image';
      toast.error(errorMsg);
    } finally {
      setPulling(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white" data-testid="pull-image-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Pull Docker Image</DialogTitle>
            <button
              onClick={onClose}
              data-testid="close-pull-modal"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="image" className="text-white">Image Name *</Label>
            <Input
              id="image"
              data-testid="pull-image-name"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="nginx"
              className="bg-gray-800 border-gray-700 text-white mt-2"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Docker Hub image name (e.g., nginx, redis, postgres)</p>
          </div>

          <div>
            <Label htmlFor="tag" className="text-white">Tag</Label>
            <Input
              id="tag"
              data-testid="pull-image-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="latest"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
            <p className="text-xs text-gray-400 mt-1">Image tag or version (default: latest)</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              Pulling image: <span className="font-mono font-semibold">{imageName || 'image'}:{tag || 'latest'}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              data-testid="cancel-pull"
              className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pulling}
              data-testid="confirm-pull"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {pulling ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Pulling...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Pull Image
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PullImageModal;
