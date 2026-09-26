import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none select-none text-xs">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />,
          status: 'SUCCESS'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />,
          status: 'ERR'
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />,
          status: 'INFO'
        };
    }
  };

  const { icon, status } = getToastConfig();

  return (
    <div className="pointer-events-auto border border-[var(--line)] bg-[var(--panel-card)] text-slate-100 p-3.5 shadow-2xl flex items-start gap-3 min-w-[280px] max-w-sm backdrop-blur-md animate-fadeIn">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="font-mono-tech text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
          RECEIPT // {status}
        </div>
        <p className="font-mono-tech text-[11px] text-slate-200 leading-tight">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss toast"
        className="text-slate-500 hover:text-slate-200 p-0.5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

