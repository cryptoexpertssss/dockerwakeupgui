import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
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

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [settings, setSettings] = useState({
    // System Settings
    poll_interval: 5,
    auto_refresh: true,
    ws_update_interval: 3,
    
    // Container Defaults
    default_restart_policy: 'unless-stopped',
    default_network_mode: 'bridge',
    default_idle_timeout: 3600,
    
    // Display Settings
    theme: 'dark',
    containers_per_page: 50,
    show_stopped_containers: true,
    
    // Notifications
    enable_notifications: true,
    notify_on_container_stop: true,
    notify_on_container_start: false,
    notify_on_errors: true,
    
    // Advanced
    docker_socket_path: '/var/run/docker.sock',
    log_retention_days: 30,
    enable_auto_prune: false,
    auto_prune_schedule: 'weekly'
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/settings`, settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post(`${API}/settings/reset`);
      setSettings(response.data.settings);
      setShowResetDialog(false);
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131a] to-[#0a0a0f]">
        <Sidebar active="settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131a] to-[#0a0a0f]">
      <Sidebar active="settings" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="settings-title">
                  Settings
                </h1>
                <p className="text-gray-400">Configure DockerWakeUp WebUI</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowResetDialog(true)}
                  variant="outline"
                  data-testid="reset-settings-button"
                  className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                >
                  <RotateCcw size={18} className="mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  data-testid="save-settings-button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save size={18} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* System Settings */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">System Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="poll_interval" className="text-white">Poll Interval (seconds)</Label>
                    <Input
                      id="poll_interval"
                      type="number"
                      value={settings.poll_interval}
                      onChange={(e) => handleChange('poll_interval', parseInt(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-white mt-2"
                      data-testid="poll-interval-input"
                    />
                    <p className="text-xs text-gray-400 mt-1">How often to refresh container data</p>
                  </div>
                  <div>
                    <Label htmlFor="ws_update_interval" className="text-white">WebSocket Update Interval (seconds)</Label>
                    <Input
                      id="ws_update_interval"
                      type="number"
                      value={settings.ws_update_interval}
                      onChange={(e) => handleChange('ws_update_interval', parseInt(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-white mt-2"
                    />
                    <p className="text-xs text-gray-400 mt-1">Real-time update frequency</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Auto Refresh</Label>
                    <p className="text-xs text-gray-400 mt-1">Automatically refresh container list</p>
                  </div>
                  <Switch
                    checked={settings.auto_refresh}
                    onCheckedChange={(checked) => handleChange('auto_refresh', checked)}
                    data-testid="auto-refresh-switch"
                  />
                </div>
              </div>
            </div>

            {/* Container Defaults */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Container Defaults</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default_restart_policy" className="text-white">Default Restart Policy</Label>
                    <Select value={settings.default_restart_policy} onValueChange={(value) => handleChange('default_restart_policy', value)}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2" data-testid="restart-policy-select">
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
                    <Label htmlFor="default_network_mode" className="text-white">Default Network Mode</Label>
                    <Select value={settings.default_network_mode} onValueChange={(value) => handleChange('default_network_mode', value)}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="bridge">Bridge</SelectItem>
                        <SelectItem value="host">Host</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="default_idle_timeout" className="text-white">Default Idle Timeout (seconds)</Label>
                  <Input
                    id="default_idle_timeout"
                    type="number"
                    value={settings.default_idle_timeout}
                    onChange={(e) => handleChange('default_idle_timeout', parseInt(e.target.value))}
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">Default idle timeout for new containers</p>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Display Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme" className="text-white">Theme</Label>
                    <Select value={settings.theme} onValueChange={(value) => handleChange('theme', value)}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2" data-testid="theme-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="containers_per_page" className="text-white">Containers Per Page</Label>
                    <Input
                      id="containers_per_page"
                      type="number"
                      value={settings.containers_per_page}
                      onChange={(e) => handleChange('containers_per_page', parseInt(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-white mt-2"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Show Stopped Containers</Label>
                    <p className="text-xs text-gray-400 mt-1">Display stopped containers in the list</p>
                  </div>
                  <Switch
                    checked={settings.show_stopped_containers}
                    onCheckedChange={(checked) => handleChange('show_stopped_containers', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Notifications</Label>
                    <p className="text-xs text-gray-400 mt-1">Show toast notifications for events</p>
                  </div>
                  <Switch
                    checked={settings.enable_notifications}
                    onCheckedChange={(checked) => handleChange('enable_notifications', checked)}
                    data-testid="enable-notifications-switch"
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Notify on Container Stop</Label>
                    <p className="text-xs text-gray-400 mt-1">Show notification when a container stops</p>
                  </div>
                  <Switch
                    checked={settings.notify_on_container_stop}
                    onCheckedChange={(checked) => handleChange('notify_on_container_stop', checked)}
                    disabled={!settings.enable_notifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Notify on Container Start</Label>
                    <p className="text-xs text-gray-400 mt-1">Show notification when a container starts</p>
                  </div>
                  <Switch
                    checked={settings.notify_on_container_start}
                    onCheckedChange={(checked) => handleChange('notify_on_container_start', checked)}
                    disabled={!settings.enable_notifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Notify on Errors</Label>
                    <p className="text-xs text-gray-400 mt-1">Show notification on error events</p>
                  </div>
                  <Switch
                    checked={settings.notify_on_errors}
                    onCheckedChange={(checked) => handleChange('notify_on_errors', checked)}
                    disabled={!settings.enable_notifications}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Advanced Settings</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="docker_socket_path" className="text-white">Docker Socket Path</Label>
                  <Input
                    id="docker_socket_path"
                    value={settings.docker_socket_path}
                    onChange={(e) => handleChange('docker_socket_path', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    data-testid="docker-socket-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Path to Docker socket (requires restart)</p>
                </div>
                <div>
                  <Label htmlFor="log_retention_days" className="text-white">Activity Log Retention (days)</Label>
                  <Input
                    id="log_retention_days"
                    type="number"
                    value={settings.log_retention_days}
                    onChange={(e) => handleChange('log_retention_days', parseInt(e.target.value))}
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">How long to keep activity logs</p>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Auto-Prune</Label>
                    <p className="text-xs text-gray-400 mt-1">Automatically prune unused images</p>
                  </div>
                  <Switch
                    checked={settings.enable_auto_prune}
                    onCheckedChange={(checked) => handleChange('enable_auto_prune', checked)}
                  />
                </div>
                {settings.enable_auto_prune && (
                  <div>
                    <Label htmlFor="auto_prune_schedule" className="text-white">Auto-Prune Schedule</Label>
                    <Select value={settings.auto_prune_schedule} onValueChange={(value) => handleChange('auto_prune_schedule', value)}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-blue-400 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-blue-400 font-semibold mb-1">Important Note</h3>
                <p className="text-blue-300 text-sm">
                  Some settings like Docker socket path require a service restart to take effect. 
                  Other changes are applied immediately upon saving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reset Settings to Defaults</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will reset all settings to their default values. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600" data-testid="cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              data-testid="confirm-reset"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
