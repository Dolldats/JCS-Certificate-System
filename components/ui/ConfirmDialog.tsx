'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ShieldCheck, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ConfirmTone = 'info' | 'warning' | 'danger';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  successTitle: string;
  successDescription?: string;
  doneLabel?: string;
  busyTitle?: string;
  busyDescription?: string;
}

const toneStyles: Record<ConfirmTone, { circle: string; icon: string; button: string; Icon: typeof Trash2 }> = {
  info: {
    circle: 'bg-blue-50',
    icon: 'text-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    Icon: ShieldCheck,
  },
  warning: {
    circle: 'bg-amber-50',
    icon: 'text-amber-500',
    button: 'bg-amber-500 hover:bg-amber-600',
    Icon: AlertTriangle,
  },
  danger: {
    circle: 'bg-rose-50',
    icon: 'text-rose-500',
    button: 'bg-rose-600 hover:bg-rose-700',
    Icon: Trash2,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Yes, Continue',
  cancelLabel = 'Cancel',
  tone = 'warning',
  busyTitle = 'Working on it',
  busyDescription = 'This will only take a moment.',
  successTitle,
  successDescription,
  doneLabel = 'Done',
}: ConfirmDialogProps) {
  const [stage, setStage] = useState<'confirm' | 'busy' | 'error' | 'success'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const isBusy = stage === 'busy';

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    // Reset inside an async task (not synchronously in the effect body):
    // fresh confirm stage, then pop in after first paint.
    (async () => {
      setStage('confirm');
      setErrorMessage('');
      setMounted(false);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (!cancelled) setMounted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  const { circle, icon, button, Icon } = toneStyles[tone];

  const handleConfirm = async () => {
    setErrorMessage('');
    setStage('busy');
    try {
      await onConfirm();
      setStage('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
        onClick={() => {
          if (!isBusy) onClose();
        }}
      />
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={cn(
            'glass-surface relative w-full max-w-sm rounded-[28px] px-6 py-8 shadow-2xl transition-all duration-200',
            mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          {!isBusy && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {stage === 'confirm' ? (
            <>
              <div className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full', circle)}>
                <Icon className={cn('h-7 w-7', icon)} />
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{title}</h3>
              {description && (
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{description}</p>
              )}

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-control flex-1 cursor-pointer rounded-full border border-blue-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={cn(
                    'flex-1 cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors active:brightness-95',
                    button
                  )}
                >
                  {confirmLabel}
                </button>
              </div>
            </>
          ) : stage === 'busy' ? (
            <>
              <div
                role="status"
                aria-live="polite"
                className="flex min-w-56 flex-col items-center text-center"
              >
                <div className="login-logo-loader relative mb-4 grid h-[76px] w-[76px] place-items-center">
                  <span
                    aria-hidden="true"
                    className="login-logo-loader__ring absolute inset-0 rounded-full border-[3px] border-emerald-100 border-t-emerald-600"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-[7px] rounded-full bg-emerald-500/10"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ahmadiyyah_logo.png"
                    alt=""
                    className="relative z-10 h-11 w-11 rounded-full object-contain"
                  />
                </div>
                <p className="text-sm font-semibold text-slate-900">{busyTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{busyDescription}</p>
              </div>
            </>
          ) : stage === 'error' ? (
            <div key="error" className="dialog-stage-pop">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
                <AlertTriangle className="h-7 w-7 text-rose-500" />
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                That didn&apos;t work
              </h3>
              <p className="mx-auto mt-2 max-w-xs break-words text-sm leading-relaxed text-slate-500">
                {errorMessage}
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStage('confirm')}
                  className="glass-control cursor-pointer rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <div key="success" className="dialog-stage-pop">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_0_0_8px_rgba(37,99,235,.08)]">
                  <Check className="h-8 w-8 text-blue-600" />
                </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{successTitle}</h3>
              {successDescription && (
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{successDescription}</p>
              )}

              <div className="mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-blue-600 px-10 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
                >
                  {doneLabel}
                </button>
              </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
