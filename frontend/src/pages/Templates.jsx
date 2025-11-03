import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bookmark, Plus, Trash2, RefreshCw, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRESET_TEMPLATES = [
  {
    name: 'Nginx Web Server',
    description: 'Nginx web server with port 80 exposed',
    category: 'web',
    config: {
      image: 'nginx:latest',
      ports: [{ host_port: '80', container_port: '80', protocol: 'tcp' }],
      restart_policy: 'unless-stopped'
    }
  },
  {
    name: 'MySQL Database',
    description: 'MySQL 8.0 database server',
    category: 'database',
    config: {
      image: 'mysql:8',
      ports: [{ host_port: '3306', container_port: '3306', protocol: 'tcp' }],
      environment: { MYSQL_ROOT_PASSWORD: 'changeme' },
      restart_policy: 'unless-stopped'
    }
  },
  {
    name: 'PostgreSQL Database',
    description: 'PostgreSQL 15 database',
    category: 'database',
    config: {
      image: 'postgres:15',
      ports: [{ host_port: '5432', container_port: '5432', protocol: 'tcp' }],
      environment: { POSTGRES_PASSWORD: 'changeme' },
      restart_policy: 'unless-stopped'
    }
  },
  {
    name: 'Redis Cache',
    description: 'Redis key-value store',
    category: 'cache',
    config: {
      image: 'redis:7-alpine',
      ports: [{ host_port: '6379', container_port: '6379', protocol: 'tcp' }],
      restart_policy: 'unless-stopped'
    }
  },
  {
    name: 'MongoDB',
    description: 'MongoDB NoSQL database',
    category: 'database',
    config: {
      image: 'mongo:7',
      ports: [{ host_port: '27017', container_port: '27017', protocol: 'tcp' }],
      restart_policy: 'unless-stopped'
    }
  }
];

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDeploy = (template) => {
    // This would open the create container modal with pre-filled data
    toast.info(`Deploy template: ${template.name}`);
  };

  const handleDelete = async (templateId) => {
    try {
      await axios.delete(`${API}/templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const allTemplates = [...PRESET_TEMPLATES, ...templates];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
      <Sidebar active="templates" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="templates-title">Container Templates</h1>
                <p className="text-gray-400">{allTemplates.length} templates available</p>
              </div>
              <Button onClick={fetchTemplates} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw size={18} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Template Categories */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preset Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_TEMPLATES.map((template, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-blue-500/50 transition-all" data-testid={`preset-template-${index}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bookmark className="text-blue-400" size={20} />
                      <h3 className="text-white font-semibold">{template.name}</h3>
                    </div>
                    <Badge className="bg-blue-600">{template.category}</Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    Image: <span className="font-mono text-gray-300">{template.config.image}</span>
                  </div>
                  <Button
                    onClick={() => handleDeploy(template)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Rocket size={14} className="mr-2" />
                    Deploy
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Templates */}
          {templates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Custom Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <div key={template.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-semibold">{template.name}</h3>
                      <Button
                        onClick={() => handleDelete(template.id)}
                        variant="destructive"
                        size="sm"
                        className="p-1"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                    <Button
                      onClick={() => handleDeploy(template)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Rocket size={14} className="mr-2" />
                      Deploy
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
