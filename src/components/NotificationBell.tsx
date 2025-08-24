'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { playNewNotificationSound } from '@/utils/notificationSound';
import { Bell, X, CheckCircle, AlertCircle, AlertTriangle, Info, RefreshCw, User, FileText, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';

const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    hideNotification,
    clearAllNotifications, 
    syncWebhookNotificationsNow 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsShaking(true);
      playNewNotificationSound();
      const timer = setTimeout(() => setIsShaking(false), 600);
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleHideNotification = (id: string) => {
    hideNotification(id);
  };

  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const handleSync = async () => {
    await syncWebhookNotificationsNow();
  };

  const getNotificationIcon = (type: Notification['type'], candidate?: string) => {
    if (candidate) {
      return (
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      );
    }

    switch (type) {
      case 'cv_analysis':
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
        );
      case 'file_upload':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        );
      case 'system':
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-400 bg-gray-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
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

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200",
          isShaking && "animate-bounce"
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center transform translate-x-1/3 -translate-y-1/3">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-gray-700" />
                <h3 className="font-semibold text-lg text-gray-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Clear all
                    </button>
                  </>
                )}
                <button
                  onClick={handleSync}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800 transition-colors"
                  title="Sync notifications"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-base">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 8).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 border-l-4 transition-all duration-200 hover:shadow-sm",
                      getPriorityColor(notification.priority),
                      !notification.read && "bg-white border-l-blue-500 shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type, notification.candidate)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            notification.read ? "text-gray-600" : "text-gray-900"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.candidate && (
                          <div className="flex items-center gap-1 mb-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                              {notification.candidate}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                title="Mark as read"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                            {notification.canHide && (
                              <button
                                onClick={() => handleHideNotification(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                title="Hide notification"
                              >
                                <EyeOff className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveNotification(notification.id)}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                              title="Remove notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {notifications.length > 8 && (
                <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                  <span className="text-xs text-gray-600">
                    +{notifications.length - 8} more notifications
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;