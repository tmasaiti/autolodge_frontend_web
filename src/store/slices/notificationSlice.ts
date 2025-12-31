import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationService, Notification, NotificationPreferences, NotificationStats } from '../../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isRealTimeConnected: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  stats: null,
  preferences: null,
  loading: false,
  error: null,
  hasMore: true,
  isRealTimeConnected: false,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: {
    status?: 'unread' | 'read' | 'archived';
    type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await notificationService.getNotifications(params);
    return response;
  }
);

export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchStats',
  async () => {
    const stats = await notificationService.getNotificationStats();
    return stats;
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchPreferences',
  async () => {
    const preferences = await notificationService.getPreferences();
    return preferences;
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (preferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = await notificationService.updatePreferences(preferences);
    return updatedPreferences;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    return notificationId;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await notificationService.markAllAsRead();
  }
);

export const archiveNotification = createAsyncThunk(
  'notifications/archive',
  async (notificationId: string) => {
    await notificationService.archiveNotification(notificationId);
    return notificationId;
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add new notification to the beginning of the list
      state.notifications.unshift(action.payload);
      
      // Update unread count if notification is unread
      if (action.payload.status === 'unread') {
        state.unreadCount += 1;
      }
    },
    
    updateNotificationStatus: (state, action: PayloadAction<{ id: string; status: 'read' | 'archived' }>) => {
      const notification = state.notifications.find(n => n.id === action.payload.id);
      if (notification) {
        const wasUnread = notification.status === 'unread';
        notification.status = action.payload.status;
        
        // Update unread count
        if (wasUnread && action.payload.status === 'read') {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index > -1) {
        const notification = state.notifications[index];
        if (notification.status === 'unread') {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    setRealTimeConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isRealTimeConnected = action.payload;
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.hasMore = true;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.meta.arg?.offset === 0 || !action.meta.arg?.offset) {
          // Replace notifications if this is the first page
          state.notifications = action.payload.notifications;
        } else {
          // Append notifications for pagination
          state.notifications.push(...action.payload.notifications);
        }
        
        state.hasMore = action.payload.has_more;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      
      // Fetch stats
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.unreadCount = action.payload.unread_count;
      })
      
      // Fetch preferences
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      
      // Update preferences
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && notification.status === 'unread') {
          notification.status = 'read';
          notification.read_at = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          if (notification.status === 'unread') {
            notification.status = 'read';
            notification.read_at = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      })
      
      // Archive notification
      .addCase(archiveNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification) {
          notification.status = 'archived';
          if (notification.status === 'unread') {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index > -1) {
          const notification = state.notifications[index];
          if (notification.status === 'unread') {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      });
  },
});

export const {
  addNotification,
  updateNotificationStatus,
  removeNotification,
  setRealTimeConnectionStatus,
  clearNotifications,
  clearError,
} = notificationSlice.actions;

export { notificationSlice };