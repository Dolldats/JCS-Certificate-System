'use client';

import React from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { ToastProvider } from '../../components/ui/Toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
