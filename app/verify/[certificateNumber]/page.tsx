'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Award, BadgeCheck, CalendarDays, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';
import { certificatesApi } from '../../../services/api';

type RecordValue = Record<string, unknown>;
type VerificationState = 'loading' | 'valid' | 'invalid' | 'unknown' | 'error';

function asRecord(value: unknown): RecordValue | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function firstString(record: RecordValue, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function readVerification(record: RecordValue | null): VerificationState {
  if (!record) return 'invalid';

  const explicitValidity = record.isValid ?? record.valid;
  if (typeof explicitValidity === 'boolean') return explicitValidity ? 'valid' : 'invalid';

  const status = firstString(record, 'status', 'authenticity', 'message')?.toLowerCase();
  if (!status) return 'unknown';
  if (/revok|invalid|not found|expired|fraud|false/.test(status)) return 'invalid';
  if (/authentic|valid|issued|generated|verified|genuine/.test(status)) return 'valid';
  return 'unknown';
}

export default function CertificateVerificationPage() {
  const params = useParams<{ certificateNumber: string }>();
  const certificateNumber = params.certificateNumber || '';
  const [state, setState] = useState<VerificationState>('loading');
  const [certificate, setCertificate] = useState<RecordValue | null>(null);

  useEffect(() => {
    let active = true;
    setState('loading');
    setCertificate(null);

    certificatesApi
      .verifyByNumber(certificateNumber)
      .then((result) => {
        if (!active) return;
        const envelope = asRecord(result);
        const data = asRecord(envelope?.certificate) ?? asRecord(envelope?.data) ?? envelope;
        setCertificate(data);
        const envelopeState = readVerification(envelope);
        setState(envelopeState === 'unknown' ? readVerification(data) : envelopeState);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const status = asRecord(error)?.status;
        setState(status === 404 ? 'invalid' : 'error');
      });

    return () => {
      active = false;
    };
  }, [certificateNumber]);

  const participantName = certificate && firstString(certificate, 'participantName', 'fullName', 'name');
  const eventName = certificate && firstString(certificate, 'eventName', 'eventTitle');
  const certificateType = certificate && firstString(certificate, 'certificateType', 'type');
  const auxiliary = certificate && firstString(certificate, 'auxiliary');
  const venue = certificate && firstString(certificate, 'venue', 'location');
  const eventDate = certificate && formatDate(firstString(certificate, 'eventDate', 'date'));
  const issuedDate = certificate && formatDate(firstString(certificate, 'issuedAt', 'issueDate', 'issuedDate'));
  const statusLabel = {
    loading: 'Checking certificate',
    valid: 'Certificate is authentic',
    invalid: 'Certificate is not valid',
    unknown: 'Verification status unavailable',
    error: 'Could not verify certificate',
  }[state];

  const statusStyle = {
    loading: 'border-slate-200 bg-slate-50 text-slate-700',
    valid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    invalid: 'border-rose-200 bg-rose-50 text-rose-800',
    unknown: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-amber-200 bg-amber-50 text-amber-900',
  }[state];

  const StatusIcon = state === 'valid' ? ShieldCheck : state === 'invalid' ? ShieldAlert : BadgeCheck;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f5ed,_#f5f8f6_55%,_#eef2ef)] px-4 py-10 text-slate-900 sm:px-6">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_80px_-35px_rgba(15,75,45,0.35)]">
        <div className="h-2 bg-gradient-to-r from-emerald-800 via-emerald-600 to-lime-400" />
        <div className="p-6 sm:p-10">
          <header className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Award aria-hidden="true" size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Jama&apos;at Certificate System</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight">Certificate verification</h1>
            </div>
          </header>

          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${statusStyle}`} role="status" aria-live="polite">
            <StatusIcon aria-hidden="true" size={22} />
            <div>
              <p className="font-semibold">{statusLabel}</p>
              <p className="mt-0.5 text-sm opacity-80">
                {state === 'valid'
                  ? 'This certificate number was confirmed by the issuing system.'
                  : state === 'invalid'
                    ? 'It may have been revoked, is invalid, or could not be found.'
                    : state === 'error'
                      ? 'The verification service could not be reached. Please try again later.'
                      : state === 'unknown'
                        ? 'The issuing system did not return a clear verification result.'
                        : 'Contacting the issuing system…'}
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Certificate number</p>
            <p className="mt-2 break-all font-mono text-base font-bold text-slate-900 sm:text-lg">{certificateNumber}</p>
          </div>

          {certificate && (participantName || eventName || certificateType || auxiliary || venue || eventDate || issuedDate) && (
            <div className="mt-7">
              <h2 className="text-sm font-semibold text-slate-900">Certificate details</h2>
              <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
                {participantName && <Detail label="Awarded to" value={participantName} />}
                {eventName && <Detail label="Event" value={eventName} />}
                {certificateType && <Detail label="Certificate type" value={certificateType} />}
                {auxiliary && <Detail label="Auxiliary" value={auxiliary} />}
                {eventDate && <Detail label="Event date" value={eventDate} icon={<CalendarDays size={15} />} />}
                {venue && <Detail label="Venue" value={venue} icon={<MapPin size={15} />} />}
                {issuedDate && <Detail label="Date issued" value={issuedDate} />}
              </dl>
            </div>
          )}

          <footer className="mt-8 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
            <BadgeCheck className="mt-0.5 shrink-0 text-emerald-700" size={16} aria-hidden="true" />
            <p>Verification is checked against the issuing system. A certificate is only marked authentic when the service confirms it.</p>
          </footer>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="flex items-center gap-2 text-sm text-slate-500">
        {icon && <span className="text-emerald-700" aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
