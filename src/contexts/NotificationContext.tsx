import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { 
  addNotification, 
  setRealTimeConnectionStatus,
  fetchNotificationStats
} from '../store/slices/notificationSlice';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  requestPermission: () => Promise<NotificationPermission>;
  showBrowserNotification: (notification: Notification) => void;
  isRealTimeConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useAuth();
  const { preferences, isRealTimeConnected } = useSelector((state: RootState) => state.notifications);

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await notificationService.requestNotificationPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    // Check if desktop notifications are enabled in preferences
    if (preferences?.in_app?.desktop_notifications) {
      notificationService.showBrowserNotification(notification);
    }
  }, [preferences]);

  // Handle incoming real-time notifications
  const handleRealTimeNotification = useCallback((notification: Notification) => {
    // Add to Redux store
    dispatch(addNotification(notification));
    
    // Show browser notification if enabled
    if (preferences?.in_app?.desktop_notifications && Notification.permission === 'granted') {
      showBrowserNotification(notification);
    }
    
    // Play sound if enabled
    if (preferences?.in_app?.sound_enabled) {
      // Create and play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
    }

    // Update notification stats
    dispatch(fetchNotificationStats());
  }, [dispatch, preferences, showBrowserNotification]);

  // Set up real-time connection
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setRealTimeConnectionStatus(false));
      return;
    }

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToRealTime(handleRealTimeNotification);
    
    // Mark as connected
    dispatch(setRealTimeConnectionStatus(true));

    // Cleanup on unmount or auth change
    return () => {
      unsubscribe();
      dispatch(setRealTimeConnectionStatus(false));
    };
  }, [isAuthenticated, dispatch, handleRealTimeNotification]);

  // Request notification permission on first load if not already granted
  useEffect(() => {
    if (isAuthenticated && preferences?.in_app?.desktop_notifications) {
      if (Notification.permission === 'default') {
        requestPermission();
      }
    }
  }, [isAuthenticated, preferences, requestPermission]);

  // Periodic stats refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch stats immediately
    dispatch(fetchNotificationStats());

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchNotificationStats());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  const contextValue: NotificationContextType = {
    requestPermission,
    showBrowserNotification,
    isRealTimeConnected,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};