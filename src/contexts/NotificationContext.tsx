'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Notification, NotificationState, NotificationContextType } from '@/types/notification';
import { notificationStorage } from '@/lib/notificationStorage';

type NotificationAction =
  | { type: 'LOAD_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'LOAD_NOTIFICATIONS': {
      const notifications = action.payload;
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
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
    case 'CLEAR_ALL': {
      return {
        notifications: [],
        unreadCount: 0,
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

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadStoredNotifications = () => {
      const storedNotifications = notificationStorage.loadNotifications();
      if (storedNotifications.length > 0) {
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: storedNotifications });
      }
    };

    loadStoredNotifications();
  }, []);

  // Save notifications to localStorage whenever state changes
  useEffect(() => {
    if (state.notifications.length > 0) {
      notificationStorage.saveNotifications(state.notifications);
    }
  }, [state.notifications]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      persistent: notificationData.persistent !== false, // Default to true
      autoClose: notificationData.autoClose !== false, // Default to true
      duration: notificationData.duration || 5000, // Default 5 seconds
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Reset the notification popup closed flag when new notifications arrive
    // This allows the popup to show for new notifications after previous ones were dismissed
    localStorage.removeItem('notificationPopupClosed');

    // Auto-remove notification after duration if autoClose is enabled
    if (notification.autoClose) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
      }, notification.duration);
    }
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
    notificationStorage.markAsRead(id);
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
    notificationStorage.markAllAsRead();
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    notificationStorage.removeNotification(id);
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL' });
    notificationStorage.clearNotifications();
  };

  const getUnreadNotifications = () => {
    return state.notifications.filter(n => !n.read);
  };

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadNotifications,
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