'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationPopup: React.FC = () => {
  const { getUnreadNotifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Check for unread notifications on mount and when notifications change
    const checkUnreadNotifications = () => {
      const unread = getUnreadNotifications();
      setUnreadNotifications(unread);
      
      // Only show popup if there are unread notifications AND popup is not manually closed
      if (unread.length > 0 && !localStorage.getItem('notificationPopupClosed')) {
        setIsVisible(true);
      }
    };

    checkUnreadNotifications();
    
    // Set up interval to check for new notifications
    const interval = setInterval(checkUnreadNotifications, 1000);
    
    return () => clearInterval(interval);
  }, [getUnreadNotifications]);

  const handleClose = () => {
    setIsVisible(false);
    // Set a flag in localStorage to prevent the popup from reopening
    localStorage.setItem('notificationPopupClosed', 'true');
    
    // Clear the flag after 1 hour to allow future notifications to show
    setTimeout(() => {
      localStorage.removeItem('notificationPopupClosed');
    }, 60 * 60 * 1000);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setIsVisible(false);
    
    // Set a flag in localStorage to prevent the popup from reopening
    localStorage.setItem('notificationPopupClosed', 'true');
    
    // Clear the flag after 1 hour to allow future notifications to show
    setTimeout(() => {
      localStorage.removeItem('notificationPopupClosed');
    }, 60 * 60 * 1000);
  };
  
  const handleClearAll = () => {
    clearAllNotifications();
    setIsVisible(false);
    
    // Set a flag in localStorage to prevent the popup from reopening
    localStorage.setItem('notificationPopupClosed', 'true');
    
    // Clear the flag after 1 hour to allow future notifications to show
    setTimeout(() => {
      localStorage.removeItem('notificationPopupClosed');
    }, 60 * 60 * 1000);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    // Update local state
    setUnreadNotifications(prev => prev.filter(n => n.id !== id));
    
    // Hide popup if no more unread notifications
    const remaining = unreadNotifications.filter(n => n.id !== id);
    if (remaining.length === 0) {
      setIsVisible(false);
      
      // Set a flag in localStorage to prevent the popup from reopening
      localStorage.setItem('notificationPopupClosed', 'true');
      
      // Clear the flag after 1 hour to allow future notifications to show
      setTimeout(() => {
        localStorage.removeItem('notificationPopupClosed');
      }, 60 * 60 * 1000);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50';
      case 'error':
        return 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50';
      case 'warning':
        return 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50';
      case 'cv_analysis':
        return 'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50';
      case 'file_upload':
      case 'system':
      case 'info':
      default:
        return 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isVisible || unreadNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Popup Container */}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] animate-in slide-in-from-top-2 duration-300">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-6 py-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {unreadNotifications.length} Unread Notification{unreadNotifications.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-white/80 mt-0.5">Stay updated with your CV analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium hover:scale-105"
                aria-label="Mark all as read"
              >
                Mark all read
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium hover:scale-105"
                aria-label="Clear all notifications"
              >
                Clear all
              </button>
              <button
                onClick={handleClose}
                className="hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {unreadNotifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-5 border-b border-gray-100 last:border-b-0 transition-all duration-300 hover:bg-gray-50 hover:shadow-sm cursor-pointer group",
                  getNotificationStyles(notification.type)
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-full ${
                      notification.type === 'success' ? 'bg-green-100' :
                      notification.type === 'error' ? 'bg-red-100' :
                      notification.type === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-all duration-200 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-full hover:scale-105"
                      >
                        Mark as read
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {unreadNotifications.length > 5 && (
              <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  +{unreadNotifications.length - 5} more notifications
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPopup;