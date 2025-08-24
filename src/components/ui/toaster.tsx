'use client';

import { Toaster as HotToaster, toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';

const Toaster = () => {
  const handleDismissToast = (toastId: string) => {
    toast.dismiss(toastId);
  };


  return (
    <HotToaster
      position="top-left"
      gutter={16}
      containerStyle={{
        top: 24,
        left: 24,
        zIndex: 9999,
      }}
      toastOptions={{
        duration: 5000,
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          color: '#1f2937',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
          padding: '20px',
          maxWidth: '420px',
          minHeight: '72px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateX(0)',
        },
        success: {
          duration: 6000,
          style: {
            background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(220, 252, 231, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            color: '#14532d',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderLeft: '4px solid #22c55e',
            boxShadow: '0 20px 25px -5px rgba(34, 197, 94, 0.1), 0 10px 10px -5px rgba(34, 197, 94, 0.04)',
          },
          icon: <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 drop-shadow-sm" />,
        },
        error: {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(252, 226, 226, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            color: '#7f1d1d',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderLeft: '4px solid #ef4444',
            boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.04)',
          },
          icon: <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 drop-shadow-sm" />,
        },
        loading: {
          duration: Infinity,
          style: {
            background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(191, 219, 254, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            color: '#1e3a8a',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderLeft: '4px solid #3b82f6',
            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
          },
          icon: <Loader2 className="w-6 h-6 text-blue-600 flex-shrink-0 animate-spin drop-shadow-sm" />,
        },
        custom: {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            color: '#374151',
            border: '1px solid rgba(156, 163, 175, 0.3)',
            borderLeft: '4px solid #6b7280',
            boxShadow: '0 20px 25px -5px rgba(107, 114, 128, 0.1), 0 10px 10px -5px rgba(107, 114, 128, 0.04)',
          },
          icon: <Info className="w-6 h-6 text-gray-600 flex-shrink-0 drop-shadow-sm" />,
        },
      }}
    />
  );
};

export { Toaster };