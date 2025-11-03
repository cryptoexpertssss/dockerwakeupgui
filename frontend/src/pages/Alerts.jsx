import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, AlertTriangle, Info, CheckCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? `${API}/alerts` : `${API}/alerts?acknowledged=${filter === 'acknowledged'}`;
      const response = await axios.get(url);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.post(`${API}/alerts/${alertId}/acknowledge`);
      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return 'bg-red-500';
    if (severity === 'warning') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <AlertTriangle className="text-red-400" size={20} />;
    if (severity === 'warning') return <AlertTriangle className="text-yellow-400" size={20} />;
    return <Info className="text-blue-400" size={20} />;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
      <Sidebar active="alerts" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" data-testid="alerts-title">Alerts & Notifications</h1>
                <p className="text-gray-400">{alerts.length} alerts</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={fetchAlerts} className="bg-blue-600 hover:bg-blue-700" data-testid="refresh-alerts">
                  <RefreshCw size={18} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2">
            {['all', 'unacknowledged', 'acknowledged'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <p className="text-gray-400">No alerts found</p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className={`bg-gray-800/40 backdrop-blur-sm border rounded-lg p-4 transition-all ${
                    alert.acknowledged ? 'border-gray-700 opacity-60' : `border-${getSeverityColor(alert.severity).split('-')[1]}-500/50`
                  }`}
                  data-testid={`alert-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 ${getSeverityColor(alert.severity)}/20 rounded-lg mt-1`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-400">{alert.alert_type.replace('_', ' ')}</span>
                          {alert.container_name && (
                            <span className="text-sm text-blue-400">• {alert.container_name}</span>
                          )}
                        </div>
                        <p className="text-white mb-2">{alert.message}</p>
                        {alert.threshold && (
                          <p className="text-xs text-gray-400">
                            Threshold: {alert.threshold}% | Current: {alert.current_value}%
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        onClick={() => handleAcknowledge(alert.id)}
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-700"
                        data-testid={`ack-alert-${index}`}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
