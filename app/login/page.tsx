'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { AuthSplitShell } from '../../components/auth/AuthSplitShell';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClass =
    'w-full text-xs rounded-lg bg-slate-100 border border-transparent p-2.5 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors placeholder:text-slate-400';

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
    <AuthSplitShell>
      {/* Cover the form during authentication; success redirects to the role-specific portal. */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm"
        >
          <div className="flex min-w-56 flex-col items-center rounded-2xl border border-white/70 bg-white/95 px-8 py-7 text-center shadow-2xl dark:border-white/10 dark:bg-slate-900/95">
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
      <h2 className="text-center text-base font-bold text-slate-900 tracking-tight">Welcome back</h2>
      <p className="mt-1 text-center text-3xs text-slate-400">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label className="block text-3xs font-semibold text-slate-600 mb-1.5">Member ID</label>
          <input
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="e.g. ATF-60201"
            required
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-3xs font-semibold text-slate-600">Password</label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-3xs text-rose-600 font-medium text-center">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700"
          size="md"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>
    </AuthSplitShell>
  );
}
