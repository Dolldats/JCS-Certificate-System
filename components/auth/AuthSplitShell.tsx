'use client';

import React from 'react';
import { BadgeCheck, FileBadge, History } from 'lucide-react';

interface AuthSplitShellProps {
  children: React.ReactNode;
}

const BULLETS = [
  { icon: BadgeCheck, text: 'Verify Member IDs effortlessly' },
  { icon: FileBadge, text: 'Issue and print certificates' },
  { icon: History, text: 'Audit every action' },
];

export function AuthSplitShell({ children }: AuthSplitShellProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — dark brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0b2e23] to-slate-950 text-white px-12 py-8">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 overflow-hidden flex items-center justify-center shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ahmadiyyah_logo.png" alt="Ahmadiyyah logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-bold tracking-[0.18em]">JAMA&apos;AT CERTIFY</span>
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full bg-white border border-white/20 p-2 flex items-center justify-center shadow-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ahmadiyyah_logo.png" alt="Ahmadiyyah logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="mt-8 text-[26px] font-bold tracking-tight leading-snug max-w-sm">
            Jama&apos;at Certificate Management System
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-300/90 max-w-xs">
            Verify members, issue certificates, and manage auxiliary templates all in one place.
          </p>

          <div className="mt-8 space-y-3.5 w-fit">
            {BULLETS.map((b) => (
              <div key={b.text} className="flex items-center gap-3 text-left">
                <span className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <b.icon className="w-3.5 h-3.5 text-emerald-200" />
                </span>
                <span className="text-xs text-slate-200">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-3xs text-slate-400">
          © {new Date().getFullYear()} Jama&apos;at Certify. All rights reserved.
        </p>
      </div>

      {/* Right — light form side */}
      <div className="flex items-center justify-center bg-[#eef1f7] px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand row */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200/70 p-1 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ahmadiyyah_logo.png" alt="Ahmadiyyah logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold tracking-[0.18em] text-slate-800">JAMA&apos;AT CERTIFY</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 px-6 sm:px-8 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
