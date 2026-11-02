'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { AuthSplitShell } from '../../components/auth/AuthSplitShell';
import { Button } from '../../components/ui/Button';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, authTransition, completeAuthTransition } = useAuth();
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authTransition === 'signing-out') completeAuthTransition();
  }, [authTransition, completeAuthTransition]);

  const inputClass =
    'glass-control w-full rounded-full border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(memberId, password);
      router.push(user.role === 'MEMBER' ? '/member' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell showMobileBrand={false} wideForm>
      {/* Cover the form during authentication; success redirects to the role-specific portal. */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm"
        >
          <div className="glass-surface flex min-w-56 flex-col items-center rounded-2xl px-8 py-7 text-center shadow-2xl">
            <div className="login-logo-loader relative mb-4 grid h-[76px] w-[76px] place-items-center">
              <span aria-hidden="true" className="login-logo-loader__ring absolute inset-0 rounded-full border-[3px] border-emerald-100 border-t-emerald-600" />
              <span aria-hidden="true" className="absolute inset-[7px] rounded-full bg-emerald-500/10" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ahmadiyyah_logo.png"
                alt=""
                className="relative z-10 h-11 w-11 rounded-full object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Signing you in</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Checking your account…</p>
          </div>
        </div>
      )}
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Sign in to Jama&apos;at Certify</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleLogin} className="mt-7 space-y-4">
        <div>
          <label htmlFor="member-id" className="mb-2 block text-sm font-medium text-slate-700">
            Member ID
          </label>
          <div className="relative">
            <UserRound aria-hidden="true" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="member-id"
              name="memberId"
              type="text"
              autoComplete="username"
              autoCapitalize="characters"
              spellCheck={false}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="Enter your Member ID"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-sm text-rose-600 font-medium"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-gradient-to-r from-emerald-950 via-[#0b2e23] to-slate-950 text-base font-semibold hover:from-emerald-900 hover:via-[#103b2d] hover:to-slate-900"
          size="lg"
          isLoading={loading}
        >
          Sign in
        </Button>
      </form>
    </AuthSplitShell>
  );
}
