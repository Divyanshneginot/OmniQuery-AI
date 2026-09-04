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
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,
          classes: 'border-emerald-200 dark:border-emerald-800/60 bg-white/95 dark:bg-[#141620]/95 text-slate-900 dark:text-slate-100'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />,
          classes: 'border-rose-200 dark:border-rose-800/60 bg-white/95 dark:bg-[#141620]/95 text-slate-900 dark:text-slate-100'
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />,
          classes: 'border-indigo-200 dark:border-indigo-800/60 bg-white/95 dark:bg-[#141620]/95 text-slate-900 dark:text-slate-100'
        };
    }
  };

  const { icon, classes } = getToastConfig();

  return (
    <div className={`pointer-events-auto border ${classes} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[260px] max-w-sm backdrop-blur-md animate-fadeIn`}>
      {icon}
      <span className="flex-1 text-[11px] font-medium leading-tight">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss toast"
        className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 transition-colors rounded"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

