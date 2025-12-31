import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Filter, 
  MoreVertical, 
  CheckCheck, 
  Archive, 
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store/store';
import { 
  fetchNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification,
  deleteNotification,
  clearNotifications
} from '../../store/slices/notificationSlice';
import { NotificationItem } from './NotificationItem';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface NotificationListProps {
  showFilters?: boolean;
  showActions?: boolean;
  limit?: number;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  showFilters = true,
  showActions = true,
  limit,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading, hasMore, unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );

  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'unread' | 'read' | 'archived',
    type: 'all' as 'all' | 'booking' | 'payment' | 'document' | 'dispute' | 'system' | 'marketing',
    priority: 'all' as 'all' | 'urgent' | 'high' | 'medium' | 'low',
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = () => {
    const params: any = { limit: limit || 20, offset: 0 };
    
    if (filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.type !== 'all') {
      params.type = filters.type;
    }
    if (filters.priority !== 'all') {
      params.priority = filters.priority;
    }

    dispatch(clearNotifications());
    dispatch(fetchNotifications(params));
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const params: any = { 
        limit: limit || 20, 
        offset: notifications.length 
      };
      
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.type !== 'all') {
        params.type = filters.type;
      }
      if (filters.priority !== 'all') {
        params.priority = filters.priority;
      }

      dispatch(fetchNotifications(params));
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleArchive = (notificationId: string) => {
    dispatch(archiveNotification(notificationId));
  };

  const handleDelete = (notificationId: string) => {
    dispatch(deleteNotification(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Notifications</h2>
          <p className="text-neutral-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="document">Document</option>
              <option value="dispute">Dispute</option>
              <option value="system">System</option>
              <option value="marketing">Marketing</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showActions && selectedNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedNotifications.forEach(id => dispatch(markNotificationAsRead(id)));
                  setSelectedNotifications([]);
                }}
                className="flex items-center space-x-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark Read</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedNotifications.forEach(id => dispatch(archiveNotification(id)));
                  setSelectedNotifications([]);
                }}
                className="flex items-center space-x-2"
              >
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedNotifications.forEach(id => dispatch(deleteNotification(id)));
                  setSelectedNotifications([]);
                }}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {showActions && (
              <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <span className="text-sm text-neutral-700">Select all</span>
                </label>
              </div>
            )}
            
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="relative">
                {showActions && (
                  <div className="absolute left-4 top-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                  </div>
                )}
                
                <div className={showActions ? 'ml-8' : ''}>
                  <NotificationItem
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.id)}
                    showActions={showActions}
                    onArchive={() => handleArchive(notification.id)}
                    onDelete={() => handleDelete(notification.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-neutral-400 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No notifications found</h3>
            <p className="text-neutral-600">
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'You\'re all caught up! New notifications will appear here.'
              }
            </p>
          </div>
        )}

        {/* Load More */}
        {hasMore && filteredNotifications.length > 0 && (
          <div className="p-4 border-t border-neutral-200 text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="flex items-center space-x-2 mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};