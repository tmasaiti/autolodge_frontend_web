import React, { useState, useCallback, useEffect } from 'react';
import { searchAlertService } from '../../services/searchAlertService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Mail, 
  Smartphone,
  Clock,
  TrendingUp,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface SearchAlert {
  id: number;
  saved_search_id: number;
  saved_search_name: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  channels: ('email' | 'sms' | 'push')[];
  last_triggered: string | null;
  next_check: string;
  is_active: boolean;
  match_count_since_last: number;
  created_at: string;
}

interface AlertPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_alerts_per_day: number;
}

interface SearchAlertsManagerProps {
  className?: string;
}

export const SearchAlertsManager: React.FC<SearchAlertsManagerProps> = ({
  className = ""
}) => {
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    max_alerts_per_day: 5
  });
  const [loading, setLoading] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SearchAlert | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load alerts and preferences on component mount
  useEffect(() => {
    loadAlerts();
    loadPreferences();
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const alertsData = await searchAlertService.getSearchAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load search alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefsData = await searchAlertService.getAlertPreferences();
      setPreferences(prefsData);
    } catch (error) {
      console.error('Failed to load alert preferences:', error);
    }
  }, []);

  const handleToggleAlert = useCallback(async (alertId: number, isActive: boolean) => {
    try {
      await searchAlertService.updateSearchAlert(alertId, { is_active: isActive });
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_active: isActive } : alert
      ));
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  }, []);

  const handleEditAlert = useCallback((alert: SearchAlert) => {
    setEditingAlert(alert);
    setShowEditModal(true);
  }, []);

  const handleUpdateAlert = useCallback(async (
    alertId: number, 
    updates: Partial<SearchAlert>
  ) => {
    try {
      const updatedAlert = await searchAlertService.updateSearchAlert(alertId, updates);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? updatedAlert : alert
      ));
      setShowEditModal(false);
      setEditingAlert(null);
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  }, []);

  const handleDeleteAlert = useCallback(async (alertId: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await searchAlertService.deleteSearchAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  }, []);

  const handleUpdatePreferences = useCallback(async (newPreferences: AlertPreferences) => {
    try {
      await searchAlertService.updateAlertPreferences(newPreferences);
      setPreferences(newPreferences);
      setShowPreferencesModal(false);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }, []);

  const getFrequencyLabel = (frequency: SearchAlert['frequency']) => {
    switch (frequency) {
      case 'immediate': return 'Immediate';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return frequency;
    }
  };

  const getChannelIcons = (channels: SearchAlert['channels']) => {
    return channels.map(channel => {
      switch (channel) {
        case 'email':
          return <Mail key={channel} className="w-4 h-4" />;
        case 'sms':
          return <Smartphone key={channel} className="w-4 h-4" />;
        case 'push':
          return <Bell key={channel} className="w-4 h-4" />;
        default:
          return null;
      }
    });
  };

  const getAlertStatus = (alert: SearchAlert) => {
    if (!alert.is_active) {
      return { color: 'gray', label: 'Inactive' };
    }
    
    if (alert.match_count_since_last > 0) {
      return { color: 'green', label: `${alert.match_count_since_last} new matches` };
    }
    
    return { color: 'blue', label: 'Active' };
  };

  return (
    <div className={`search-alerts-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Search Alerts</h3>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.filter(a => a.is_active).length} active
            </Badge>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreferencesModal(true)}
          className="flex items-center"
        >
          <Settings className="w-4 h-4 mr-1" />
          Preferences
        </Button>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.is_active).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Matches Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.reduce((sum, alert) => sum + alert.match_count_since_last, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Check</p>
              <p className="text-sm font-medium text-gray-900">
                {alerts.length > 0 ? 
                  new Date(Math.min(...alerts.map(a => new Date(a.next_check).getTime()))).toLocaleString() :
                  'No alerts'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No search alerts</h4>
          <p className="text-gray-500">
            Save a search and enable alerts to get notified when new vehicles match your criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const status = getAlertStatus(alert);
            return (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-gray-900 mr-2">
                        {alert.saved_search_name}
                      </h4>
                      <Badge 
                        variant={status.color as any} 
                        size="sm"
                        className="mr-2"
                      >
                        {status.label}
                      </Badge>
                      {!alert.is_active && (
                        <Badge variant="gray" size="sm">
                          <BellOff className="w-3 h-3 mr-1" />
                          Paused
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="mr-4">{getFrequencyLabel(alert.frequency)}</span>
                      <div className="flex items-center space-x-1 mr-4">
                        {getChannelIcons(alert.channels)}
                      </div>
                      {alert.last_triggered && (
                        <span>Last: {new Date(alert.last_triggered).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Next check: {new Date(alert.next_check).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAlert(alert.id, !alert.is_active)}
                      title={alert.is_active ? "Pause alert" : "Resume alert"}
                    >
                      {alert.is_active ? (
                        <BellOff className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAlert(alert)}
                      title="Edit alert settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      title="Delete alert"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Alert Preferences Modal */}
      <Modal isOpen={showPreferencesModal} onClose={() => setShowPreferencesModal(false)}>
        <Modal.Header>
          <h3 className="text-lg font-semibold">Alert Preferences</h3>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {/* Notification Channels */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Notification Channels</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      email_enabled: e.target.checked
                    }))}
                    className="mr-3"
                  />
                  <Mail className="w-4 h-4 mr-2" />
                  Email notifications
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.sms_enabled}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      sms_enabled: e.target.checked
                    }))}
                    className="mr-3"
                  />
                  <Smartphone className="w-4 h-4 mr-2" />
                  SMS notifications
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.push_enabled}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      push_enabled: e.target.checked
                    }))}
                    className="mr-3"
                  />
                  <Bell className="w-4 h-4 mr-2" />
                  Push notifications
                </label>
              </div>
            </div>

            {/* Quiet Hours */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quiet Hours</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Start</label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quiet_hours_start: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">End</label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quiet_hours_end: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum alerts per day
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={preferences.max_alerts_per_day}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  max_alerts_per_day: parseInt(e.target.value) || 5
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Prevents alert spam by limiting the number of notifications per day
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowPreferencesModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleUpdatePreferences(preferences)}>
            Save Preferences
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Alert Modal */}
      {editingAlert && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <Modal.Header>
            <h3 className="text-lg font-semibold">Edit Alert Settings</h3>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Frequency
                </label>
                <select
                  value={editingAlert.frequency}
                  onChange={(e) => setEditingAlert(prev => prev ? {
                    ...prev,
                    frequency: e.target.value as SearchAlert['frequency']
                  } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Channels
                </label>
                <div className="space-y-2">
                  {(['email', 'sms', 'push'] as const).map(channel => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingAlert.channels.includes(channel)}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...editingAlert.channels, channel]
                            : editingAlert.channels.filter(c => c !== channel);
                          setEditingAlert(prev => prev ? { ...prev, channels } : null);
                        }}
                        className="mr-2"
                      />
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateAlert(editingAlert.id, {
                frequency: editingAlert.frequency,
                channels: editingAlert.channels
              })}
            >
              Update Alert
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};