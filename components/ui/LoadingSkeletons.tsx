import type { CSSProperties, ReactNode } from 'react';

export function SkeletonBlock({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`skeleton-block ${className}`} style={style} />;
}

function StatusFrame({ label, children, className = '' }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={className}>
      {children}
    </div>
  );
}

export function DashboardLoadingSkeleton({ label = 'Loading dashboard' }: { label?: string }) {
  return (
    <StatusFrame label={label} className="app-background min-h-dvh">
      <div className="flex min-h-dvh">
        <aside aria-hidden="true" className="theme-sidebar hidden w-64 shrink-0 border-r p-5 lg:block">
          <div className="flex items-center gap-3 border-b border-slate-200/70 pb-6 dark:border-slate-700">
            <SkeletonBlock className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-8 space-y-5">
            <SkeletonBlock className="h-3 w-20" />
            {Array.from({ length: 6 }, (_, index) => (
              <div className="flex items-center gap-3" key={index}>
                <SkeletonBlock className="h-5 w-5 rounded-md" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header aria-hidden="true" className="theme-header flex h-[82px] items-center justify-between gap-4 border-b px-4 sm:px-6">
            <SkeletonBlock className="h-11 w-full max-w-[560px] rounded-full" />
            <div className="hidden items-center gap-3 sm:flex">
              <SkeletonBlock className="h-10 w-20 rounded-full" />
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <SkeletonBlock className="h-10 w-36 rounded-full" />
            </div>
          </header>

          <main aria-hidden="true" className="theme-main min-h-[calc(100dvh-82px)] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1440px] space-y-6 sm:space-y-7">
              <SkeletonBlock className="h-48 w-full rounded-3xl sm:h-56" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div className="surface-card flex h-32 items-center justify-between rounded-2xl p-5" key={index}>
                    <div className="space-y-3">
                      <SkeletonBlock className="h-3 w-32" />
                      <SkeletonBlock className="h-6 w-20" />
                    </div>
                    <SkeletonBlock className="h-12 w-12 rounded-full" />
                  </div>
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
                <section className="surface-card min-h-64 rounded-2xl p-5 sm:p-6">
                  <SkeletonBlock className="h-4 w-48" />
                  <SkeletonBlock className="mt-2 h-3 w-32" />
                  {Array.from({ length: 3 }, (_, index) => (
                    <div className="mt-7 flex items-center justify-between gap-4" key={index}>
                      <div className="flex min-w-0 items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                          <SkeletonBlock className="h-3 w-40 max-w-full" />
                          <SkeletonBlock className="h-3 w-28 max-w-full" />
                        </div>
                      </div>
                      <SkeletonBlock className="h-9 w-20 rounded-lg" />
                    </div>
                  ))}
                </section>
                <section className="surface-card min-h-64 rounded-2xl p-5 sm:p-6">
                  <SkeletonBlock className="h-4 w-40" />
                  <SkeletonBlock className="mt-2 h-3 w-32" />
                  {Array.from({ length: 3 }, (_, index) => (
                    <div className="mt-6 space-y-3 rounded-xl border border-slate-200/70 p-4 dark:border-slate-700" key={index}>
                      <SkeletonBlock className="h-3 w-44 max-w-full" />
                      <SkeletonBlock className="h-3 w-28" />
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </StatusFrame>
  );
}

export function MemberPortalLoadingSkeleton() {
  return (
    <StatusFrame label="Loading member portal" className="app-background min-h-dvh px-4 py-5 sm:px-8 sm:py-10">
      <div aria-hidden="true" className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <header className="surface-card flex min-h-16 items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-10 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-24 rounded-full" />
          </div>
        </header>
        <SkeletonBlock className="h-36 w-full rounded-3xl sm:h-44" />
        <section className="surface-card rounded-2xl p-5 sm:p-7">
          <SkeletonBlock className="h-5 w-56 max-w-full" />
          <SkeletonBlock className="mt-3 h-3 w-72 max-w-full" />
          <div className="mt-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-5">
              {Array.from({ length: 2 }, (_, index) => (
                <div className="flex items-center justify-between gap-4" key={index}>
                  <SkeletonBlock className="h-3 w-40 max-w-full" />
                  <SkeletonBlock className="h-3 w-20" />
                </div>
              ))}
            </div>
            <SkeletonBlock className="mx-auto h-36 w-36 rounded-full" />
          </div>
        </section>
        <section className="space-y-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-60 max-w-full" />
            <SkeletonBlock className="h-3 w-80 max-w-full" />
          </div>
          {Array.from({ length: 3 }, (_, index) => (
            <div className="surface-card flex min-h-24 flex-col justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:p-6" key={index}>
              <div className="flex items-center gap-4">
                <SkeletonBlock className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-44 max-w-full" />
                  <SkeletonBlock className="h-3 w-28" />
                  <SkeletonBlock className="h-3 w-36 max-w-full" />
                </div>
              </div>
              <SkeletonBlock className="h-16 w-full rounded-xl sm:w-56" />
            </div>
          ))}
        </section>
      </div>
    </StatusFrame>
  );
}

export function TableLoadingSkeleton({ label, columns = 6, rows = 5 }: {
  label: string;
  columns?: number;
  rows?: number;
}) {
  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <StatusFrame label={label} className="overflow-x-auto">
      <div aria-hidden="true" className="min-w-[680px]">
        <div className="grid gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700" style={gridStyle}>
          {Array.from({ length: columns }, (_, index) => <SkeletonBlock className="h-3 w-3/4" key={index} />)}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div className="grid items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 dark:border-slate-800" style={gridStyle} key={row}>
            {Array.from({ length: columns }, (_, column) => (
              <SkeletonBlock className={`h-3 ${column === 0 ? 'w-4/5' : column % 2 ? 'w-3/5' : 'w-2/3'}`} key={column} />
            ))}
          </div>
        ))}
      </div>
    </StatusFrame>
  );
}

export function EventCardsLoadingSkeleton() {
  return (
    <StatusFrame label="Loading events">
      <div aria-hidden="true" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="surface-card min-h-64 space-y-5 rounded-2xl p-5" key={index}>
            <div className="flex justify-between gap-4">
              <SkeletonBlock className="h-6 w-24 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-5 w-4/5" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <SkeletonBlock className="h-3 w-3/4" />
              <SkeletonBlock className="h-3 w-1/2" />
            </div>
            <SkeletonBlock className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </StatusFrame>
  );
}

export function TemplatePillsLoadingSkeleton() {
  return (
    <StatusFrame label="Loading certificate templates">
      <div aria-hidden="true" className="flex gap-2 overflow-hidden pb-2">
        {[32, 40, 28, 36, 24].map((width, index) => (
          <SkeletonBlock className="h-10 shrink-0 rounded-xl" key={index} style={{ width: `${width * 4}px` }} />
        ))}
      </div>
    </StatusFrame>
  );
}
