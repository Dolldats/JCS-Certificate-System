'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { AuthTransitionLoading } from '../auth/AuthTransitionLoading';
import { DashboardLoadingSkeleton } from '../ui/LoadingSkeletons';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isLoading, user, authTransition, completeAuthTransition } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && user && authTransition === 'signing-in') {
      completeAuthTransition();
    }
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'MEMBER') router.replace('/member');
  }, [authTransition, completeAuthTransition, isLoading, router, user]);

  // No session — send them to the sign-in page instead of rendering an empty
  // dashboard shell.
  if (isLoading || !user || user.role === 'MEMBER') {
    if (authTransition) {
      return <AuthTransitionLoading title={authTransition === 'signing-in' ? 'Signing you in' : 'Signing you out'} />;
    }
    if (isLoading) {
      return <DashboardLoadingSkeleton />;
    }
    const loadingTitle = user ? 'Opening your account' : 'Returning to sign in';
    return (
      <div className="app-background flex min-h-screen w-full items-center justify-center" role="status" aria-label={loadingTitle}>
        <div className="glass-surface flex min-w-56 flex-col items-center rounded-2xl px-8 py-7 text-center shadow-2xl">
          <div className="login-logo-loader relative mb-4 grid h-[76px] w-[76px] place-items-center">
            <span aria-hidden="true" className="login-logo-loader__ring absolute inset-0 rounded-full border-[3px] border-emerald-100 border-t-emerald-600" />
            <span aria-hidden="true" className="absolute inset-[7px] rounded-full bg-emerald-500/10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ahmadiyyah_logo.png" alt="" className="relative z-10 h-11 w-11 rounded-full object-contain" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{loadingTitle}</p>
        </div>
      </div>
    );
  }

  // Constrain the shell to the viewport so the main pane scrolls independently of navigation.
  return (
    <div className="app-background flex h-dvh w-full overflow-hidden font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="sticky top-0 hidden h-full lg:flex lg:shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 sidebar-drawer shadow-2xl z-50 animate-in slide-in-from-left">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        {/* Keep scrolling inside the content pane; the header and desktop sidebar remain in place. */}
        <main className="theme-main min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 lg:p-8">
          <div className="max-w-[1440px] mx-auto space-y-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
