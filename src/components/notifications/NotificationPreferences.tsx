import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Monitor,
  Bell,
  CreditCard,
  FileText,
  AlertTriangle,
  Settings,
  Tag,
  Save,
  TestTube
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store/store';
import { 
  fetchNotificationPreferences, 
  updateNotificationPreferences 
} from '../../store/slices/notificationSlice';
import { notificationService, NotificationPreferences } from '../../services/notificationService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const NotificationPreferencesComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { preferences, loading } = useSelector((state: RootState) => state.notifications);
  
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (!preferences) {
      dispatch(fetchNotificationPreferences());
    } else {
      setLocalPreferences(preferences);
    }
  }, [dispatch, preferences]);

  const handlePreferenceChange = (
    channel: keyof NotificationPreferences,
    setting: string,
    value: boolean
  ) => {
    if (!localPreferences) return;

    setLocalPreferences({
      ...localPreferences,
      [channel]: {
        ...localPreferences[channel],
        [setting]: value,
      },
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    setSaving(true);
    try {
      await dispatch(updateNotificationPreferences(localPreferences)).unwrap();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel: 'email' | 'sms' | 'push') => {
    setTesting(channel);
    try {
      await notificationService.testNotification(channel);
      // Show success message
    } catch (error) {
      console.error('Test notification failed:', error);
    } finally {
      setTesting(null);
    }
  };

  if (loading || !localPreferences) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const notificationTypes = [
    { key: 'booking_updates', label: 'Booking Updates', icon: Bell, description: 'Status changes, confirmations, and reminders' },
    { key: 'payment_notifications', label: 'Payment Notifications', icon: CreditCard, description: 'Payment confirmations, failures, and refunds' },
    { key: 'document_reminders', label: 'Document Reminders', icon: FileText, description: 'KYC requirements and document expiry alerts' },
    { key: 'dispute_updates', label: 'Dispute Updates', icon: AlertTriangle, description: 'Dispute status changes and resolution updates' },
    { key: 'marketing', label: 'Marketing & Promotions', icon: Tag, description: 'Special offers, new features, and newsletters' },
  ];

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Email Notifications</h3>
            <p className="text-sm text-neutral-600">Receive updates via email</p>
          </div>
          <div className="flex-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTest('email')}
            disabled={testing === 'email'}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{testing === 'email' ? 'Sending...' : 'Test'}</span>
          </Button>
        </div>

        <div className="space-y-4">
          {notificationTypes.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">{label}</p>
                  <p className="text-sm text-neutral-600">{description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.email[key as keyof typeof localPreferences.email] || false}
                  onChange={(e) => handlePreferenceChange('email', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* SMS Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">SMS Notifications</h3>
            <p className="text-sm text-neutral-600">Receive text messages for important updates</p>
          </div>
          <div className="flex-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTest('sms')}
            disabled={testing === 'sms'}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{testing === 'sms' ? 'Sending...' : 'Test'}</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Urgent Only</p>
                <p className="text-sm text-neutral-600">Only send SMS for urgent notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.sms.urgent_only}
                onChange={(e) => handlePreferenceChange('sms', 'urgent_only', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Booking Confirmations</p>
                <p className="text-sm text-neutral-600">SMS confirmation when bookings are confirmed</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.sms.booking_confirmations}
                onChange={(e) => handlePreferenceChange('sms', 'booking_confirmations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Payment Issues</p>
                <p className="text-sm text-neutral-600">SMS alerts for payment failures or issues</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.sms.payment_issues}
                onChange={(e) => handlePreferenceChange('sms', 'payment_issues', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Push Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Smartphone className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Push Notifications</h3>
            <p className="text-sm text-neutral-600">Browser and mobile app notifications</p>
          </div>
          <div className="flex-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTest('push')}
            disabled={testing === 'push'}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{testing === 'push' ? 'Sending...' : 'Test'}</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Real-time Updates</p>
                <p className="text-sm text-neutral-600">Instant notifications for important events</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.push.real_time_updates}
                onChange={(e) => handlePreferenceChange('push', 'real_time_updates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Booking Reminders</p>
                <p className="text-sm text-neutral-600">Reminders before pickup and return</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.push.booking_reminders}
                onChange={(e) => handlePreferenceChange('push', 'booking_reminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Tag className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Promotional</p>
                <p className="text-sm text-neutral-600">Special offers and feature announcements</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.push.promotional}
                onChange={(e) => handlePreferenceChange('push', 'promotional', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* In-App Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Monitor className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">In-App Notifications</h3>
            <p className="text-sm text-neutral-600">Notifications within the application</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">All Notifications</p>
                <p className="text-sm text-neutral-600">Show all notifications in the app</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.in_app.all_notifications}
                onChange={(e) => handlePreferenceChange('in_app', 'all_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Sound Enabled</p>
                <p className="text-sm text-neutral-600">Play sound for new notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.in_app.sound_enabled}
                onChange={(e) => handlePreferenceChange('in_app', 'sound_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Desktop Notifications</p>
                <p className="text-sm text-neutral-600">Show browser notifications on desktop</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.in_app.desktop_notifications}
                onChange={(e) => handlePreferenceChange('in_app', 'desktop_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </Button>
      </div>
    </div>
  );
};