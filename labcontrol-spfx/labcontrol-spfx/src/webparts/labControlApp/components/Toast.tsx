
import React from 'react';
import { useAlert } from '../context/AlertContext';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useAlert();

    // Show only the latest toast for now, or stack them if needed.
    // Stacking is better for UX.

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-start gap-3 p-4 rounded-none border shadow-2xl backdrop-blur-md
                        animate-in slide-in-from-bottom-5 fade-in duration-300
                        max-w-sm w-full
                        ${toast.type === 'success' ? 'bg-orbital-success/10 border-orbital-success text-orbital-success' : ''}
                        ${toast.type === 'error' ? 'bg-orbital-danger/10 border-orbital-danger text-orbital-danger' : ''}
                        ${toast.type === 'warning' ? 'bg-orbital-warning/10 border-orbital-warning text-orbital-warning' : ''}
                        ${toast.type === 'info' ? 'bg-orbital-accent/10 border-orbital-accent text-orbital-accent' : ''}
                    `}
                >
                    <div className="mt-0.5 shrink-0">
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <AlertOctagon size={18} />}
                        {toast.type === 'warning' && <AlertTriangle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="font-display font-bold uppercase text-xs tracking-wider mb-1">
                            {toast.type || 'Notification'}
                        </p>
                        <p className="text-sm font-mono opacity-90 break-words leading-relaxed">
                            {toast.message}
                        </p>
                    </div>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
