'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation } from './certificateText';

interface EmeraldRibbonCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
}

function Blank({ value, width }: { value?: string; width: number }) {
  const filled = Boolean(value?.trim()) && !/^[_\s]+$/.test(value || '');
  return (
    <span
      className={`inline-block align-baseline border-b border-emerald-200/70 px-1 text-center leading-[1.55] ${
        filled ? 'font-semibold' : ''
      }`}
      style={{ minWidth: width, color: filled ? 'var(--certificate-name-color)' : undefined, borderBottom: filled ? 'none' : undefined }}
    >
      {filled ? value : '\u00a0'}
    </span>
  );
}

export function EmeraldRibbonCertificate({
  certificate,
  template,
}: EmeraldRibbonCertificateProps) {
  const name = certificate?.participantName || 'Participant Name';
  const venue = certificate?.venue;
  const dilla = certificate?.dila;
  const jamaat = certificate?.jamaat;
  const salutation = getSalutation(template);
  const award = (template.typeBadgeText || template.certificateType)
    .replace(/^certificate\s+of\s+/i, '')
    .trim();
  const primaryColor = template.primaryColor || '#12b981';
  const accentColor = template.accentColor || '#34e8ae';
  const organizationLogo: Record<string, string> = {
    'ansarullah-emblem': '/ansar.jpg',
    Ansarullah: '/ansar.jpg',
    'lajna-emblem': '/lajna_logo.png',
    Lajna: '/lajna_logo.png',
    'khuddam-emblem': '/MKAN-logo1.png',
    Khuddam: '/MKAN-logo1.png',
    'atfal-emblem': '/ahmadiyyah_logo.png',
    Atfal: '/ahmadiyyah_logo.png',
    'nasra-emblem': '/ahmadiyyah_logo.png',
    Nasra: '/ahmadiyyah_logo.png',
  };
  const logoSrc =
    template.logoUrl ||
    organizationLogo[template.logoType] ||
    organizationLogo[template.auxiliary || ''] ||
    '/ahmadiyyah_logo.png';
  const awardDate = template.signature1Date || certificate?.eventDate;

  return (
    <div
      id={`certificate-print-area-${certificate?.id ?? 'preview'}`}
      className="certificate-print-area certificate-emerald-ribbon relative h-full w-full overflow-hidden select-none text-white"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0a2920 0%, #031510 58%, #020d0a 100%)',
        '--certificate-name-color': accentColor,
      } as React.CSSProperties}
    >
      {/* The fine double frame and bright folded corner ribbons follow the reference. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 900 636"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {template.showTorusRings && (
          <g fill="none" stroke={accentColor} strokeOpacity=".14" strokeWidth="20">
            <circle cx="880" cy="64" r="88" />
            <circle cx="20" cy="572" r="88" />
          </g>
        )}
        <rect x="12" y="12" width="876" height="612" fill="none" stroke={primaryColor} strokeWidth="5" />
        <rect x="28" y="28" width="844" height="580" fill="none" stroke={accentColor} strokeOpacity=".55" strokeWidth="1.5" />
        <path d="M0 0h54l90 80-90 80H0l82-80L0 0Z" fill={accentColor} />
        <path d="M0 0h25l82 80-82 80H0l82-80L0 0Z" fill={primaryColor} />
        <path d="M900 636h-54l-90-80 90-80h54l-82 80 82 80Z" fill={accentColor} />
        <path d="M900 636h-25l-82-80 82-80h25l-82 80 82 80Z" fill={primaryColor} />
        <path d="M770 28h48v188h-8V36h-40zM82 600h-8V412h8z" fill={accentColor} opacity=".9" />
        <path d="M450 28v76" stroke={accentColor} strokeOpacity=".55" strokeWidth="1" />
      </svg>

      {template.showWaveWatermark && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
          viewBox="0 0 1000 707"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern id="emerald-ribbon-waves" width="100" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20Q25 5 50 20T100 20M0 25Q25 10 50 25T100 25" fill="none" stroke={accentColor} strokeWidth=".55" strokeOpacity=".22" />
            </pattern>
          </defs>
          <rect width="1000" height="707" fill="url(#emerald-ribbon-waves)" />
        </svg>
      )}

      {/* Auxiliary logo watermark: recolored to a soft monochrome mark over the dark field. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[56%] w-[40%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.08] brightness-0 invert"
      />

      {template.showRosetteBadge && (
        <div className="pointer-events-none absolute bottom-6 left-6 z-20 h-[74px] w-[74px] drop-shadow-lg">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="emerald-ribbon-seal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="100%" stopColor={primaryColor} />
              </linearGradient>
            </defs>
            <path d="m35 62-10 32 15-8 10 10 5-34Zm30 0 10 32-15-8-10 10-5-34Z" fill={primaryColor} />
            <path d="m50 10 8 10 13-2 2 13 12 6-5 12 7 11-11 8-1 13-13 1-7 11-12-6-12 6-7-11-13-1-1-13-11-8 7-11-5-12 12-6 2-13 13 2Z" fill="url(#emerald-ribbon-seal)" stroke="#d1fae5" strokeWidth="2" />
            <circle cx="50" cy="50" r="21" fill="#03251b" stroke="#d1fae5" strokeWidth="2" />
            <path d="m41 50 6 6 13-14" fill="none" stroke="#ecfdf5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {certificate?.certificateNumber ? (
        <p className="emerald-ribbon-serial absolute bottom-[78px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-wider text-emerald-100/65">
          Serial No. {certificate.certificateNumber}
        </p>
      ) : null}

      <div className="emerald-ribbon-content relative z-10 flex h-full flex-col items-center justify-between px-[8%] py-[5.5%] text-center">
        <header className="flex w-full shrink-0 items-center justify-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200/70 bg-white p-0.5 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Organization logo" className="h-full w-full rounded-full object-contain" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-emerald-100/90">
              {template.organizationName}
            </p>
            {template.organizationSubtitle ? (
              <p className="mt-0.5 text-[10px] tracking-wide text-emerald-100/65">{template.organizationSubtitle}</p>
            ) : null}
          </div>
        </header>

        <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-3">
          <p className="text-[29px] font-semibold uppercase tracking-[0.19em] leading-none text-white">
            Certificate
          </p>
          <p className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.3em] text-emerald-200">
            of {award}
          </p>

          <p className="mt-5 text-[11px] font-medium tracking-wide text-slate-200">
            This certificate is proudly presented to
          </p>
          <h1
            className="mt-1 font-serif text-[36px] italic leading-tight text-emerald-300"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: accentColor }}
          >
            {salutation} {name}
          </h1>
          <div className="mt-1.5 h-px w-32" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

          <p className="mt-4 max-w-[82%] text-[12px] leading-relaxed text-slate-200">
            This is to certify that {salutation}{' '}
            <Blank value={certificate?.participantName} width={120} />, from{' '}
            <Blank value={dilla} width={90} /> Dilla,{' '}
            <Blank value={jamaat} width={110} /> Jama&apos;at.
          </p>
          <p className="mt-1 max-w-[82%] text-[12px] leading-relaxed text-slate-200">
            Participated in the <Blank value={certificate?.eventName} width={180} /> which took place at{' '}
            <Blank value={venue} width={120} />.
          </p>
          {template.programDurationText ? (
            <p className="mt-1.5 text-[11px] tracking-wide text-emerald-100/75">
              {template.programDurationText}
            </p>
          ) : null}
          {certificate?.theme || template.themeTitle ? (
            <p className="mt-1 text-[12px] font-semibold tracking-wide text-emerald-300">
              {certificate?.theme || template.themeTitle}
            </p>
          ) : null}
          {template.bodyFocusText ? (
            <p className="mt-2 line-clamp-2 max-w-[72%] text-[10px] leading-relaxed text-emerald-50/75">
              {template.bodyFocusText}
            </p>
          ) : null}
        </main>

        <footer className="grid w-full shrink-0 grid-cols-3 items-end gap-6 text-[9px] text-emerald-100/75">
          <div className="text-center">
            {awardDate ? <p className="mb-1 text-[10px] text-white">{awardDate}</p> : null}
            <div className="mx-auto mb-1 h-px w-32 bg-emerald-200/70" />
            <span className="uppercase tracking-[0.2em]">Date</span>
          </div>
          <div aria-hidden="true" />
          <div className="text-center">
            <div className="mb-1 flex h-7 items-end justify-center">
              {template.signature1Image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={template.signature1Image} alt="Authorized signature" className="max-h-7 max-w-36 object-contain" />
              ) : template.signatureAssetPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={template.signatureAssetPath} alt="Authorized signature" className="max-h-7 max-w-36 object-contain" />
              ) : null}
            </div>
            <div className="mx-auto mb-1 h-px w-36 bg-emerald-200/70" />
            <p className="font-semibold text-white">{template.signature1Name}</p>
            <p className="uppercase tracking-[0.16em]">{template.signature1Title || 'Signature'}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
