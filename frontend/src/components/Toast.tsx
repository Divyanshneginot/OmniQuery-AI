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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none select-none font-mono text-xs">
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

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-cyan-400 flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/40';
      case 'error':
        return 'border-rose-500/40 bg-rose-950/40';
      default:
        return 'border-cyan-500/40 bg-cyan-950/40';
    }
  };

  return (
    <div className={`pointer-events-auto cinema-glass border ${getBorderColor()} text-zinc-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[260px] max-w-sm backdrop-blur-xl animate-fadeIn`}>
      {getIcon()}
      <span className="flex-1 text-[11px] font-medium leading-tight">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-500 hover:text-zinc-200 p-0.5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

