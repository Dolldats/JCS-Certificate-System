'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterDropdownOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Compact dropdown for a set of filter choices. Used where a horizontal tab
 * strip would overflow (certificate types, for example).
 */
export function FilterDropdown({
  value,
  options,
  onChange,
  label,
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="glass-control flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition-colors focus:border-slate-400 focus:outline-none"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{active?.label}</span>
          {typeof active?.count === 'number' && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-semibold text-emerald-800">
              {active.count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="dropdown-surface absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl p-1.5 shadow-xl"
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-emerald-50 font-semibold text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="truncate">{option.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {typeof option.count === 'number' && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-2xs font-semibold',
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {option.count}
                    </span>
                  )}
                  {isActive && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
