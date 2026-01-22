
import React from 'react';
import { useAlert } from '../context/AlertContext';
import { AppNotification } from '../types';

const icons = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info'
};

const colors = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200'
};

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAlert();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: AppNotification; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  return (
    <div 
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg transform transition-all duration-300 animate-slide-left ${colors[toast.type]}`}
      role="alert"
    >
      <span className={`material-symbols-outlined text-[24px] ${iconColors[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{toast.title}</h4>
        {toast.message && <p className="text-sm mt-1 opacity-90">{toast.message}</p>}
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        className="text-current opacity-50 hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
