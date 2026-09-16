'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { AuthSplitShell } from '../../components/auth/AuthSplitShell';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser, availableUsers } = useAuth();
  const [memberId, setMemberId] = useState('ATF-60201');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputClass =
    'w-full text-xs rounded-lg bg-slate-100 border border-transparent p-2.5 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors placeholder:text-slate-400';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const matching = availableUsers.find(
      (u) => u.memberId.toUpperCase() === memberId.trim().toUpperCase()
    );

    if (matching) {
      await switchUser(matching.id);
    } else if (availableUsers.length > 0) {
      await switchUser(availableUsers[0].id);
    }

    setLoading(false);
    router.push('/dashboard');
  };

  const handleQuickLogin = async (userId: string) => {
    setLoading(true);
    await switchUser(userId);
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <AuthSplitShell>
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

      {/* Quick test access */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-center text-3xs text-slate-400 mb-2.5">Quick test access</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {availableUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              title={`${u.fullName} (${u.memberId})`}
              onClick={() => handleQuickLogin(u.id)}
              className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
            >
              {u.fullName.charAt(0)}
            </button>
          ))}
        </div>
      </div>
    </AuthSplitShell>
  );
}
