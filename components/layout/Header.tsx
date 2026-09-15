'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Auxiliary } from '../../types';
import { Menu, ChevronDown, UserCheck, Building2 } from 'lucide-react';

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
  const { user, activeAuxiliary, setActiveAuxiliary, switchUser, availableUsers } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuxMenu, setShowAuxMenu] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Left section: Mobile menu & Context display */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Auxiliary Filter or Fixed Badge */}
        <div className="relative">
          {isSuperAdmin ? (
            <button
              onClick={() => {
                setShowAuxMenu(!showAuxMenu);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auxiliary:</span>
              <span className="text-emerald-700 font-bold">{activeAuxiliary}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>{user?.assignedAuxiliary} Majlis</span>
            </div>
          )}

          {/* Auxiliary Dropdown */}
          {showAuxMenu && isSuperAdmin && (
            <div
              className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1"
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
                  <span>{aux === 'All' ? '🌐 All 5 Auxiliaries' : aux}</span>
                  {activeAuxiliary === aux && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Quick persona switcher + User profile */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowAuxMenu(false);
            }}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-amber-300 flex items-center justify-center font-bold text-xs">
              {user?.fullName.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.fullName}
              </div>
              <div className="text-3xs text-emerald-600 font-medium">
                {user?.role === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : `${user?.assignedAuxiliary} Admin`}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-3.5 pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user?.fullName}</div>
                <div className="text-2xs text-slate-500 font-mono mt-0.5">
                  ID: {user?.memberId} &bull; {user?.role}
                </div>
                <div className="text-3xs text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded inline-block font-medium">
                  {user?.jamaat}, {user?.dila}
                </div>
              </div>

              <div className="px-3 py-1.5 text-3xs font-bold text-slate-400 uppercase tracking-wider">
                Switch Active Persona (Demo)
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {availableUsers.map((u) => {
                  const isCurrent = u.id === user?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-emerald-50/60 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="text-xs text-slate-800 font-medium">
                          {u.fullName}
                        </div>
                        <div className="text-3xs text-slate-500">
                          {u.role === 'SUPER_ADMIN'
                            ? '⭐ Super Admin (HQ)'
                            : `${u.assignedAuxiliary} Admin`}
                        </div>
                      </div>
                      {isCurrent && <UserCheck className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
