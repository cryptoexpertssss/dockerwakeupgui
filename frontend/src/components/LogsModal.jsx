import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LogsModal = ({ containerName, onClose }) => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/logs/${containerName}?tail=200`);
      setLogs(response.data.logs || 'No logs available');
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [containerName]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-gray-900 border-gray-700 text-white" data-testid="logs-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold" data-testid="logs-modal-title">Container Logs: {containerName}</DialogTitle>
            <div className="flex gap-2">
              <button
                onClick={fetchLogs}
                data-testid="refresh-logs"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={onClose}
                data-testid="close-logs"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-black rounded-lg p-4 font-mono text-sm" data-testid="logs-content">
          {loading ? (
            <div className="text-center text-gray-400">Loading logs...</div>
          ) : (
            <pre className="text-green-400 whitespace-pre-wrap break-words">{logs}</pre>
          )}
          <div ref={logsEndRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogsModal;
