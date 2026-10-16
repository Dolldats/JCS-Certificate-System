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
  successTitle,
  successDescription,
  doneLabel = 'Done',
}: ConfirmDialogProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [stage, setStage] = useState<'confirm' | 'success'>('confirm');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    // Reset inside an async task (not synchronously in the effect body):
    // fresh confirm stage, then pop in after first paint.
    (async () => {
      setStage('confirm');
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
    setIsBusy(true);
    try {
      await onConfirm();
      setStage('success');
    } finally {
      setIsBusy(false);
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
            'relative w-full max-w-sm rounded-[28px] bg-white px-6 py-8 shadow-2xl transition-all duration-200',
            mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close dialog"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

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
                  disabled={isBusy}
                  className="flex-1 rounded-full border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isBusy}
                  className={cn(
                    'flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 cursor-pointer',
                    button
                  )}
                >
                  {isBusy ? 'Please wait…' : confirmLabel}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
