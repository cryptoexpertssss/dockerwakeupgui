import React, { useState } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateContainerModal = ({ containers, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    network_mode: 'bridge',
    restart_policy: 'unless-stopped',
    command: '',
    idle_timeout: '',
    depends_on: [],
    ports: [],
    volumes: [],
    environment: [],
    // New fields
    route: '',
    docker_url: '',
    docker_path: '',
    deployment_type: 'docker_run',  // 'docker_run' or 'compose'
    run_command: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Port Management
  const addPort = () => {
    setFormData(prev => ({
      ...prev,
      ports: [...prev.ports, { host_port: '', container_port: '', protocol: 'tcp' }]
    }));
  };

  const updatePort = (index, field, value) => {
    setFormData(prev => {
      const newPorts = [...prev.ports];
      newPorts[index][field] = value;
      return { ...prev, ports: newPorts };
    });
  };

  const removePort = (index) => {
    setFormData(prev => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index)
    }));
  };

  // Volume Management
  const addVolume = () => {
    setFormData(prev => ({
      ...prev,
      volumes: [...prev.volumes, { host_path: '', container_path: '', mode: 'rw' }]
    }));
  };

  const updateVolume = (index, field, value) => {
    setFormData(prev => {
      const newVolumes = [...prev.volumes];
      newVolumes[index][field] = value;
      return { ...prev, volumes: newVolumes };
    });
  };

  const removeVolume = (index) => {
    setFormData(prev => ({
      ...prev,
      volumes: prev.volumes.filter((_, i) => i !== index)
    }));
  };

  // Environment Variables Management
  const addEnvVar = () => {
    setFormData(prev => ({
      ...prev,
      environment: [...prev.environment, { key: '', value: '' }]
    }));
  };

  const updateEnvVar = (index, field, value) => {
    setFormData(prev => {
      const newEnv = [...prev.environment];
      newEnv[index][field] = value;
      return { ...prev, environment: newEnv };
    });
  };

  const removeEnvVar = (index) => {
    setFormData(prev => ({
      ...prev,
      environment: prev.environment.filter((_, i) => i !== index)
    }));
  };

  // Dependencies Management
  const toggleDependency = (containerName) => {
    setFormData(prev => {
      const isSelected = prev.depends_on.includes(containerName);
      return {
        ...prev,
        depends_on: isSelected
          ? prev.depends_on.filter(name => name !== containerName)
          : [...prev.depends_on, containerName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Container name is required');
      return;
    }
    if (!formData.image.trim()) {
      toast.error('Docker image is required');
      return;
    }

    setLoading(true);
    
    try {
      // Format environment variables
      const environment = {};
      formData.environment.forEach(env => {
        if (env.key.trim()) {
          environment[env.key] = env.value;
        }
      });

      // Prepare request payload
      const payload = {
        name: formData.name,
        image: formData.image,
        network_mode: formData.network_mode,
        restart_policy: formData.restart_policy,
        command: formData.command || null,
        idle_timeout: formData.idle_timeout ? parseInt(formData.idle_timeout) : null,
        depends_on: formData.depends_on,
        ports: formData.ports.filter(p => p.host_port && p.container_port),
        volumes: formData.volumes.filter(v => v.host_path && v.container_path),
        environment,
        labels: {}
      };

      const response = await axios.post(`${API}/container/create`, payload);
      
      toast.success(`Container ${formData.name} created successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error creating container:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to create container';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700 text-white" data-testid="create-container-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">Add New Container</DialogTitle>
            <button
              onClick={onClose}
              data-testid="close-create-modal"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[calc(90vh-180px)] pr-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="basic" className="data-[state=active]:bg-blue-600">Basic</TabsTrigger>
                <TabsTrigger value="network" className="data-[state=active]:bg-blue-600">Network</TabsTrigger>
                <TabsTrigger value="volumes" className="data-[state=active]:bg-blue-600">Volumes</TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600">Advanced</TabsTrigger>
              </TabsList>

              {/* Basic Configuration */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name" className="text-white">Container Name *</Label>
                  <Input
                    id="name"
                    data-testid="container-name-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="my-container"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Unique name for your container</p>
                </div>

                <div>
                  <Label htmlFor="image" className="text-white">Docker Image *</Label>
                  <Input
                    id="image"
                    data-testid="image-input"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="nginx:latest"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Docker image name with tag (e.g., redis:7, postgres:15)</p>
                </div>

                <div>
                  <Label htmlFor="command" className="text-white">Command (Optional)</Label>
                  <Input
                    id="command"
                    data-testid="command-input"
                    value={formData.command}
                    onChange={(e) => handleInputChange('command', e.target.value)}
                    placeholder="/bin/sh -c 'echo hello'"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">Override the default command</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="restart_policy" className="text-white">Restart Policy</Label>
                    <Select value={formData.restart_policy} onValueChange={(value) => handleInputChange('restart_policy', value)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2" data-testid="restart-policy-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="unless-stopped">Unless Stopped</SelectItem>
                        <SelectItem value="on-failure">On Failure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="idle_timeout" className="text-white">Idle Timeout (seconds)</Label>
                    <Input
                      id="idle_timeout"
                      type="number"
                      data-testid="idle-timeout-input"
                      value={formData.idle_timeout}
                      onChange={(e) => handleInputChange('idle_timeout', e.target.value)}
                      placeholder="3600"
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                </div>

                {/* Dependencies */}
                {containers.length > 0 && (
                  <div>
                    <Label className="text-white mb-2 block">Dependencies (Start Before This)</Label>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {containers.map((container) => (
                        <div key={container.name} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`dep-${container.name}`}
                            checked={formData.depends_on.includes(container.name)}
                            onChange={() => toggleDependency(container.name)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                          />
                          <label htmlFor={`dep-${container.name}`} className="text-sm text-gray-300">
                            {container.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Select containers that must start before this one</p>
                  </div>
                )}
              </TabsContent>

              {/* Network Configuration */}
              <TabsContent value="network" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="network_mode" className="text-white">Network Mode</Label>
                  <Select value={formData.network_mode} onValueChange={(value) => handleInputChange('network_mode', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="bridge">Bridge</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Port Mappings</Label>
                    <Button
                      type="button"
                      onClick={addPort}
                      data-testid="add-port-button"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      size="sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Port
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.ports.map((port, index) => (
                      <div key={index} className="flex gap-2" data-testid={`port-mapping-${index}`}>
                        <Input
                          placeholder="Host Port"
                          value={port.host_port}
                          onChange={(e) => updatePort(index, 'host_port', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        <span className="text-gray-400 flex items-center">→</span>
                        <Input
                          placeholder="Container Port"
                          value={port.container_port}
                          onChange={(e) => updatePort(index, 'container_port', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        <Select value={port.protocol} onValueChange={(value) => updatePort(index, 'protocol', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => removePort(index)}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    {formData.ports.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No port mappings. Click "Add Port" to create one.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Volumes Configuration */}
              <TabsContent value="volumes" className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Volume Mounts</Label>
                    <Button
                      type="button"
                      onClick={addVolume}
                      data-testid="add-volume-button"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      size="sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Volume
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.volumes.map((volume, index) => (
                      <div key={index} className="flex gap-2" data-testid={`volume-mount-${index}`}>
                        <Input
                          placeholder="Host Path (/path/on/host)"
                          value={volume.host_path}
                          onChange={(e) => updateVolume(index, 'host_path', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        <span className="text-gray-400 flex items-center">→</span>
                        <Input
                          placeholder="Container Path (/path/in/container)"
                          value={volume.container_path}
                          onChange={(e) => updateVolume(index, 'container_path', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        <Select value={volume.mode} onValueChange={(value) => updateVolume(index, 'mode', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="rw">RW</SelectItem>
                            <SelectItem value="ro">RO</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => removeVolume(index)}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    {formData.volumes.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No volume mounts. Click "Add Volume" to create one.</p>
                    )}
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4 flex gap-2">
                    <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300">
                      Volume mounts allow you to persist data and share files between host and container. 
                      RW = Read/Write, RO = Read-Only
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Configuration */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Environment Variables</Label>
                    <Button
                      type="button"
                      onClick={addEnvVar}
                      data-testid="add-env-button"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      size="sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Variable
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.environment.map((env, index) => (
                      <div key={index} className="flex gap-2" data-testid={`env-var-${index}`}>
                        <Input
                          placeholder="KEY"
                          value={env.key}
                          onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        <span className="text-gray-400 flex items-center">=</span>
                        <Input
                          placeholder="value"
                          value={env.value}
                          onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => removeEnvVar(index)}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    {formData.environment.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No environment variables. Click "Add Variable" to create one.</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              data-testid="cancel-create"
              className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="create-container-submit"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Container'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContainerModal;
