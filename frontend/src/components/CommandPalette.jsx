import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, X } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const commands = [
    { id: 'dashboard', label: 'Dashboard', path: '/', category: 'Navigation', icon: 'LayoutDashboard' },
    { id: 'images', label: 'Images', path: '/images', category: 'Navigation', icon: 'Image' },
    { id: 'volumes', label: 'Volumes', path: '/volumes', category: 'Navigation', icon: 'HardDrive' },
    { id: 'networks', label: 'Networks', path: '/networks', category: 'Navigation', icon: 'Wifi' },
    { id: 'system', label: 'System Info', path: '/system', category: 'Navigation', icon: 'Server' },
    { id: 'logs', label: 'Activity Logs', path: '/logs', category: 'Navigation', icon: 'Activity' },
    { id: 'settings', label: 'Settings', path: '/settings', category: 'Navigation', icon: 'Settings' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
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
            className="flex-1 bg-transparent text-white outline-none"
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
            filteredCommands.map((command) => (
              <button
                key={command.id}
                onClick={() => handleSelect(command)}
                data-testid={`command-${command.id}`}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-left transition-colors"
              >
                <div className="text-gray-400">{command.icon}</div>
                <div className="flex-1">
                  <div className="text-white font-medium">{command.label}</div>
                  <div className="text-xs text-gray-400">{command.category}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
