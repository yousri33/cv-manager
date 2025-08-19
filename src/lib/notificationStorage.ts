import { Notification } from '@/types/notification';

const STORAGE_KEY = 'app_notifications';

export const notificationStorage = {
  // Save notifications to localStorage
  saveNotifications: (notifications: Notification[]): void => {
    try {
      const persistentNotifications = notifications.filter(n => n.persistent !== false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentNotifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  },

  // Load notifications from localStorage
  loadNotifications: (): Notification[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notifications: Notification[] = JSON.parse(stored);
      
      // Filter out expired notifications (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return notifications.filter(n => n.timestamp > sevenDaysAgo);
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
      return [];
    }
  },

  // Clear all notifications from localStorage
  clearNotifications: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear notifications from localStorage:', error);
    }
  },

  // Add a single notification to localStorage
  addNotification: (notification: Notification): void => {
    try {
      const existing = notificationStorage.loadNotifications();
      const updated = [...existing, notification];
      notificationStorage.saveNotifications(updated);
    } catch (error) {
      console.error('Failed to add notification to localStorage:', error);
    }
  },

  // Remove a notification from localStorage
  removeNotification: (id: string): void => {
    try {
      const existing = notificationStorage.loadNotifications();
      const updated = existing.filter(n => n.id !== id);
      notificationStorage.saveNotifications(updated);
    } catch (error) {
      console.error('Failed to remove notification from localStorage:', error);
    }
  },

  // Mark notification as read in localStorage
  markAsRead: (id: string): void => {
    try {
      const existing = notificationStorage.loadNotifications();
      const updated = existing.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      notificationStorage.saveNotifications(updated);
    } catch (error) {
      console.error('Failed to mark notification as read in localStorage:', error);
    }
  },

  // Mark all notifications as read in localStorage
  markAllAsRead: (): void => {
    try {
      const existing = notificationStorage.loadNotifications();
      const updated = existing.map(n => ({ ...n, read: true }));
      notificationStorage.saveNotifications(updated);
    } catch (error) {
      console.error('Failed to mark all notifications as read in localStorage:', error);
    }
  }
};