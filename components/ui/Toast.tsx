'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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

const defaultTitles: Record<ToastTone, string> = {
  success: 'Success',
  error: 'Something went wrong',
  info: 'Note',
};

const toneStyles: Record<ToastTone, { circle: string; icon: string; Icon: typeof CheckCircle2 }> = {
  success: { circle: 'bg-emerald-50', icon: 'text-emerald-600', Icon: CheckCircle2 },
  error: { circle: 'bg-rose-50', icon: 'text-rose-600', Icon: AlertCircle },
  info: { circle: 'bg-blue-50', icon: 'text-blue-600', Icon: ShieldCheck },
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
        { id, tone, title: opts?.title || defaultTitles[tone], message },
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
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => {
          const style = toneStyles[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', style.circle)}>
                <style.Icon className={cn('h-5 w-5', style.icon)} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{t.title}</p>
                <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
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
