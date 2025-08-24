'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Notification, NotificationState, NotificationContextType } from '@/types/notification';

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'HIDE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SYNC_WEBHOOK_NOTIFICATIONS'; payload: Notification[] };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const notifications = [action.payload, ...state.notifications];
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    case 'MARK_AS_READ': {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    case 'MARK_ALL_AS_READ': {
      const notifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        notifications,
        unreadCount: 0,
      };
    }
    case 'REMOVE_NOTIFICATION': {
      const notifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    case 'HIDE_NOTIFICATION': {
      const notifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    case 'CLEAR_ALL': {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }
    case 'SYNC_WEBHOOK_NOTIFICATIONS': {
      const webhookNotifications = action.payload;
      const existingIds = new Set(state.notifications.map(n => n.id));
      
      const newNotifications = webhookNotifications
        .filter(webhookNotif => !existingIds.has(webhookNotif.id))
        .map(webhookNotif => ({
          id: webhookNotif.id,
          title: webhookNotif.title,
          message: webhookNotif.message,
          type: webhookNotif.type || 'cv_analysis',
          priority: webhookNotif.priority || 'medium',
          timestamp: webhookNotif.timestamp,
          read: false,
          candidate: webhookNotif.candidate,
          canHide: true,
        }));
      
      if (newNotifications.length === 0) {
        return state;
      }
      
      const notifications = [...newNotifications, ...state.notifications];
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    default:
      return state;
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Sync with webhook notifications periodically
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/webhook');
        if (response.ok) {
          const data = await response.json();
          if (data.notifications && Array.isArray(data.notifications)) {
            dispatch({ type: 'SYNC_WEBHOOK_NOTIFICATIONS', payload: data.notifications });
          }
        }
      } catch (error) {
        console.error('Error syncing webhook notifications:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(syncInterval);
  }, []);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      priority: notificationData.priority || 'medium',
      canHide: notificationData.canHide !== false,
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const hideNotification = (id: string) => {
    dispatch({ type: 'HIDE_NOTIFICATION', payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const getUnreadNotifications = () => {
    return state.notifications.filter(n => !n.read);
  };

  const syncWebhookNotificationsNow = async () => {
    try {
      const response = await fetch('/api/webhook');
      if (response.ok) {
        const data = await response.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          dispatch({ type: 'SYNC_WEBHOOK_NOTIFICATIONS', payload: data.notifications });
        }
      }
    } catch (error) {
      console.error('Error syncing webhook notifications:', error);
    }
  };

  const triggerUploadNotificationSync = async () => {
    // Immediate sync when upload starts
    await syncWebhookNotificationsNow();
    
    // Set up enhanced polling for webhook responses during upload
    const uploadSyncInterval = setInterval(async () => {
      await syncWebhookNotificationsNow();
    }, 2000); // Check every 2 seconds during upload
    
    // Return cleanup function
    return () => clearInterval(uploadSyncInterval);
  };

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    hideNotification,
    clearAllNotifications,
    getUnreadNotifications,
    syncWebhookNotificationsNow,
    triggerUploadNotificationSync,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};