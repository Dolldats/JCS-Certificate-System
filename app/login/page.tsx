'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser, availableUsers } = useAuth();
  const [memberId, setMemberId] = useState('ATF-60201');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-white p-1 shadow-xl shadow-emerald-950/60 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ahmadiyyah_logo.png"
            alt="Ahmadiyyah logo"
            className="w-full h-full object-contain"
          />
        </div>

        <h2 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Jama&apos;at Certify
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-emerald-200/80 font-medium">
          Centralized Certificate Management System for Auxiliaries
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-100/90 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Member ID (Jama'at API Credentials)"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="e.g. ATF-60201 or MK-10293"
              required
            />

            <Input
              label="Password / Token"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-emerald-700 font-semibold cursor-pointer hover:underline">
                Reset token?
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In with Jama&apos;at SSO
            </Button>
          </form>

          {/* Quick Demo Personas */}
          <div className="relative border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Personas (One-Click)
              </span>
            </div>

            <div className="space-y-2">
              {availableUsers.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 font-bold flex items-center justify-center text-3xs transition-colors">
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-900">
                        {u.fullName}
                      </div>
                      <div className="text-3xs text-slate-500">
                        {u.role === 'SUPER_ADMIN'
                          ? 'Super Admin (All Auxiliaries)'
                          : `${u.assignedAuxiliary} General Admin`}
                      </div>
                    </div>
                  </div>
                  <span className="text-3xs font-mono bg-slate-100 group-hover:bg-emerald-200/60 px-2 py-0.5 rounded text-slate-600 group-hover:text-emerald-900">
                    {u.memberId}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-3xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured with Jama&apos;at Central Identity &amp; JWT Verification</span>
        </div>
      </div>
    </div>
  );
}
