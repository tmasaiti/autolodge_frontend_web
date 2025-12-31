import React from 'react';
import { 
  Bell, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Tag,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Notification } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
  showActions?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  compact = false,
  showActions = false,
  onArchive,
  onDelete,
}) => {
  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${
      priority === 'urgent' ? 'text-red-600' :
      priority === 'high' ? 'text-orange-600' :
      priority === 'medium' ? 'text-blue-600' :
      'text-neutral-500'
    }`;

    switch (type) {
      case 'booking':
        return <Bell className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'document':
        return <FileText className={iconClass} />;
      case 'dispute':
        return <AlertTriangle className={iconClass} />;
      case 'system':
        return <Settings className={iconClass} />;
      case 'marketing':
        return <Tag className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-neutral-300 bg-neutral-50';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    
    // Navigate to action URL if available
    if (notification.metadata?.action_url) {
      window.location.href = notification.metadata.action_url;
    }
  };

  return (
    <div
      className={`
        relative border-l-4 transition-all duration-200 cursor-pointer
        ${notification.status === 'unread' 
          ? `${getPriorityColor(notification.priority)} hover:bg-opacity-80` 
          : 'border-l-neutral-200 bg-white hover:bg-neutral-50'
        }
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                notification.status === 'unread' ? 'text-neutral-900' : 'text-neutral-700'
              }`}>
                {notification.title}
              </p>
              
              <p className={`mt-1 text-sm ${
                notification.status === 'unread' ? 'text-neutral-700' : 'text-neutral-600'
              } ${compact ? 'line-clamp-2' : ''}`}>
                {notification.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1 text-xs text-neutral-500">
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo}</span>
                </div>

                {notification.metadata?.action_url && (
                  <div className="flex items-center space-x-1 text-xs text-primary-600">
                    <ExternalLink className="h-3 w-3" />
                    <span>Action required</span>
                  </div>
                )}

                {/* Priority Badge */}
                {notification.priority === 'urgent' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Urgent
                  </span>
                )}
                
                {notification.priority === 'high' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    High
                  </span>
                )}
              </div>
            </div>

            {/* Unread Indicator */}
            {notification.status === 'unread' && (
              <div className="flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && !compact && (
            <div className="flex items-center space-x-2 mt-3">
              {onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100"
                >
                  Archive
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expiry Warning */}
      {notification.expires_at && new Date(notification.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          Expires {formatDistanceToNow(new Date(notification.expires_at), { addSuffix: true })}
        </div>
      )}
    </div>
  );
};