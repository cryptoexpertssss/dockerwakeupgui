import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('1');
  const [systemMetrics, setSystemMetrics] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [containerStats, setContainerStats] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
    fetchSystemMetrics();
  }, [timeRange]);

  useEffect(() => {
    if (selectedContainer) {
      fetchContainerStats();
    }
  }, [selectedContainer, timeRange]);

  const fetchContainers = async () => {
    try {
      const response = await axios.get(`${API}/containers`);
      setContainers(response.data.containers || []);
      if (response.data.containers?.length > 0 && !selectedContainer) {
        setSelectedContainer(response.data.containers[0].name);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/system/metrics/history?hours=${timeRange}`);
      setSystemMetrics(response.data.metrics || []);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContainerStats = async () => {
    try {
      const response = await axios.get(`${API}/container/${selectedContainer}/stats/history?hours=${timeRange}`);
      setContainerStats(response.data.stats || []);
    } catch (error) {
      console.error('Error fetching container stats:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
      <Sidebar active="analytics" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="analytics-title">Analytics & Charts</h1>
                <p className="text-gray-400">Historical performance data and trends</p>
              </div>
              <div className="flex gap-2">
                {['1', '6', '24'].map(hours => (
                  <button
                    key={hours}
                    onClick={() => setTimeRange(hours)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      timeRange === hours
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* System Metrics Charts */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={24} />
              System Metrics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPU Chart */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">CPU Usage Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={systemMetrics.map(m => ({...m, time: formatTimestamp(m.timestamp)}))}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Area type="monotone" dataKey="cpu_percent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Memory Chart */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Memory Usage Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={systemMetrics.map(m => ({...m, time: formatTimestamp(m.timestamp)}))}>
                    <defs>
                      <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Area type="monotone" dataKey="memory_percent" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMemory)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Container Stats */}
          {selectedContainer && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="text-purple-400" size={24} />
                Container: {selectedContainer}
              </h2>
              
              <div className="mb-4">
                <select
                  value={selectedContainer}
                  onChange={(e) => setSelectedContainer(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  {containers.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Resource Usage Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={containerStats.map(s => ({...s, time: formatTimestamp(s.timestamp)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Line type="monotone" dataKey="cpu_percent" stroke="#3b82f6" name="CPU %" strokeWidth={2} />
                    <Line type="monotone" dataKey="memory_percent" stroke="#8b5cf6" name="Memory %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
