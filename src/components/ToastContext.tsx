import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, RefreshCw, Info, X, ExternalLink } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'pending' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txHash?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, update: Partial<Omit<ToastItem, 'id'>>) => void;
  showSuccess: (title: string, message?: string, txHash?: string) => string;
  showError: (title: string, message?: string) => string;
  showPending: (title: string, message?: string, txHash?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // max 5 toasts visible

    // Auto dismiss unless it's pending or explicitly set to 0
    const autoDismissDuration = toast.duration ?? (toast.type === 'pending' ? 0 : 7000);
    if (autoDismissDuration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, autoDismissDuration);
    }

    return id;
  }, [removeToast]);

  const updateToast = useCallback((id: string, update: Partial<Omit<ToastItem, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...update };
          if (updated.type !== 'pending' && (!update.duration || update.duration > 0)) {
            setTimeout(() => {
              removeToast(id);
            }, update.duration || 7000);
          }
          return updated;
        }
        return t;
      })
    );
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string, txHash?: string) => {
    return addToast({ type: 'success', title, message, txHash });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string) => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const showPending = useCallback((title: string, message?: string, txHash?: string) => {
    return addToast({ type: 'pending', title, message, txHash, duration: 0 });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast, showSuccess, showError, showPending }}>
      {children}
      
      {/* Global Floating Toast Overlay */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="pointer-events-auto bg-card border border-border-main rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden flex items-start gap-3 text-text-main"
            >
              {/* Type Indicator Icon */}
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
                {toast.type === 'pending' && (
                  <div className="w-8 h-8 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/20 text-[#00A3FF] flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {toast.type === 'info' && (
                  <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Toast Content */}
              <div className="flex-1 pr-6 space-y-1">
                <div className="font-bold text-sm leading-tight text-text-main">{toast.title}</div>
                {toast.message && (
                  <div className="text-xs text-text-secondary leading-relaxed break-words font-sans">
                    {toast.message}
                  </div>
                )}
                {toast.txHash && (
                  <a
                    href={`https://etherscan.io/tx/${toast.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#00A3FF] hover:underline pt-1"
                  >
                    <span>View on Etherscan ({toast.txHash.slice(0, 10)}...)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 text-text-secondary hover:text-text-main transition-colors p-1 rounded-lg hover:bg-input"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Subtle top border bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500'
                    : toast.type === 'error'
                    ? 'bg-red-500'
                    : toast.type === 'pending'
                    ? 'bg-[#00A3FF] animate-pulse'
                    : 'bg-sky-500'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
