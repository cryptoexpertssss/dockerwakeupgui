import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InspectModal = ({ containerName, onClose }) => {
  const [inspectData, setInspectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspect = async () => {
      try {
        const response = await axios.get(`${API}/container/${containerName}/inspect`);
        setInspectData(response.data.inspect);
      } catch (error) {
        console.error('Error fetching inspect data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspect();
  }, [containerName]);

  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] bg-gray-900 border-gray-700 text-white" data-testid="inspect-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Code className="text-blue-400" size={20} />
              Inspect: {containerName}
            </DialogTitle>
            <button onClick={onClose} data-testid="close-inspect" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex-1">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(85vh-180px)] mt-4">
              <TabsContent value="overview" className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">ID:</span> <span className="text-white font-mono">{inspectData?.Id?.substring(0, 12)}</span></div>
                    <div><span className="text-gray-400">Created:</span> <span className="text-white">{new Date(inspectData?.Created).toLocaleString()}</span></div>
                    <div><span className="text-gray-400">Image:</span> <span className="text-white">{inspectData?.Config?.Image}</span></div>
                    <div><span className="text-gray-400">Status:</span> <span className="text-white">{inspectData?.State?.Status}</span></div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">State</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">Running:</span> <span className="text-white">{inspectData?.State?.Running ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-400">Paused:</span> <span className="text-white">{inspectData?.State?.Paused ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-400">Restarting:</span> <span className="text-white">{inspectData?.State?.Restarting ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-400">Exit Code:</span> <span className="text-white">{inspectData?.State?.ExitCode}</span></div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Environment Variables</h3>
                  <div className="space-y-2">
                    {inspectData?.Config?.Env?.map((env, idx) => (
                      <div key={idx} className="text-sm font-mono text-gray-300 bg-gray-900/50 p-2 rounded">{env}</div>
                    ))}
                  </div>
                </div>
                {inspectData?.Config?.Cmd && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Command</h3>
                    <div className="text-sm font-mono text-gray-300 bg-gray-900/50 p-3 rounded">
                      {inspectData.Config.Cmd.join(' ')}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Networks</h3>
                  {Object.entries(inspectData?.NetworkSettings?.Networks || {}).map(([name, data]) => (
                    <div key={name} className="mb-4 p-3 bg-gray-900/50 rounded">
                      <h4 className="text-blue-400 font-semibold mb-2">{name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-400">IP:</span> <span className="text-white font-mono">{data.IPAddress}</span></div>
                        <div><span className="text-gray-400">Gateway:</span> <span className="text-white font-mono">{data.Gateway}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <div className="bg-gray-900/90 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(inspectData, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InspectModal;
