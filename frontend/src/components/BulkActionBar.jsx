import React, { useState } from 'react';
import axios from 'axios';
import { Play, Square, RotateCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BulkActionBar = ({ selectedCount, selectedContainers, onClear, onActionComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async (action) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/containers/bulk`, {
        container_names: selectedContainers,
        action: action
      });
      
      const successful = response.data.results.filter(r => r.success).length;
      const failed = response.data.results.filter(r => !r.success).length;
      
      if (failed === 0) {
        toast.success(`Bulk ${action} completed for ${successful} containers`);
      } else {
        toast.warning(`Bulk ${action}: ${successful} succeeded, ${failed} failed`);
      }
      
      onClear();
      onActionComplete();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(`Bulk ${action} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm rounded-lg p-4 animate-slide-in" data-testid="bulk-action-bar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold" data-testid="selected-count">{selectedCount} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('start')}
              disabled={loading}
              data-testid="bulk-start"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Play size={16} />
              Start All
            </button>
            <button
              onClick={() => handleBulkAction('stop')}
              disabled={loading}
              data-testid="bulk-stop"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Square size={16} />
              Stop All
            </button>
            <button
              onClick={() => handleBulkAction('restart')}
              disabled={loading}
              data-testid="bulk-restart"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RotateCw size={16} />
              Restart All
            </button>
            <button
              onClick={() => handleBulkAction('remove')}
              disabled={loading}
              data-testid="bulk-remove"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Remove All
            </button>
          </div>
        </div>
        <button
          onClick={onClear}
          data-testid="clear-selection"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
