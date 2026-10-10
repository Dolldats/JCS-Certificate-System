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
        'sidebar-surface flex flex-col h-full shrink-0 select-none border-r transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'border-b sidebar-divider',
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
              <h1 className="text-sm font-bold sidebar-heading tracking-wide truncate">
                Jama&apos;at Certify
              </h1>
            </div>
            <p className="text-2xs sidebar-muted truncate">Certificate System</p>
          </div>
        )}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg sidebar-muted hover:text-emerald-700 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <div className="px-3 pb-2 text-3xs font-semibold sidebar-muted uppercase tracking-wider">
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
                  : 'sidebar-link'
              )}
            >
              <Icon
                className={cn(
                  'shrink-0',
                  collapsed ? 'w-5 h-5' : 'w-4 h-4',
                  isActive ? 'text-white' : 'sidebar-icon'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
