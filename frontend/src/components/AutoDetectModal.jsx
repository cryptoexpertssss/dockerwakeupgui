import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, CheckCircle, AlertCircle, Box, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AutoDetectModal = ({ onClose, onSuccess }) => {
  const [detecting, setDetecting] = useState(true);
  const [detected, setDetected] = useState({ running_containers: [], compose_projects: [] });
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    detectContainers();
  }, []);

  const detectContainers = async () => {
    setDetecting(true);
    try {
      const response = await axios.get(`${API}/containers/detect`);
      setDetected(response.data);
      
      // Auto-select containers without metadata
      const toSelect = response.data.running_containers
        .filter(c => !c.has_metadata)
        .map(c => c.name);
      setSelectedContainers(toSelect);
      
      toast.success(`Detected ${response.data.running_containers.length} containers`);
    } catch (error) {
      console.error('Error detecting containers:', error);
      toast.error('Failed to detect containers');
    } finally {
      setDetecting(false);
    }
  };

  const toggleContainer = (name) => {
    setSelectedContainers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleImport = async () => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const containerName of selectedContainers) {
      try {
        const containerData = detected.running_containers.find(c => c.name === containerName);
        await axios.post(`${API}/containers/import`, containerData);
        successCount++;
      } catch (error) {
        console.error(`Error importing ${containerName}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Imported ${successCount} container(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} container(s)`);
    }

    setImporting(false);
    onSuccess();
  };

  const containersWithoutMetadata = detected.running_containers.filter(c => !c.has_metadata);
  const containersWithMetadata = detected.running_containers.filter(c => c.has_metadata);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] bg-gray-900 border-gray-700 text-white" data-testid="auto-detect-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Search className="text-blue-400" size={24} />
              Auto-Detect Containers
            </DialogTitle>
            <button
              onClick={onClose}
              data-testid="close-detect-modal"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        {detecting ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Scanning for containers and compose projects...</p>
            </div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="containers" className="flex-1">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="containers" className="data-[state=active]:bg-blue-600">
                  Running Containers ({detected.running_containers.length})
                </TabsTrigger>
                <TabsTrigger value="compose" className="data-[state=active]:bg-blue-600">
                  Compose Projects ({detected.compose_projects.length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(85vh-250px)] mt-4">
                <TabsContent value="containers" className="space-y-3">
                  {/* Containers without metadata */}
                  {containersWithoutMetadata.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="text-yellow-400" size={18} />
                        New Containers ({containersWithoutMetadata.length})
                      </h3>
                      <div className="space-y-2">
                        {containersWithoutMetadata.map((container) => (
                          <div
                            key={container.name}
                            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all"
                            data-testid={`detected-container-${container.name}`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedContainers.includes(container.name)}
                                onChange={() => toggleContainer(container.name)}
                                className="w-5 h-5 mt-1 rounded border-gray-600 bg-gray-700 text-blue-500"
                                data-testid={`checkbox-detect-${container.name}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-white font-semibold">{container.name}</h4>
                                  <Badge className={container.status === 'running' ? 'bg-green-600' : 'bg-gray-600'}>
                                    {container.status}
                                  </Badge>
                                  <Badge variant="outline" className="border-blue-500 text-blue-300">
                                    {container.type === 'compose' ? '📦 Compose' : '🐋 Docker Run'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-gray-400">Image:</span> <span className="text-white font-mono text-xs">{container.image}</span></div>
                                  <div><span className="text-gray-400">ID:</span> <span className="text-white font-mono text-xs">{container.id}</span></div>
                                  {container.compose_project && (
                                    <div><span className="text-gray-400">Project:</span> <span className="text-white text-xs">{container.compose_project}</span></div>
                                  )}
                                  {container.ports.length > 0 && (
                                    <div>
                                      <span className="text-gray-400">Ports:</span> 
                                      <span className="text-white text-xs ml-1">
                                        {container.ports.slice(0, 2).map(p => `${p.host_port}→${p.container_port}`).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Containers with metadata */}
                  {containersWithMetadata.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={18} />
                        Already Managed ({containersWithMetadata.length})
                      </h3>
                      <div className="space-y-2">
                        {containersWithMetadata.map((container) => (
                          <div
                            key={container.name}
                            className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 opacity-60"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={16} />
                              <span className="text-white font-medium">{container.name}</span>
                              <Badge className="bg-green-600/50">Already tracked</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detected.running_containers.length === 0 && (
                    <div className="text-center py-12">
                      <Box size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">No containers detected</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="compose" className="space-y-3">
                  {detected.compose_projects.length > 0 ? (
                    detected.compose_projects.map((project, index) => (
                      <div
                        key={index}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all"
                        data-testid={`compose-project-${index}`}
                      >
                        <div className="flex items-start gap-3">
                          <FileCode className="text-purple-400 mt-1" size={20} />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-2">{project.project_name}</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="text-gray-400">Path:</span> <span className="text-white font-mono text-xs">{project.path}</span></div>
                              <div><span className="text-gray-400">Directory:</span> <span className="text-white font-mono text-xs">{project.directory}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FileCode size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">No docker-compose projects found</p>
                      <p className="text-gray-500 text-sm mt-2">Scanned: /opt, /home, /root, /var/lib/docker</p>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                {selectedContainers.length > 0 && (
                  <span>{selectedContainers.length} container(s) selected for import</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={detectContainers}
                  variant="outline"
                  className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                  data-testid="rescan-button"
                >
                  <Search size={18} className="mr-2" />
                  Rescan
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedContainers.length === 0 || importing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="import-containers-button"
                >
                  {importing ? 'Importing...' : `Import ${selectedContainers.length} Container(s)`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AutoDetectModal;
