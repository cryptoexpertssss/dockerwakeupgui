import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, TrendingUp, Bell, Bookmark, Box, Image, HardDrive, Wifi, Server } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const commands = [
    { id: 'dashboard', label: 'Dashboard', path: '/', category: 'Navigation', icon: Box },
    { id: 'analytics', label: 'Analytics & Charts', path: '/analytics', category: 'Navigation', icon: TrendingUp },
    { id: 'alerts', label: 'Alerts & Notifications', path: '/alerts', category: 'Navigation', icon: Bell },
    { id: 'templates', label: 'Container Templates', path: '/templates', category: 'Navigation', icon: Bookmark },
    { id: 'images', label: 'Docker Images', path: '/images', category: 'Navigation', icon: Image },
    { id: 'volumes', label: 'Docker Volumes', path: '/volumes', category: 'Navigation', icon: HardDrive },
    { id: 'networks', label: 'Docker Networks', path: '/networks', category: 'Navigation', icon: Wifi },
    { id: 'system', label: 'System Information', path: '/system', category: 'Navigation', icon: Server },
    { id: 'logs', label: 'Activity Logs', path: '/logs', category: 'Navigation', icon: Box },
    { id: 'settings', label: 'Settings', path: '/settings', category: 'Navigation', icon: Box },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (command) => {
    navigate(command.path);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-gray-700 p-0 max-w-2xl" data-testid="command-palette">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
            data-testid="command-search-input"
            autoFocus
          />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Ctrl</kbd>
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">K</kbd>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No commands found</div>
          ) : (
            filteredCommands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => handleSelect(command)}
                  data-testid={`command-${command.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-left transition-colors"
                >
                  <Icon size={18} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-white font-medium">{command.label}</div>
                    <div className="text-xs text-gray-400">{command.category}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
