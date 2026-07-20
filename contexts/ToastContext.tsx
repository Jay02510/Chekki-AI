import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);

  const showToast = useCallback((options: ToastOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    const newToast = {
      ...opts,
      type: opts.type || 'info',
      duration: opts.duration || 3000,
      id: Date.now(),
    };

    setToast(newToast);

    setTimeout(() => {
      setToast((current) => {
        if (current?.id === newToast.id) {
          return null;
        }
        return current;
      });
    }, newToast.duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-full px-4 flex justify-center animate-[fadeIn_200ms_ease-out]">
          <div
            className={`px-5 py-3 rounded-full shadow-2xl backdrop-blur-xl border flex items-center gap-3 max-w-sm ${
              toast.type === 'error'
                ? 'bg-red-500/90 border-red-500/20 text-white'
                : toast.type === 'success'
                  ? 'bg-emerald-500/90 border-emerald-500/20 text-white'
                  : 'bg-zinc-900/90 border-white/10 text-white'
            }`}
          >
            <span className="shrink-0 text-xl leading-none">
              {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✨' : '💡'}
            </span>
            <p className="text-sm font-bold tracking-wide break-words line-clamp-3">
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
