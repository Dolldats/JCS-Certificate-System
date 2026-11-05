'use client';

import React from 'react';
import Link from 'next/link';
import { BadgeCheck, FileBadge, History } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AuthSplitShellProps {
  children: React.ReactNode;
  showMobileBrand?: boolean;
  wideForm?: boolean;
  variant?: 'default' | 'login';
}

const BULLETS = [
  { icon: BadgeCheck, text: 'Verify Member IDs effortlessly' },
  { icon: FileBadge, text: 'Issue and print certificates' },
  { icon: History, text: 'Audit every action' },
];

export function AuthSplitShell({
  children,
  showMobileBrand = true,
  wideForm = false,
  variant = 'default',
}: AuthSplitShellProps) {
  if (variant === 'login') {
    return (
      <main className="jcs-auth-page flex min-h-dvh items-center justify-center p-0 sm:p-6">
        <ThemeToggle className="jcs-auth-theme-toggle absolute right-4 top-4 z-50 sm:right-7 sm:top-7" />
        <div className="jcs-auth-frame grid w-full max-w-6xl grid-cols-1 overflow-hidden sm:rounded-[22px] lg:grid-cols-2">
          <section className="jcs-auth-brand relative hidden flex-col justify-between overflow-hidden px-6 py-6 text-white sm:px-10 lg:flex lg:px-10 lg:py-8">
            <div className="jcs-auth-pattern" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ahmadiyyah_logo.png" alt="" className="h-full w-full rounded-full object-contain" />
              </span>
              <span className="text-xs font-bold tracking-[0.18em]">JAMA&apos;AT CERTIFY</span>
            </div>

            <div className="relative z-10 mt-8 max-w-lg lg:mt-0">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-200/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-100">
                <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                A trusted space for Jama&apos;at events
              </p>
              <h1 className="max-w-md text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl md:text-[54px]">
                Welcome to Jama&apos;at Certify.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-emerald-50/75 sm:text-base sm:leading-7">
                Verify members, prepare beautiful certificates, and keep every event record in one dependable place.
              </p>
              <Link href="/" className="mt-7 inline-flex min-h-10 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
                Learn about the platform <span aria-hidden="true" className="ml-2">↗</span>
              </Link>
            </div>

            <p className="relative z-10 mt-8 text-[10px] text-emerald-100/55 lg:mt-0">
              © {new Date().getFullYear()} Jama&apos;at Certify. All rights reserved.
            </p>
          </section>

          <section className="jcs-auth-form-area relative flex items-center justify-center px-4 py-10 sm:px-8 lg:px-10">
            <div className={`w-full ${wideForm ? 'max-w-md' : 'max-w-sm'}`}>
              <div className="jcs-auth-form-card px-5 py-7 sm:px-8 sm:py-8">
                <div className="jcs-auth-mobile-brand mb-7 flex flex-col items-center text-center lg:hidden">
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/ahmadiyyah_logo.png" alt="" className="h-full w-full rounded-full object-contain" />
                  </span>
                  <span className="jcs-login-title mt-3 text-xs font-bold tracking-[0.16em]">JAMA&apos;AT CERTIFY</span>
                </div>
                {children}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="app-background grid min-h-dvh grid-cols-1 border-t-[3px] border-emerald-900 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0b2e23] to-slate-950 px-12 py-8 text-white lg:flex">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ahmadiyyah_logo.png" alt="Ahmadiyyah logo" className="h-full w-full rounded-full object-contain" />
          </div>
          <span className="text-xs font-bold tracking-[0.18em]">JAMA&apos;AT CERTIFY</span>
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ahmadiyyah_logo.png" alt="Ahmadiyyah logo" className="h-full w-full rounded-full object-contain" />
          </div>
          <h1 className="mt-8 max-w-sm text-[26px] font-bold leading-snug tracking-tight">
            Jama&apos;at Certificate Management System
          </h1>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-300/90">
            Verify members, issue certificates, and manage auxiliary templates all in one place.
          </p>

          <div className="mt-8 w-fit space-y-3.5">
            {BULLETS.map((bullet) => (
              <div key={bullet.text} className="flex items-center gap-3 text-left">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <bullet.icon aria-hidden="true" className="h-3.5 w-3.5 text-emerald-200" />
                </span>
                <span className="text-xs text-slate-200">{bullet.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-3xs text-slate-400">
          © {new Date().getFullYear()} Jama&apos;at Certify. All rights reserved.
        </p>
      </div>

      <div className="auth-form-area relative flex items-center justify-center px-4 py-16 sm:px-8 sm:py-10">
        <ThemeToggle className="absolute right-5 top-5 sm:right-8 sm:top-8" />
        <div className={`w-full ${wideForm ? 'max-w-md' : 'max-w-sm'}`}>
          {showMobileBrand && (
            <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
              <div className="theme-logo-tile flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border p-1 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ahmadiyyah_logo.png" alt="Ahmadiyyah logo" className="h-full w-full rounded-full object-contain" />
              </div>
              <span className="theme-text whitespace-nowrap text-[10px] font-bold leading-tight tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]">
                JAMA&apos;AT<span className="sm:hidden"><br /></span><span className="hidden sm:inline"> </span>CERTIFY
              </span>
            </div>
          )}

          <div className={wideForm ? '' : 'px-5 py-6 sm:px-8 sm:py-8'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
