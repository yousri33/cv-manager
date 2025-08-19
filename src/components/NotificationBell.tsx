'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';
import { playClickSound, playNewNotificationSound, playSuccessSound, playWarningSound } from '@/utils/notificationSound';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
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
    playClickSound();
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    playSuccessSound();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    playSuccessSound();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    playWarningSound();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
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
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className={cn("w-6 h-6 transition-transform duration-150", isShaking && "animate-bell-shake")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => {
              setIsOpen(false);
              playClickSound();
            }}
          />
          
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                    >
                      Clear all
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    playClickSound();
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-100 last:border-b-0 transition-all duration-300 hover:bg-gray-50 hover:shadow-sm cursor-pointer group",
                      !notification.read && "bg-gradient-to-r from-blue-50 to-indigo-50",
                      notification.type === 'success' && "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50",
                      notification.type === 'error' && "border-red-200 bg-gradient-to-r from-red-50 to-pink-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={cn(
                          "p-1.5 rounded-full",
                          notification.type === 'success' && "bg-green-100",
                          notification.type === 'error' && "bg-red-100",
                          notification.type === 'warning' && "bg-yellow-100",
                          (notification.type === 'info' || !notification.type) && "bg-blue-100"
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "font-semibold text-sm mb-1 group-hover:text-gray-700 transition-colors",
                            notification.read ? "text-gray-700" : "text-gray-900"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className={cn(
                          "text-xs mb-2 line-clamp-2 leading-relaxed",
                          notification.read ? "text-gray-500" : "text-gray-600"
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {notifications.length > 10 && (
                <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    +{notifications.length - 10} more notifications
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