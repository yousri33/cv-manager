'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PendingUploadContextType {
  pendingCount: number;
  incrementPending: () => void;
  decrementPending: () => void;
  resetPending: () => void;
}

const PendingUploadContext = createContext<PendingUploadContextType | undefined>(undefined);

interface PendingUploadProviderProps {
  children: ReactNode;
}

export const PendingUploadProvider: React.FC<PendingUploadProviderProps> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);

  const incrementPending = () => {
    setPendingCount(prev => prev + 1);
  };

  const decrementPending = () => {
    setPendingCount(prev => Math.max(0, prev - 1));
  };

  const resetPending = () => {
    setPendingCount(0);
  };

  const value = {
    pendingCount,
    incrementPending,
    decrementPending,
    resetPending,
  };

  return (
    <PendingUploadContext.Provider value={value}>
      {children}
    </PendingUploadContext.Provider>
  );
};

export const usePendingUpload = (): PendingUploadContextType => {
  const context = useContext(PendingUploadContext);
  if (context === undefined) {
    throw new Error('usePendingUpload must be used within a PendingUploadProvider');
  }
  return context;
};
