import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'success', duration = 3800) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none no-print">
        {toasts.map((t) => {
          const Icon =
            t.type === 'error' ? AlertCircle : t.type === 'info' ? Info : CheckCircle2;
          const colors =
            t.type === 'error'
              ? 'border-rose-200 dark:border-rose-900 bg-rose-50/95 dark:bg-rose-950/95 text-rose-800 dark:text-rose-200'
              : t.type === 'info'
              ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/95 dark:bg-indigo-950/95 text-indigo-800 dark:text-indigo-200'
              : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/95 dark:bg-emerald-950/95 text-emerald-800 dark:text-emerald-200';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto animate-slide-in-right flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-md ${colors}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="rounded-md p-0.5 opacity-70 hover:opacity-100 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
