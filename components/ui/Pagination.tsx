'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
  isLoading?: boolean;
  /** Shown on the left of the control bar. */
  label?: string;
}

/**
 * Builds the page buttons with ellipses: 1 … 4 5 6 … 22
 */
function buildPageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  const sorted = [...pages].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push('gap');
    result.push(value);
    previous = value;
  }
  return result;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
  isLoading = false,
  label = 'Items per page:',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageNumbers = buildPageNumbers(safePage, totalPages);

  const from = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(totalCount, safePage * pageSize);

  const go = (target: number) => {
    const next = Math.min(Math.max(1, target), totalPages);
    if (next !== safePage) onPageChange(next);
  };

  return (
    <div
      className={cn(
        'glass-surface flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Items per page */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <label htmlFor="items-per-page" className="font-medium whitespace-nowrap">
          {label}
        </label>
        <div className="relative">
          <select
            id="items-per-page"
            value={pageSize}
            disabled={isLoading}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="glass-control cursor-pointer appearance-none rounded-lg border border-slate-300 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-800 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span className="hidden whitespace-nowrap text-slate-400 sm:inline">
          {totalCount === 0 ? 'No records' : `${from}–${to} of ${totalCount}`}
        </span>
      </div>

      {/* Page buttons */}
      <div className="flex items-center justify-between gap-1 sm:justify-start">
        <button
          type="button"
          onClick={() => go(safePage - 1)}
          disabled={isLoading || safePage <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers.map((entry, index) =>
            entry === 'gap' ? (
              <span
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 text-xs text-slate-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => go(entry)}
                disabled={isLoading}
                aria-current={entry === safePage ? 'page' : undefined}
                className={cn(
                  'flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
                  entry === safePage
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {entry}
              </button>
            )
          )}
        </div>

        <span className="px-2 text-xs font-medium tabular-nums text-slate-500 sm:hidden" aria-live="polite">
          {safePage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => go(safePage + 1)}
          disabled={isLoading || safePage >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="ml-2 hidden whitespace-nowrap text-xs text-slate-500 sm:inline">
          Page {safePage} of {totalPages}
        </span>
      </div>
    </div>
  );
}
