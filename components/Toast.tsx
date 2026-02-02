
import React from 'react';
import { Toast as PolarisToast } from '@shopify/polaris';
import { useAlert } from '../context/AlertContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAlert();

  return (
    <>
      {toasts.map((toast) => (
        <PolarisToast
          key={toast.id}
          content={toast.title + (toast.message ? `: ${toast.message}` : '')}
          onDismiss={() => removeToast(toast.id)}
          duration={toast.duration || 4000}
          error={toast.type === 'error'}
        />
      ))}
    </>
  );
};
