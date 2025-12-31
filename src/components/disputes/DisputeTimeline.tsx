import React from 'react';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  MessageSquare, 
  Gavel,
  TrendingUp,
  User,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { DisputeStatus } from '../../schemas/dispute-schemas';

export interface DisputeTimelineEvent {
  id: number;
  disputeId: number;
  eventType: string;
  eventData: any;
  performedBy?: {
    id: number;
    name: string;
    type: 'renter' | 'operator' | 'admin';
  };
  createdAt: string;
}

export interface DisputeTimelineProps {
  events: DisputeTimelineEvent[];
  currentStatus: DisputeStatus;
  className?: string;
}

const eventTypeConfig = {
  dispute_created: {
    icon: AlertCircle,
    label: 'Dispute Created',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  },
  evidence_submitted: {
    icon: FileText,
    label: 'Evidence Submitted',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  comment_added: {
    icon: MessageSquare,
    label: 'Comment Added',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  },
  status_changed: {
    icon: TrendingUp,
    label: 'Status Updated',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  admin_review_started: {
    icon: Shield,
    label: 'Admin Review Started',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100'
  },
  resolution_proposed: {
    icon: Gavel,
    label: 'Resolution Proposed',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100'
  },
  dispute_resolved: {
    icon: CheckCircle,
    label: 'Dispute Resolved',
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  dispute_escalated: {
    icon: TrendingUp,
    label: 'Dispute Escalated',
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  },
  dispute_closed: {
    icon: XCircle,
    label: 'Dispute Closed',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  }
};

const statusConfig = {
  [DisputeStatus.OPEN]: {
    label: 'Open',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  [DisputeStatus.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  [DisputeStatus.AWAITING_EVIDENCE]: {
    label: 'Awaiting Evidence',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  [DisputeStatus.RESOLVED]: {
    label: 'Resolved',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  [DisputeStatus.CLOSED]: {
    label: 'Closed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
};

const formatEventDescription = (event: DisputeTimelineEvent): string => {
  const { eventType, eventData, performedBy } = event;
  const performerName = performedBy?.name || 'System';
  
  switch (eventType) {
    case 'dispute_created':
      return `${performerName} created this dispute regarding ${eventData.type}`;
    
    case 'evidence_submitted':
      return `${performerName} submitted ${eventData.evidenceType} evidence: "${eventData.title}"`;
    
    case 'comment_added':
      return `${performerName} added a comment`;
    
    case 'status_changed':
      return `Status changed from ${eventData.fromStatus} to ${eventData.toStatus}`;
    
    case 'admin_review_started':
      return `Admin ${performerName} started reviewing this dispute`;
    
    case 'resolution_proposed':
      return `${performerName} proposed resolution: ${eventData.resolution}`;
    
    case 'dispute_resolved':
      return `Dispute resolved with ${eventData.resolution}${eventData.amount ? ` (${eventData.currency} ${eventData.amount})` : ''}`;
    
    case 'dispute_escalated':
      return `Dispute escalated to senior admin. Reason: ${eventData.reason}`;
    
    case 'dispute_closed':
      return `Dispute closed by ${performerName}`;
    
    default:
      return `${eventType.replace(/_/g, ' ')} by ${performerName}`;
  }
};

const getUserTypeIcon = (userType: 'renter' | 'operator' | 'admin') => {
  switch (userType) {
    case 'renter':
      return User;
    case 'operator':
      return User;
    case 'admin':
      return Shield;
    default:
      return User;
  }
};

export const DisputeTimeline: React.FC<DisputeTimelineProps> = ({
  events,
  currentStatus,
  className
}) => {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'p-2 rounded-full',
            statusConfig[currentStatus]?.bgColor || 'bg-gray-100'
          )}>
            <Clock className={cn(
              'h-5 w-5',
              statusConfig[currentStatus]?.color || 'text-gray-500'
            )} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Current Status</h3>
            <p className={cn(
              'text-sm font-medium',
              statusConfig[currentStatus]?.color || 'text-gray-500'
            )}>
              {statusConfig[currentStatus]?.label || currentStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Timeline</h4>
        
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No timeline events yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            {sortedEvents.map((event, index) => {
              const config = eventTypeConfig[event.eventType as keyof typeof eventTypeConfig] || {
                icon: Clock,
                label: event.eventType,
                color: 'text-gray-500',
                bgColor: 'bg-gray-100'
              };
              
              const Icon = config.icon;
              const UserIcon = event.performedBy ? getUserTypeIcon(event.performedBy.type) : User;
              
              return (
                <div key={event.id} className="relative flex items-start space-x-4 pb-4">
                  {/* Timeline dot */}
                  <div className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="text-sm font-medium text-gray-900">
                              {config.label}
                            </h5>
                            {event.performedBy && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <UserIcon className="h-3 w-3" />
                                <span>{event.performedBy.name}</span>
                                <span className="text-gray-300">•</span>
                                <span className="capitalize">{event.performedBy.type}</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {formatEventDescription(event)}
                          </p>
                          
                          {/* Additional event data */}
                          {event.eventData?.comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              "{event.eventData.comment}"
                            </div>
                          )}
                          
                          {event.eventData?.adminNotes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                              <strong>Admin Notes:</strong> {event.eventData.adminNotes}
                            </div>
                          )}
                        </div>
                        
                        <time className="text-xs text-gray-500 ml-4">
                          {new Date(event.createdAt).toLocaleString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};