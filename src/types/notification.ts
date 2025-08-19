export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
  read: boolean;
  persistent?: boolean; // Whether to persist in localStorage
  autoClose?: boolean; // Whether to auto-close after timeout
  duration?: number; // Duration in milliseconds before auto-close
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getUnreadNotifications: () => Notification[];
}