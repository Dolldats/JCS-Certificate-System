'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Award,
  Palette,
  ShieldAlert,
  ClipboardList,
  LogOut,
  Sparkles,
} from 'lucide-react';
// Main brand logo — public/ahmadiyyah_logo.png

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Events',
      href: '/events',
      icon: CalendarDays,
    },
    {
      label: 'Participants',
      href: '/participants',
      icon: Users,
    },
    {
      label: 'Certificates',
      href: '/certificates',
      icon: Award,
    },
    {
      label: 'Certificate Studio',
      href: '/templates',
      icon: Palette,
    },
    ...(isSuperAdmin
      ? [
          {
            label: 'Admins & Access',
            href: '/admins',
            icon: ShieldAlert,
          },
        ]
      : []),
    {
      label: 'Audit Trail',
      href: '/audit',
      icon: ClipboardList,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full shrink-0 select-none border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0 overflow-hidden p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ahmadiyyah_logo.png"
            alt="Ahmadiyyah logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-white tracking-wide truncate">
              Jama&apos;at Certify
            </h1>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-3xs font-semibold px-1 py-0.5 rounded">
              v1.0
            </span>
          </div>
          <p className="text-2xs text-slate-400 truncate">Certificate System</p>
        </div>
      </div>

      {/* Auxiliary Status Pill */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-2xs text-slate-400 mb-1">
          <span>Scope</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {isSuperAdmin ? 'Super Admin' : user?.assignedAuxiliary || 'General'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate">
            {isSuperAdmin
              ? 'All 5 Auxiliaries Enabled'
              : `${user?.assignedAuxiliary} Majlis`}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-3xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-amber-300' : 'text-slate-400'
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Info & User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
          <div className="flex items-center gap-2 text-2xs text-amber-300 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jama&apos;at API Ready</span>
          </div>
          <p className="text-3xs text-slate-400 leading-relaxed">
            Member ID verifications check live against central records.
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </span>
          <span className="text-3xs text-slate-500 font-mono">Exit</span>
        </button>
      </div>
    </aside>
  );
}
