'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, CalendarDays, Eye, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Button } from '../../components/ui/Button';
import { PieChart } from '../../components/ui/PieChart';
import { certificatesApi, cleanTheme, eventsApi, participantsApi, templatesApi } from '../../services/api';
import { Certificate, CertificateTemplate } from '../../types';
import { CertificatePreview } from '../../components/certificates/CertificatePreview';
import { Modal } from '../../components/ui/Modal';

interface MemberEvent {
  eventId: string;
  eventName: string;
  eventDate?: string;
  status: string;
  certificateIssued: boolean;
  certificateNumber?: string;
  certificateStatus?: string;
  certificateId?: string;
}

function toMemberEvents(value: unknown): MemberEvent[] {
  // Login returns loosely typed event records; normalize only fields this page displays.
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const eventName = typeof record.eventName === 'string' ? record.eventName : 'Event';
    return [{
      eventId: typeof record.eventId === 'string' ? record.eventId : '',
      eventName,
      eventDate: typeof record.eventDate === 'string' ? record.eventDate : undefined,
      status: typeof record.status === 'string' ? record.status : 'Registered',
      certificateIssued: record.certificateIssued === true,
      certificateNumber: typeof record.certificateNumber === 'string' ? record.certificateNumber : undefined,
      certificateStatus: typeof record.certificateStatus === 'string' ? record.certificateStatus : undefined,
      certificateId: typeof record.certificateId === 'string' ? record.certificateId : undefined,
    }];
  });
}

function formatEventDate(value?: string): string {
  if (!value) return 'Date not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not available';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export default function MemberPage() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const [openingCertificateId, setOpeningCertificateId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'MEMBER') {
      router.replace('/dashboard');
      return;
    }

    let cancelled = false;
    const loadMemberRecords = async () => {
      try {
        const [participations, certificates, memberEvents] = await Promise.all([
          participantsApi.getMy(),
          certificatesApi.getMy(),
          eventsApi.getAll(),
        ]);
        if (cancelled) return;

        const eventsById = new Map(memberEvents.map((event) => [event.id, event]));
        const certificatesByEvent = new Map(certificates.map((certificate) => [
          String(certificate.eventId ?? ''),
          certificate,
        ]));
        setEvents(participations.map((participation) => {
          const event = eventsById.get(participation.eventId);
          const certificate = certificatesByEvent.get(participation.eventId);
          const certificateStatus = typeof certificate?.status === 'string' ? certificate.status : undefined;
          return {
            eventId: participation.eventId,
            eventName: event?.name || 'Event',
            eventDate: event?.date,
            status: participation.verificationStatus,
            certificateIssued: Boolean(certificate && certificateStatus !== 'Revoked'),
            certificateNumber: typeof certificate?.certificateNumber === 'string' ? certificate.certificateNumber : undefined,
            certificateStatus,
            certificateId: typeof certificate?.id === 'string' ? certificate.id : undefined,
          };
        }));
      } catch {
        // Keep the login response as a graceful fallback if a member endpoint is unavailable.
        try {
          const stored = sessionStorage.getItem('jcs_member_events');
          if (!cancelled) setEvents(stored ? toMemberEvents(JSON.parse(stored)) : []);
        } catch {
          if (!cancelled) setEvents([]);
        }
      }
    };

    void loadMemberRecords();
    return () => { cancelled = true; };
  }, [isLoading, router, user]);

  const viewCertificate = async (certificateId: string) => {
    setOpeningCertificateId(certificateId);
    try {
      const certificate = await certificatesApi.getById(certificateId);
      const templates = await templatesApi.getAll(user?.assignedAuxiliary);
      const template = templates.find((item) => item.id === certificate.templateId) || templates[0];
      if (!template) throw new Error('No certificate template is available to preview.');

      // The event is the source of truth for its own facts: venue, theme
      // and dates always follow the current event record.
      let eventVenue = '';
      let eventTheme = '';
      let eventRange = '';
      try {
        const evt = await eventsApi.getById(certificate.eventId);
        eventVenue = evt?.venue || '';
        eventTheme = evt?.theme || '';
        if (evt) {
          eventRange =
            evt.endDate && evt.endDate !== evt.date ? `${evt.date} to ${evt.endDate}` : evt.date;
        }
      } catch {
        // leave blank — the preview still renders
      }

      // The authenticated profile comes from the member endpoint and can fill
      // missing legacy participant fields in the print preview.
      setPreviewCertificate({
        ...certificate,
        venue: eventVenue || certificate.venue,
        theme: cleanTheme(eventTheme || certificate.theme),
        eventDate: eventRange || certificate.eventDate,
        participantName: certificate.participantName || user?.fullName || '',
        memberId: certificate.memberId || user?.memberId || '',
        dila: certificate.dila || user?.dila || '',
        jamaat: certificate.jamaat || user?.jamaat || '',
      });
      setPreviewTemplate(template);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open this certificate.');
    } finally {
      setOpeningCertificateId(null);
    }
  };

  if (isLoading || !user || user.role !== 'MEMBER') {
    return (
      <main className="app-background min-h-screen grid place-items-center px-6">
        <p className="text-sm text-slate-500">Loading your member portal…</p>
      </main>
    );
  }

  const certificateCount = events.filter((event) => event.certificateIssued).length;
  const awaitingCertificateCount = events.length - certificateCount;
  const certificatePercentage = events.length > 0
    ? Math.round((certificateCount / events.length) * 100)
    : 0;
  const awaitingPercentage = events.length > 0 ? 100 - certificatePercentage : 0;

  return (
    <main className="app-background min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-8 print:hidden">
        <header className="theme-header sticky top-3 z-40 flex items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-700 text-white">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Jama&apos;at Certify</p>
              <h1 className="text-lg font-bold text-slate-900">Member Portal</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
              Sign out
            </Button>
          </div>
        </header>

        <section className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 text-white shadow-lg sm:px-10 sm:py-11">
          <p className="text-sm font-medium text-emerald-100">Welcome</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{user.fullName}</h2>
          <p className="mt-3 text-sm text-emerald-100">Member ID: <span className="font-mono font-semibold text-white">{user.memberId}</span></p>
        </section>

        <section className="surface-card rounded-2xl p-5 sm:p-7">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Event &amp; certificate progress</h2>
              <p className="mt-1 text-sm text-slate-500">
                Certificate coverage across your {events.length} {events.length === 1 ? 'event' : 'events'}.
              </p>
              <div className="mt-6 space-y-4" aria-label="Chart values">
                <div className="flex items-center justify-between gap-5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-3 w-3 rounded-full bg-emerald-700" aria-hidden="true" />
                    Certificates issued
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{certificateCount} <span className="text-slate-500">({certificatePercentage}%)</span></span>
                </div>
                <div className="flex items-center justify-between gap-5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-3 w-3 rounded-full bg-amber-600" aria-hidden="true" />
                    Awaiting certificate
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{awaitingCertificateCount} <span className="text-slate-500">({awaitingPercentage}%)</span></span>
                </div>
              </div>
              {events.length === 0 && (
                <p className="mt-5 text-xs text-slate-500">Your chart will update when event participation is recorded.</p>
              )}
            </div>

            <div className="flex justify-center md:pr-6">
              <PieChart
                percentage={certificatePercentage}
                label={`Certificate progress: ${certificateCount} issued, ${awaitingCertificateCount} awaiting, out of ${events.length} events.`}
                size={224}
                remainderColor="#d97706"
                donut
              >
                <span className="text-3xl font-bold leading-none text-slate-900">{events.length}</span>
                <span className="mt-1 text-xs font-medium text-slate-500">Total events</span>
              </PieChart>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My events and certificates</h2>
            <p className="mt-1 text-sm text-slate-500">Your event participation and certificate status from Jama&apos;at Certify.</p>
          </div>

          {events.length === 0 ? (
            <div className="surface-card rounded-2xl px-6 py-12 text-center">
              <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">No event participation found</p>
              <p className="mt-1 text-sm text-slate-500">Your events and certificates will appear here when they are available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <article key={`${event.eventName}-${index}`} className="surface-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays className="h-5 w-5" /></span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{event.eventName}</h3>
                      <p className="mt-1 text-sm text-slate-500">{formatEventDate(event.eventDate)}</p>
                      <p className="mt-2 text-xs text-slate-600">Participation: <span className="font-semibold">{event.status}</span></p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 sm:min-w-56">
                    {event.certificateIssued ? (
                      <>
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><ShieldCheck className="h-4 w-4" /> Certificate issued</p>
                        {event.certificateNumber && <p className="mt-1 font-mono text-xs text-slate-600">{event.certificateNumber}</p>}
                        {event.certificateStatus && <p className="mt-1 text-xs text-slate-500">Status: {event.certificateStatus}</p>}
                        {event.certificateId && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <button
                              type="button"
                              onClick={() => void viewCertificate(event.certificateId!)}
                              disabled={openingCertificateId === event.certificateId}
                              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:cursor-wait disabled:opacity-60"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {openingCertificateId === event.certificateId ? 'Opening…' : 'Preview'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : <p className="text-sm text-slate-500">No certificate issued yet</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <Modal
        isOpen={Boolean(previewCertificate && previewTemplate)}
        onClose={() => {
          setPreviewCertificate(null);
          setPreviewTemplate(null);
        }}
        title="Certificate Preview"
        description={previewCertificate?.certificateNumber || 'View and print your certificate'}
        maxWidth="5xl"
      >
        {previewCertificate && previewTemplate && (
          <CertificatePreview
            certificate={previewCertificate}
            template={previewTemplate}
            showActions
          />
        )}
      </Modal>
    </main>
  );
}
