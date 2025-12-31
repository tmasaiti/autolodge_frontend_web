/**
 * Permit Management Page
 * Comprehensive dashboard for managing cross-border permits
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  MapPin,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { CrossBorderPermitManagement } from '../components/booking/CrossBorderPermitManagement';
import { usePermitManagement } from '../hooks/usePermitManagement';
import { SADCCountryCode } from '../schemas/common-schemas';

const COUNTRY_NAMES: Record<SADCCountryCode, string> = {
  'AO': 'Angola',
  'BW': 'Botswana',
  'CD': 'Democratic Republic of Congo',
  'SZ': 'Eswatini',
  'LS': 'Lesotho',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MU': 'Mauritius',
  'MZ': 'Mozambique',
  'NA': 'Namibia',
  'SC': 'Seychelles',
  'ZA': 'South Africa',
  'TZ': 'Tanzania',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};

export const PermitManagementPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'dashboard' | 'permits' | 'notifications'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState<SADCCountryCode | ''>('');

  const {
    permits,
    permitRequirements,
    statistics,
    notifications,
    loading,
    error,
    refreshing,
    activePermits,
    expiredPermits,
    draftApplications,
    expiringPermits,
    unreadNotifications,
    highPriorityNotifications,
    loadPermits,
    loadPermitRequirements,
    refreshData,
    submitApplication,
    renewPermit,
    cancelPermit,
    refreshPermitStatus,
    uploadDocument,
    viewDocument,
    markNotificationRead
  } = usePermitManagement({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  // Load permit requirements for SADC countries on mount
  useEffect(() => {
    const loadInitialRequirements = async () => {
      try {
        // Load requirements for common routes (example: from South Africa to other SADC countries)
        await loadPermitRequirements('ZA', ['BW', 'NA', 'ZM', 'ZW', 'MZ']);
      } catch (err) {
        console.error('Failed to load initial permit requirements:', err);
      }
    };

    loadInitialRequirements();
  }, [loadPermitRequirements]);

  // Filter permits based on search and filters
  const filteredPermits = permits.filter(permit => {
    const matchesSearch = !searchQuery || 
      permit.permit_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      COUNTRY_NAMES[permit.from_country].toLowerCase().includes(searchQuery.toLowerCase()) ||
      COUNTRY_NAMES[permit.to_country].toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(permit.status);
    
    const matchesCountry = !filterCountry || 
      permit.from_country === filterCountry || 
      permit.to_country === filterCountry;

    return matchesSearch && matchesStatus && matchesCountry;
  });

  // Render dashboard overview
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Active Permits</p>
              <p className="text-2xl font-bold text-neutral-900">
                {statistics?.active_permits || activePermits.length}
              </p>
              <p className="text-xs text-green-600">
                {statistics?.success_rate ? `${statistics.success_rate}% success rate` : ''}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Processing</p>
              <p className="text-2xl font-bold text-neutral-900">
                {statistics?.processing_permits || permits.filter(p => p.status === 'processing').length}
              </p>
              <p className="text-xs text-blue-600">
                {statistics?.average_processing_days ? `${statistics.average_processing_days} avg days` : ''}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-neutral-900">
                {statistics?.expiring_soon || expiringPermits.length}
              </p>
              <p className="text-xs text-orange-600">Within 30 days</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Fees Paid</p>
              <p className="text-2xl font-bold text-neutral-900">
                {statistics ? `${statistics.total_fees_paid} ${statistics.currency}` : '$0'}
              </p>
              <p className="text-xs text-purple-600">All time</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => setSelectedView('permits')}
            className="flex items-center justify-center space-x-2 h-12"
          >
            <FileText className="h-5 w-5" />
            <span>New Permit Application</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => refreshData()}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2 h-12"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setSelectedView('notifications')}
            className="flex items-center justify-center space-x-2 h-12"
          >
            <Bell className="h-5 w-5" />
            <span>View Notifications</span>
            {unreadNotifications.length > 0 && (
              <Badge variant="error" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Permits */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Recent Permits</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedView('permits')}
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {permits.slice(0, 5).map(permit => (
              <div
                key={permit.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-neutral-600" />
                  <div>
                    <p className="font-medium text-sm">
                      {COUNTRY_NAMES[permit.from_country]} → {COUNTRY_NAMES[permit.to_country]}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {permit.permit_number || 'Application in progress'}
                    </p>
                  </div>
                </div>
                
                <Badge
                  variant={
                    permit.status === 'issued' ? 'success' :
                    permit.status === 'processing' ? 'default' :
                    permit.status === 'expired' ? 'warning' :
                    'error'
                  }
                >
                  {permit.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
            
            {permits.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">No permits yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedView('notifications')}
            >
              View All
              {unreadNotifications.length > 0 && (
                <Badge variant="error" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors
                  ${notification.read ? 'bg-neutral-50' : 'bg-blue-50 border border-blue-200'}
                `}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <Bell className={`
                    h-4 w-4 mt-0.5
                    ${notification.priority === 'urgent' ? 'text-red-600' :
                      notification.priority === 'high' ? 'text-orange-600' :
                      'text-blue-600'
                    }
                  `} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
              </div>
            ))}
            
            {notifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">No notifications</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // Render notifications view
  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Notifications</h2>
          <p className="text-neutral-600">
            Stay updated on your permit applications and renewals
          </p>
        </div>
        
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              unreadNotifications.forEach(n => markNotificationRead(n.id));
            }}
          >
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map(notification => (
          <Card
            key={notification.id}
            className={`
              p-6 cursor-pointer transition-all
              ${notification.read ? 'opacity-75' : 'border-blue-200 bg-blue-50'}
            `}
            onClick={() => markNotificationRead(notification.id)}
          >
            <div className="flex items-start space-x-4">
              <div className={`
                p-2 rounded-lg
                ${notification.priority === 'urgent' ? 'bg-red-100' :
                  notification.priority === 'high' ? 'bg-orange-100' :
                  'bg-blue-100'
                }
              `}>
                <Bell className={`
                  h-5 w-5
                  ${notification.priority === 'urgent' ? 'text-red-600' :
                    notification.priority === 'high' ? 'text-orange-600' :
                    'text-blue-600'
                  }
                `} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-neutral-900">
                    {notification.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        notification.priority === 'urgent' ? 'error' :
                        notification.priority === 'high' ? 'warning' :
                        'default'
                      }
                    >
                      {notification.priority}
                    </Badge>
                    
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </div>
                
                <p className="text-neutral-700 mb-3">{notification.message}</p>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                  
                  {notification.action_required && notification.action_url && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(notification.action_url, '_blank');
                      }}
                    >
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {notifications.length === 0 && (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No Notifications
            </h3>
            <p className="text-neutral-600">
              You're all caught up! Notifications about your permits will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );

  if (loading && permits.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">Loading permit data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Failed to Load Permit Data
            </h2>
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button onClick={() => refreshData()}>
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Permit Management
              </h1>
              <p className="text-neutral-600 mt-2">
                Manage your cross-border travel permits and applications
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {highPriorityNotifications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedView('notifications')}
                  className="flex items-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>{highPriorityNotifications.length} Urgent</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => refreshData()}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                { key: 'permits', label: 'Permits', icon: FileText, count: permits.length },
                { key: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotifications.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedView(tab.key as any)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${selectedView === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }
                  `}
                >
                  {React.createElement(tab.icon, { className: "h-4 w-4" })}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge
                      variant={selectedView === tab.key ? 'default' : 'secondary'}
                      className="ml-1"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {selectedView === 'dashboard' && renderDashboard()}
        
        {selectedView === 'permits' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search permits by number, country, or tracking ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value as SADCCountryCode | '')}
                  className="px-3 py-2 border border-neutral-300 rounded-md"
                >
                  <option value="">All Countries</option>
                  {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
                
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </Card>

            {/* Permit Management Component */}
            <CrossBorderPermitManagement
              permits={filteredPermits}
              permitRequirements={permitRequirements}
              onPermitApplication={submitApplication}
              onPermitRenewal={renewPermit}
              onPermitCancellation={cancelPermit}
              onDocumentUpload={uploadDocument}
              onStatusRefresh={refreshPermitStatus}
              onViewDocument={viewDocument}
            />
          </div>
        )}
        
        {selectedView === 'notifications' && renderNotifications()}
      </div>
    </div>
  );
};