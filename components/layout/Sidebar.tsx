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
  Sparkles,
  PanelLeftClose,
} from 'lucide-react';
// Main brand logo — public/ahmadiyyah_logo.png

interface SidebarProps {
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onCloseMobile, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

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
    <aside
      className={cn(
        'bg-slate-900/80 backdrop-blur-xl text-slate-100 flex flex-col h-full shrink-0 select-none border-r border-white/10 shadow-2xl shadow-slate-900/20 transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'border-b border-white/10',
          collapsed ? 'p-3 flex flex-col items-center gap-2' : 'p-5 flex items-center gap-3'
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Open sidebar"
            aria-label="Open sidebar"
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-emerald-900/30 overflow-hidden p-1 hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ahmadiyyah_logo.png"
              alt="Open sidebar"
              className="w-full h-full object-contain"
            />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0 overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ahmadiyyah_logo.png"
              alt="Ahmadiyyah logo"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        {!collapsed && (
          <div className="overflow-hidden flex-1">
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
        )}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <div className="px-3 pb-2 text-3xs font-semibold text-slate-400 uppercase tracking-wider">
            Menus
          </div>
        )}
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
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg text-xs font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'shrink-0',
                  collapsed ? 'w-5 h-5' : 'w-4 h-4',
                  isActive ? 'text-amber-300' : 'text-slate-400'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Quick Info Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-3">
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-2xs text-amber-300 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jama&apos;at API Ready</span>
            </div>
            <p className="text-3xs text-slate-400 leading-relaxed">
              Member ID verifications check live against central records.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
