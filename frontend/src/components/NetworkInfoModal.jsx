import React from 'react';
import { X, Network, Globe, Wifi, Server } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const NetworkInfoModal = ({ container, onClose }) => {
  if (!container) return null;

  const { networks_detailed, ports_detailed, hostname, domainname, ip_address, gateway, mac_address, network_mode, is_npm } = container;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-gray-900 border-gray-700 text-white overflow-y-auto" data-testid="network-info-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                <Network className="text-blue-400" size={24} />
                Network Details: {container.name}
              </DialogTitle>
              {is_npm && (
                <Badge className="mt-2 bg-green-600 text-white">
                  <Server size={14} className="mr-1" />
                  Nginx Proxy Manager Detected
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              data-testid="close-network-modal"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Network Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Globe size={20} className="text-blue-400" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Hostname</label>
                <p className="text-white font-mono text-sm mt-1">{hostname}</p>
              </div>
              {domainname && (
                <div>
                  <label className="text-sm text-gray-400">Domain Name</label>
                  <p className="text-white font-mono text-sm mt-1">{domainname}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400">Network Mode</label>
                <p className="text-white font-mono text-sm mt-1">
                  <Badge variant="outline" className="border-blue-500 text-blue-300">{network_mode}</Badge>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">MAC Address</label>
                <p className="text-white font-mono text-sm mt-1">{mac_address || 'N/A'}</p>
              </div>
              {ip_address && ip_address !== 'N/A' && (
                <div>
                  <label className="text-sm text-gray-400">Primary IP Address</label>
                  <p className="text-white font-mono text-sm mt-1">{ip_address}</p>
                </div>
              )}
              {gateway && gateway !== 'N/A' && (
                <div>
                  <label className="text-sm text-gray-400">Gateway</label>
                  <p className="text-white font-mono text-sm mt-1">{gateway}</p>
                </div>
              )}
            </div>
          </div>

          {/* Networks */}
          {networks_detailed && Object.keys(networks_detailed).length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Wifi size={20} className="text-purple-400" />
                Connected Networks ({Object.keys(networks_detailed).length})
              </h3>
              <div className="space-y-4">
                {Object.entries(networks_detailed).map(([networkName, networkInfo], index) => (
                  <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-300">{networkName}</h4>
                      <Badge className="bg-purple-600">{networkInfo.network_id}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <label className="text-gray-400">IP Address</label>
                        <p className="text-white font-mono mt-1">{networkInfo.ip_address}</p>
                      </div>
                      <div>
                        <label className="text-gray-400">Gateway</label>
                        <p className="text-white font-mono mt-1">{networkInfo.gateway}</p>
                      </div>
                      <div>
                        <label className="text-gray-400">Subnet</label>
                        <p className="text-white font-mono mt-1">{networkInfo.subnet}</p>
                      </div>
                      <div>
                        <label className="text-gray-400">MAC Address</label>
                        <p className="text-white font-mono mt-1">{networkInfo.mac_address}</p>
                      </div>
                      <div>
                        <label className="text-gray-400">Prefix Length</label>
                        <p className="text-white font-mono mt-1">/{networkInfo.ip_prefix_len}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Port Mappings */}
          {ports_detailed && ports_detailed.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Server size={20} className="text-green-400" />
                Port Mappings ({ports_detailed.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">Host IP</th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">Host Port</th>
                      <th className="px-4 py-2 text-center text-gray-400 font-medium">→</th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">Container Port</th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">Protocol</th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">Full Mapping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {ports_detailed.map((port, index) => (
                      <tr key={index} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-white font-mono">{port.host_ip || 'N/A'}</td>
                        <td className="px-4 py-3 text-white font-mono">{port.host_port || '-'}</td>
                        <td className="px-4 py-3 text-center text-gray-500">→</td>
                        <td className="px-4 py-3 text-white font-mono">{port.container_port}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={port.protocol === 'TCP' ? 'border-blue-500 text-blue-300' : 'border-purple-500 text-purple-300'}>
                            {port.protocol}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">{port.mapping}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NPM Integration Info */}
          {is_npm && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2">
                <Server size={20} />
                Nginx Proxy Manager Integration
              </h3>
              <p className="text-green-300 text-sm mb-3">
                This container is identified as Nginx Proxy Manager. It can be used to manage reverse proxy configurations for other containers.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span className="text-gray-300">NPM typically runs on ports 80 (HTTP), 443 (HTTPS), and 81 (Admin Interface)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span className="text-gray-300">Use NPM to create proxy hosts that route traffic to other containers via their network IPs</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span className="text-gray-300">All containers on the same network can be accessed by NPM using their internal IPs</span>
                </div>
              </div>
            </div>
          )}

          {/* Network Compatibility Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">Network Communication</h3>
            <p className="text-blue-300 text-sm">
              Containers on the same network can communicate using their internal IP addresses or container names. 
              For Nginx Proxy Manager integration, use the internal IPs shown above in your proxy host configurations.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkInfoModal;
