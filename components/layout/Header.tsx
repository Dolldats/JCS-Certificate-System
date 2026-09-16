'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const firstName = user?.fullName.split(' ')[0] || 'Admin';
  const roleLabel =
    user?.role === 'SUPER_ADMIN' ? 'Super Admin' : `${user?.assignedAuxiliary} Admin`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/certificates?q=${encodeURIComponent(q)}` : '/certificates');
  };

  return (
    <div className="px-4 sm:px-6 pt-4 shrink-0 z-30">
      <header className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/60 px-3 sm:px-5 py-2.5 flex items-center gap-2 sm:gap-3">
        {/* Mobile menu */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-xl">
          <div className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 focus-within:bg-slate-100 rounded-full px-4 py-2 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search certificates by serial #, name or event..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </form>

        <div className="flex-1" />

        {/* Auxiliary scope — right side */}
        <div className="relative shrink-0 hidden md:block">
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
              className="absolute left-0 mt-2 w-48 bg-white/85 backdrop-blur-xl rounded-xl shadow-xl border border-white/60 py-1.5 z-50 text-xs"
              onMouseLeave={() => setShowAuxMenu(false)}
            >
              <div className="px-3 py-1 text-3xs font-bold text-slate-400 uppercase tracking-wider">
                Filter Auxiliary View
              </div>
              {AUXILIARIES.map((aux) => (
                <button
                  key={aux}
                  onClick={() => {
                    setActiveAuxiliary(aux);
                    setShowAuxMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    activeAuxiliary === aux
                      ? 'text-emerald-700 font-bold bg-emerald-50/50'
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
          className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
        </Link>

        {/* Profile + logout */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowAuxMenu(false);
            }}
            className="flex items-center gap-2 p-1 sm:pr-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
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
              className="absolute right-0 mt-2 w-60 bg-white/85 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 py-2 z-50"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user?.fullName}</div>
                <div className="text-2xs text-slate-500 font-mono mt-0.5">
                  {user?.memberId}
                </div>
                <div className="text-3xs text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block font-medium">
                  {user?.role === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : `${user?.assignedAuxiliary} Admin`}
                  {user?.jamaat ? ` • ${user.jamaat}` : ''}
                </div>
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
