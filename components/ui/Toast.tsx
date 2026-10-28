'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
}

interface ToastOptions {
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, opts?: ToastOptions) => void;
    error: (message: string, opts?: ToastOptions) => void;
    info: (message: string, opts?: ToastOptions) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastSeq = 0;

const toneStyles: Record<ToastTone, { Icon: typeof CheckCircle2 }> = {
  success: { Icon: CheckCircle2 },
  error: { Icon: AlertCircle },
  info: { Icon: ShieldCheck },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, opts?: ToastOptions) => {
      toastSeq += 1;
      const id = toastSeq;
      setToasts((current) => [
        ...current.slice(-3),
        { id, tone, title: opts?.title || '', message },
      ]);
      window.setTimeout(() => dismiss(id), opts?.duration ?? 5000);
    },
    [dismiss]
  );

  const toast = React.useMemo(
    () => ({
      success: (message: string, opts?: ToastOptions) => push('success', message, opts),
      error: (message: string, opts?: ToastOptions) => push('error', message, opts),
      info: (message: string, opts?: ToastOptions) => push('info', message, opts),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,420px)] flex-col gap-2">
        {toasts.map((t) => {
          const style = toneStyles[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              aria-atomic="true"
              className={`toast-notification toast-notification--${t.tone} pointer-events-auto`}
            >
              <style.Icon className="toast-notification__icon" />
              <div className="min-w-0 flex-1">
                {t.title && <p className="toast-notification__title">{t.title}</p>}
                <p className={`toast-notification__message ${t.title ? 'mt-0.5' : ''}`}>{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="toast-notification__close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
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
