import React from 'react';
import { Cpu, HardDrive, MemoryStick } from 'lucide-react';

const SystemMetrics = ({ metrics }) => {
  const defaultMetrics = {
    cpu_percent: 0,
    memory_percent: 0,
    memory_used_mb: 0,
    memory_total_mb: 0,
    disk_percent: 0,
    disk_used_gb: 0,
    disk_total_gb: 0
  };

  const data = metrics || defaultMetrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="system-metrics">
      {/* CPU */}
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm border border-blue-700/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Cpu size={24} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold">CPU Usage</h3>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-3xl font-bold text-white" data-testid="cpu-percent">{data.cpu_percent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${data.cpu_percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Memory */}
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm border border-purple-700/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MemoryStick size={24} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold">Memory</h3>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-3xl font-bold text-white" data-testid="memory-percent">{data.memory_percent}%</span>
            <span className="text-gray-400 text-sm" data-testid="memory-used">{data.memory_used_mb} / {data.memory_total_mb} MB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${data.memory_percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Disk */}
      <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm border border-green-700/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <HardDrive size={24} className="text-green-400" />
            </div>
            <h3 className="text-white font-semibold">Disk</h3>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-3xl font-bold text-white" data-testid="disk-percent">{data.disk_percent}%</span>
            <span className="text-gray-400 text-sm" data-testid="disk-used">{data.disk_used_gb} / {data.disk_total_gb} GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${data.disk_percent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;
