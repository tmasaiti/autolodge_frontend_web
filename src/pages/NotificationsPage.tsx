import React, { useState } from 'react';
import { Bell, Settings, BarChart3 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { NotificationList } from '../components/notifications/NotificationList';
import { NotificationPreferencesComponent } from '../components/notifications/NotificationPreferences';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type TabType = 'notifications' | 'preferences' | 'analytics';

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const { stats, isRealTimeConnected } = useSelector((state: RootState) => state.notifications);

  const tabs = [
    {
      id: 'notifications' as TabType,
      label: 'Notifications',
      icon: Bell,
      description: 'View and manage your notifications',
    },
    {
      id: 'preferences' as TabType,
      label: 'Preferences',
      icon: Settings,
      description: 'Configure notification settings',
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart3,
      description: 'View notification statistics',
    },
  ];

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Notification Analytics</h2>
        <p className="text-neutral-600">Overview of your notification activity</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Notifications */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Notifications</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.total_count}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Unread Count */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Unread</p>
                <p className="text-3xl font-bold text-orange-600">{stats.unread_count}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          {/* Connection Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Real-time Status</p>
                <p className={`text-sm font-semibold ${isRealTimeConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isRealTimeConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isRealTimeConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`h-3 w-3 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          </Card>

          {/* Most Common Type */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Most Common</p>
                <p className="text-sm font-semibold text-neutral-900 capitalize">
                  {Object.entries(stats.by_type).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Analytics Available</h3>
          <p className="text-neutral-600">Analytics will appear once you have notifications</p>
        </Card>
      )}

      {/* Breakdown Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Type */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">By Type</h3>
            <div className="space-y-3">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 capitalize">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.total_count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* By Priority */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">By Priority</h3>
            <div className="space-y-3">
              {Object.entries(stats.by_priority).map(([priority, count]) => {
                const colors = {
                  urgent: 'bg-red-600',
                  high: 'bg-orange-600',
                  medium: 'bg-blue-600',
                  low: 'bg-neutral-600',
                };
                
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 capitalize">{priority}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-neutral-200 rounded-full h-2">
                        <div 
                          className={`${colors[priority as keyof typeof colors]} h-2 rounded-full`}
                          style={{ width: `${(count / stats.total_count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-neutral-900">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Notification Center</h1>
          <p className="text-neutral-600 mt-2">
            Manage your notifications and communication preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                      }
                    `}
                  >
                    <Icon className={`
                      -ml-0.5 mr-2 h-5 w-5 transition-colors
                      ${isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'}
                    `} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'notifications' && (
            <NotificationList showFilters={true} showActions={true} />
          )}
          
          {activeTab === 'preferences' && (
            <NotificationPreferencesComponent />
          )}
          
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};