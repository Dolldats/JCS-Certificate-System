'use client';

import { useAuth } from '../../context/AuthContext';
import { AuthTransitionLoading } from '../auth/AuthTransitionLoading';
import { usePathname } from 'next/navigation';

export function PageLoading() {
  const { authTransition } = useAuth();
  const pathname = usePathname();
  if (authTransition) {
    return <AuthTransitionLoading title={authTransition === 'signing-in' ? 'Signing you in' : 'Signing you out'} />;
  }

  // Public navigation into or out of login should not show the page-refresh spinner.
  if (pathname === '/' || pathname === '/login') {
    return <main role="status" aria-busy="true" className="sr-only">Loading page</main>;
  }

  return (
    <main
      className="page-loading-screen"
      role="status"
      aria-label="Loading page"
      aria-busy="true"
    >
      <span className="dual-ring-spinner" aria-hidden="true" />
      <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
    </main>
  );
}
