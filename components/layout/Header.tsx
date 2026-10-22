'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Auxiliary } from '../../types';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const AUXILIARIES: (Auxiliary | 'All')[] = [
  'All',
  'Khuddam',
  'Ansarullah',
  'Lajna',
  'Nasra',
  'Atfal',
];

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, activeAuxiliary, setActiveAuxiliary, logout } = useAuth();
  const router = useRouter();
  const [showAuxMenu, setShowAuxMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompact, setIsCompact] = useState(false);

  // Mobile has no room for the long hint, so the placeholder is swapped for a short one.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const firstName = user?.fullName.split(' ')[0] || 'Admin';
  const roleLabel =
    user?.role === 'SUPER_ADMIN' ? 'Super Admin' : `${user?.assignedAuxiliary} Admin`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/certificates?q=${encodeURIComponent(q)}` : '/certificates');
  };

  // The sticky wrapper keeps the glass header visible while the dashboard main pane scrolls.
  return (
    <div className="sticky top-3 z-40 shrink-0 px-4 pt-3 sm:px-6 sm:pt-4">
      <header className="theme-header sticky top-3 z-40 flex flex-nowrap items-center gap-1.5 rounded-2xl px-2 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5">
        {/* Mobile menu */}
        <button
          onClick={onOpenMobileMenu}
          className="order-1 shrink-0 rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer sm:p-2 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="order-2 min-w-0 flex-1 sm:max-w-xl">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-1.5 transition-colors hover:bg-slate-100 focus-within:bg-slate-100 sm:gap-2 sm:px-4 sm:py-2">
            <Search className="w-4 h-4 shrink-0 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isCompact ? 'Search for any…' : 'Search certificates by serial #, name or event...'}
              className="w-full min-w-0 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:outline-none focus:ring-0"
            />
          </div>
        </form>

        {/* Notifications, theme, profile — grouped so they stay on one row */}
        <div className="order-3 ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* Auxiliary scope — sits directly beside the notification bell */}
          <div className="relative hidden shrink-0 md:block">
            {isSuperAdmin ? (
              <button
                onClick={() => {
                  setShowAuxMenu(!showAuxMenu);
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">{activeAuxiliary}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{user?.assignedAuxiliary}</span>
              </div>
            )}

            {showAuxMenu && isSuperAdmin && (
              <div
                className="dropdown-surface absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-1.5 z-50 text-xs"
                onMouseLeave={() => setShowAuxMenu(false)}
              >
                <div className="px-3 py-1 text-3xs font-bold text-slate-500 uppercase tracking-wider">
                  Filter Auxiliary View
                </div>
                {AUXILIARIES.map((aux) => (
                  <button
                    key={aux}
                    onClick={() => {
                      setActiveAuxiliary(aux);
                      setShowAuxMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-200/60 transition-colors cursor-pointer ${
                      activeAuxiliary === aux
                        ? 'text-emerald-800 font-bold bg-emerald-100'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>{aux === 'All' ? 'All 5 Auxiliaries' : aux}</span>
                    {activeAuxiliary === aux && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications → audit trail */}
          <Link
            href="/audit"
            title="Activity & notifications"
            className="relative shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:p-2.5"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full border border-white bg-rose-500 sm:right-2.5 sm:top-2" />
          </Link>

          <ThemeToggle />

          {/* Profile + logout */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowAuxMenu(false);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100 sm:pr-1"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 sm:h-9 sm:w-9 sm:text-sm">
                {firstName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{firstName}</div>
                <div className="text-3xs text-slate-400 leading-tight">{roleLabel}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div
                className="dropdown-surface absolute right-0 mt-2 w-60 rounded-2xl shadow-xl py-2 z-50"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-200/70">
                  <div className="text-xs font-bold text-slate-900">{user?.fullName}</div>
                  <div className="text-2xs text-slate-500 font-mono mt-0.5">
                    {user?.memberId}
                  </div>
                  <div className="text-3xs text-emerald-800 mt-1 bg-emerald-100 px-2 py-0.5 rounded-full inline-block font-medium">
                    {user?.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : `${user?.assignedAuxiliary} Admin`}
                    {user?.jamaat ? ` • ${user.jamaat}` : ''}
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-100/70 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
