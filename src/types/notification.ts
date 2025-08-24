export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'cv_analysis' | 'file_upload' | 'system' | 'success' | 'error' | 'warning' | 'info';
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  read: boolean;
  candidate?: string; // Candidate name for CV analysis notifications
  canHide?: boolean; // Whether this notification can be hidden/removed
  persistent?: boolean; // Whether this notification should be persisted in localStorage
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
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getUnreadNotifications: () => Notification[];
  syncWebhookNotificationsNow: () => Promise<void>;
  triggerUploadNotificationSync: () => Promise<() => void>;
}