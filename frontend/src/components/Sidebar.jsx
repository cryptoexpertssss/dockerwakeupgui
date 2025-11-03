import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Image, Activity, Settings, HardDrive, Wifi, Server, TrendingUp, Bell, Bookmark } from 'lucide-react';

const Sidebar = ({ active }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
    { id: 'templates', label: 'Templates', icon: Bookmark, path: '/templates' },
    { id: 'images', label: 'Images', icon: Image, path: '/images' },
    { id: 'volumes', label: 'Volumes', icon: HardDrive, path: '/volumes' },
    { id: 'networks', label: 'Networks', icon: Wifi, path: '/networks' },
    { id: 'system', label: 'System Info', icon: Server, path: '/system' },
    { id: 'logs', label: 'Activity Logs', icon: Activity, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-gray-900/50 backdrop-blur-md border-r border-gray-800 flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white" data-testid="sidebar-logo">DockerWakeUp</h1>
        <p className="text-xs text-gray-400 mt-1">Complete v3.0</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              data-testid={`sidebar-${item.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          Built with FastAPI + React
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
