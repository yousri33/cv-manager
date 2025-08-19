'use client';

import React, { useState, useEffect } from 'react';
import { usePendingUpload } from '@/contexts/PendingUploadContext';
import { Clock, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playNewNotificationSound, playSuccessSound } from '@/utils/notificationSound';

const PendingUploadCounter: React.FC = () => {
  const { pendingCount } = usePendingUpload();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (pendingCount > 0) {
      setIsVisible(true);
      setIsAnimating(true);
      playNewNotificationSound();
      // Reset animation after a brief moment
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      if (isVisible) {
        playSuccessSound();
      }
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [pendingCount, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50",
        "border border-blue-200 rounded-full px-4 py-2 shadow-lg",
        "transition-all duration-500 ease-out transform",
        "hover:shadow-xl hover:scale-105 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100",
        pendingCount > 0 
          ? "animate-slide-in-right animate-fade-in" 
          : "animate-slide-out-right animate-fade-out",
        isAnimating && "animate-gentle-bounce"
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <FileUp className={cn(
            "w-4 h-4 text-blue-600 transition-all duration-300",
            "animate-pulse hover:text-blue-700 hover:scale-110"
          )} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse" />
        </div>
        <Clock className={cn(
          "w-4 h-4 text-blue-600 transition-all duration-300",
          "animate-spin hover:text-blue-700"
        )} style={{ animationDuration: '3s' }} />
      </div>
      <div className="flex items-center gap-1">
        <span className={cn(
          "text-sm font-semibold text-blue-700 transition-all duration-300",
          "hover:text-blue-800"
        )}>
          Processing
        </span>
        <span className={cn(
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold",
          "rounded-full h-5 w-5 flex items-center justify-center",
          "transition-all duration-300 transform hover:scale-110",
          "shadow-md hover:shadow-lg",
          isAnimating && "animate-pulse scale-110"
        )}>
          {pendingCount}
        </span>
      </div>
    </div>
  );
};

export default PendingUploadCounter;