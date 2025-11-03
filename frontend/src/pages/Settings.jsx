import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Settings = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131a] to-[#0a0a0f]">
      <Sidebar active="settings" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="settings-title">
              Settings
            </h1>
            <p className="text-gray-400">Configure DockerWakeUp WebUI</p>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
            <SettingsIcon size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Settings Panel</h3>
            <p className="text-gray-400">Configuration options will be available here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
