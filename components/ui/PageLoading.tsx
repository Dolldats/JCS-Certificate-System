'use client';

import { useAuth } from '../../context/AuthContext';
import { AuthTransitionLoading } from '../auth/AuthTransitionLoading';

export function PageLoading() {
  const { authTransition } = useAuth();
  if (authTransition) {
    return <AuthTransitionLoading title={authTransition === 'signing-in' ? 'Signing you in' : 'Signing you out'} />;
  }

  return (
    <main
      className="page-loading-screen"
      role="status"
      aria-label="Loading page"
      aria-busy="true"
    >
      <span className="dual-ring-spinner" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </main>
  );
}
