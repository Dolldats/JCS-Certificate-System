'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Auxiliary } from '../../types';
import { authApi } from '../../services/api';
import { AuthSplitShell } from '../../components/auth/AuthSplitShell';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

const AUXILIARIES: Auxiliary[] = ['Atfal', 'Khuddam', 'Ansarullah', 'Lajna', 'Nasra'];

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [auxiliary, setAuxiliary] = useState<Auxiliary>('Atfal');
  const [jamaat, setJamaat] = useState('');
  const [dilla, setDilla] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClass =
    'w-full text-xs rounded-lg bg-slate-100 border border-transparent p-2.5 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors placeholder:text-slate-400';
  const labelClass = 'block text-3xs font-semibold text-slate-600 mb-1.5';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !memberId.trim()) {
      setError('Please provide your full name and Member ID.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        fullName: fullName.trim(),
        memberId: memberId.trim(),
        auxiliary,
        jamaat: jamaat.trim(),
        dila: dilla.trim(),
      });
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell>
      <h2 className="text-center text-base font-bold text-slate-900 tracking-tight">Create account</h2>
      <p className="mt-1 text-center text-3xs text-slate-400">
        Register with your Member ID to join the workspace
      </p>

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <div>
          <label className={labelClass}>Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Bilal Farooq"
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Member ID</label>
            <input
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="e.g. ATF-60201"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Auxiliary</label>
            <select
              value={auxiliary}
              onChange={(e) => setAuxiliary(e.target.value as Auxiliary)}
              className={`${inputClass} cursor-pointer`}
            >
              {AUXILIARIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Jamaat</label>
            <input
              value={jamaat}
              onChange={(e) => setJamaat(e.target.value)}
              placeholder="e.g. Ilasamaja"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dilla</label>
            <input
              value={dilla}
              onChange={(e) => setDilla(e.target.value)}
              placeholder="e.g. Lagos"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              placeholder="Choose a password"
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
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-3xs text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitShell>
  );
}
