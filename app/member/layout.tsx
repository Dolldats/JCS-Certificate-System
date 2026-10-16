'use client';

import React from 'react';
import { ToastProvider } from '../../components/ui/Toast';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
