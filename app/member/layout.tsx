'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authTransition, completeAuthTransition } = useAuth();
  useEffect(() => {
    if (authTransition === 'signing-in') completeAuthTransition();
  }, [authTransition, completeAuthTransition]);

  return <>{children}</>;
}
