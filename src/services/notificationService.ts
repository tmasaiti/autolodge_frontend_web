import { api } from './api';

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'document' | 'dispute' | 'system' | 'marketing';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  metadata?: {
    booking_id?: string;
    dispute_id?: string;
    payment_id?: string;
    action_url?: string;
    [key: string]: any;
  };
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  email: {
    booking_updates: boolean;
    payment_notifications: boolean;
    document_reminders: boolean;
    dispute_updates: boolean;
    marketing: boolean;
  };
  sms: {
    urgent_only: boolean;
    booking_confirmations: boolean;
    payment_issues: boolean;
  };
  push: {
    real_time_updates: boolean;
    booking_reminders: boolean;
    promotional: boolean;
  };
  in_app: {
    all_notifications: boolean;
    sound_enabled: boolean;
    desktop_notifications: boolean;
  };
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

class NotificationService {
  private baseUrl = '/notifications';
  private eventSource: EventSource | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  /**
   * Get user notifications with filtering and pagination
   */
  async getNotifications(params?: {
    status?: 'unread' | 'read' | 'archived';
    type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: Notification[];
    total: number;
    has_more: boolean;
  }> {
    const response = await api.get(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/${notificationId}/read`);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    await api.patch(`${this.baseUrl}/bulk-read`, { notification_ids: notificationIds });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.patch(`${this.baseUrl}/read-all`);
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/${notificationId}/archive`);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${notificationId}`);
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get(`${this.baseUrl}/preferences`);
    return response.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.put(`${this.baseUrl}/preferences`, preferences);
    return response.data;
  }

  /**
   * Test notification delivery
   */
  async testNotification(channel: 'email' | 'sms' | 'push'): Promise<void> {
    await api.post(`${this.baseUrl}/test`, { channel });
  }

  /**
   * Subscribe to real-time notifications via Server-Sent Events
   */
  subscribeToRealTime(onNotification: (notification: Notification) => void): () => void {
    this.listeners.push(onNotification);

    if (!this.eventSource) {
      const token = localStorage.getItem('auth_token');
      this.eventSource = new EventSource(`/api${this.baseUrl}/stream?token=${token}`);
      
      this.eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.listeners.forEach(listener => listener(notification));
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Notification stream error:', error);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.subscribeToRealTime(() => {});
          }
        }, 5000);
      };
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(onNotification);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }

      // Close event source if no more listeners
      if (this.listeners.length === 0 && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(notification: Notification): void {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        data: notification.metadata,
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.metadata?.action_url) {
          window.location.href = notification.metadata.action_url;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }
}

export const notificationService = new NotificationService();