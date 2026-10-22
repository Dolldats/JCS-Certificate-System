'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'MEMBER') router.replace('/member');
  }, [isLoading, router, user]);

  // No session — send them to the sign-in page instead of rendering an empty
  // dashboard shell.
  if (isLoading || !user || user.role === 'MEMBER') {
    return (
      <div className="app-background min-h-screen w-full flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Jama&apos;at Certify...</p>
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
