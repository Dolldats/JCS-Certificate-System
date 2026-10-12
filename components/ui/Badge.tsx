import React from 'react';
import { cn } from '../../lib/utils';
import { VerificationStatus, EventStatus, CertificateStatus, Auxiliary } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline';
  status?: VerificationStatus | EventStatus | CertificateStatus;
  auxiliary?: Auxiliary;
}

export function Badge({
  className,
  variant,
  status,
  auxiliary,
  children,
  ...props
}: BadgeProps) {
  let resolvedVariant = variant || 'default';

  if (status) {
    switch (status) {
      case 'Verified':
      case 'Completed':
      case 'Issued':
        resolvedVariant = 'success';
        break;
      case 'Upcoming':
      case 'In Progress':
      case 'Active':
        resolvedVariant = 'info';
        break;
      case 'Draft':
      case 'Duplicate':
        resolvedVariant = 'warning';
        break;
      case 'Invalid':
      case 'Not Found':
      case 'Verification Failed':
      case 'Cancelled':
      case 'Revoked':
        resolvedVariant = 'danger';
        break;
      default:
        resolvedVariant = 'default';
    }
  }

  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  const auxiliaryStyles: Record<Auxiliary, string> = {
    Khuddam: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    Ansarullah: 'bg-amber-100 text-amber-900 border-amber-300',
    Lajna: 'bg-teal-100 text-teal-900 border-teal-300',
    Nasra: 'bg-purple-100 text-purple-900 border-purple-300',
    Atfal: 'bg-blue-100 text-blue-900 border-blue-300',
  };

  const styleClass = auxiliary ? auxiliaryStyles[auxiliary] : variants[resolvedVariant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-2xs select-none',
        styleClass,
        className
      )}
      {...props}
    >
      {status === 'Verified' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
      {status === 'Invalid' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />}
      {status === 'Duplicate' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
      {status === 'Not Found' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
      {children || status || auxiliary}
    </span>
  );
}
