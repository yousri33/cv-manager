'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      gutter={16}
      containerStyle={{
        top: 24,
        right: 24,
        zIndex: 9999,
      }}
      toastOptions={{
        duration: 6000,
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          fontSize: '15px',
          fontWeight: '600',
          padding: '20px 24px',
          maxWidth: '450px',
          minHeight: '70px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
        },
        success: {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%, #047857 100%)',
            color: '#ffffff',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.2), 0 10px 10px -5px rgba(16, 185, 129, 0.1)',
            backdropFilter: 'blur(16px)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#10b981',
          },
        },
        error: {
          duration: 7000,
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%, #b91c1c 100%)',
            color: '#ffffff',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.2), 0 10px 10px -5px rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(16px)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#ef4444',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%, #1e40af 100%)',
            color: '#ffffff',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.2), 0 10px 10px -5px rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(16px)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#3b82f6',
          },
        },
      }}
    />
  );
};

export { Toaster };