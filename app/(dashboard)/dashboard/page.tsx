'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { eventsApi, certificatesApi, auditApi } from '../../../services/api';
import { Event, Certificate, AuditLog, Auxiliary } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  CalendarDays,
  Users,
  Award,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../../lib/utils';

export default function DashboardPage() {
  const { user, activeAuxiliary } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
      const [allEvents, allCerts, logs] = await Promise.all([
        eventsApi.getAll(aux),
        certificatesApi.getAll(aux),
        auditApi.getLogs(aux),
      ]);
      setEvents(allEvents);
      setCertificates(allCerts);
      setAuditLogs(logs);
      setLoading(false);
    }
    loadData();
  }, [activeAuxiliary]);

  const totalParticipants = events.reduce((sum, e) => sum + e.participantsCount, 0);
  const totalVerified = events.reduce((sum, e) => sum + e.verifiedCount, 0);
  const totalCertificates = certificates.length;
  const activeEventsCount = events.filter((e) => e.status === 'Active' || e.status === 'Upcoming').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Award className="w-64 h-64 text-amber-400" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-600/60 px-2.5 py-1 rounded-full text-2xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {user?.role === 'SUPER_ADMIN'
                ? 'Central Headquarters Overview'
                : `${user?.assignedAuxiliary} Majlis Administration`}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Centralized certificate management system for Jama&apos;at events. Create events, verify participant Member IDs against central records, and customize print-ready certificates in the design studio.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link href="/events">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Event
              </Button>
            </Link>
            <Link href="/participants">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                leftIcon={<Users className="w-4 h-4" />}
              >
                Verify Members
              </Button>
            </Link>
            <Link href="/templates">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                leftIcon={<Award className="w-4 h-4" />}
              >
                Certificate Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider font-semibold text-slate-500">
                Active &amp; Total Events
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{events.length}</span>
                <span className="text-xs text-emerald-600 font-medium">
                  ({activeEventsCount} active)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider font-semibold text-slate-500">
                Verified Participants
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{totalVerified}</span>
                <span className="text-xs text-slate-500 font-medium">
                  / {totalParticipants} total
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider font-semibold text-slate-500">
                Certificates Issued
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {totalCertificates}
                </span>
                <span className="text-xs text-amber-600 font-medium">Printed/Ready</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider font-semibold text-slate-500">
                Member API Match Rate
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700">
                  {totalParticipants > 0
                    ? `${Math.round((totalVerified / totalParticipants) * 100)}%`
                    : '100%'}
                </span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Live
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Columns: Recent Events + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Auxiliary Events</CardTitle>
                <p className="text-xs text-slate-500">
                  {activeAuxiliary === 'All'
                    ? 'Across all 5 auxiliaries'
                    : `Filtered to ${activeAuxiliary}`}
                </p>
              </div>
              <Link href="/events">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {events.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No events found for this auxiliary.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {events.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {event.name}
                          </h4>
                          <Badge auxiliary={event.auxiliary} />
                          <Badge status={event.status} />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-slate-700">{event.venue}</span>
                          <span>&bull;</span>
                          <span>{formatDate(event.date)}</span>
                          <span>&bull;</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-3xs font-mono">
                            {event.orgLevel}: {event.orgUnitName}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right text-xs">
                          <div className="font-semibold text-slate-800">
                            {event.verifiedCount} / {event.participantsCount}
                          </div>
                          <div className="text-3xs text-slate-400">Verified</div>
                        </div>
                        <Link href={`/participants?eventId=${event.id}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Audit Activities (1 column) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Audit Trail</CardTitle>
                <p className="text-xs text-slate-500">Security &amp; Action Log</p>
              </div>
              <Link href="/audit">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Audit Log
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1"
                >
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                  <div className="flex items-center justify-between text-3xs text-slate-400 pt-1">
                    <span>By: {log.adminName}</span>
                    {log.auxiliary && <Badge auxiliary={log.auxiliary} />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
