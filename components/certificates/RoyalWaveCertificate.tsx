'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';

interface RoyalWaveCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/** Underline blank — shows the value on a line, or an empty line in preview. */
function Blank({ value, width }: { value?: string; width: number }) {
  const filled = value && !/^[_\s]+$/.test(value);
  return (
    <span
      className={`inline-block border-b border-slate-900 leading-[1.5] px-1.5 text-center align-baseline ${
        filled ? 'font-bold text-black' : ''
      }`}
      style={{ minWidth: width }}
    >
      {filled ? value : ' '}
    </span>
  );
}

/**
 * "Royal Gold Wave" design — uses the user's framed artwork
 * (public/certificate-design1.png) as a full-bleed background
 * with live, editable text laid on top.
 */
export function RoyalWaveCertificate({
  certificate,
  template,
  previewMode = false,
}: RoyalWaveCertificateProps) {
  const participantName = certificate?.participantName || undefined;
  const dilla = certificate?.dila || undefined;
  const jamaat = certificate?.jamaat || undefined;
  const muqami =
    (certificate as unknown as { muqami?: string })?.muqami || certificate?.ilaqa || undefined;
  const venue = certificate?.venue || undefined;

  const durationParts = (template.programDurationText || '').split(/\s+to\s+/i);
  const fromPlace =
    (certificate as unknown as { fromPlace?: string })?.fromPlace ||
    (durationParts.length > 1 ? durationParts[0].trim() : undefined);
  const toPlace =
    (certificate as unknown as { toPlace?: string })?.toPlace ||
    (durationParts.length > 1 ? durationParts.slice(1).join(' to ').trim() : undefined);

  const AUX_SALUTATION: Record<string, string> = {
    Atfal: 'Tifl',
    Khuddam: 'Khadim',
    Ansarullah: 'Nasir',
    Lajna: 'Lajna member',
    Nasra: 'Nasirah',
    'atfal-emblem': 'Tifl',
    'khuddam-emblem': 'Khadim',
    'ansarullah-emblem': 'Nasir',
    'lajna-emblem': 'Lajna member',
    'nasra-emblem': 'Nasirah',
  };
  const salutation =
    AUX_SALUTATION[template.auxiliary as string] || AUX_SALUTATION[template.logoType] || 'Tifl';

  const eventName = certificate?.eventName || template.eventTitle;
  const theme = certificate?.theme || template.themeTitle;
  const certNumber =
    certificate?.certificateNumber || (previewMode ? 'JCS-ATF-2025-0001' : 'JCS-VERIFIED');

  const primaryColor = template.primaryColor || '#0b5c2e';
  const goldColor = template.accentColor || '#c9a227';
  const frameSrc = '/certificate-design1.png';

  const AUXILIARY_LOGO_SRC: Record<string, string> = {
    'ansarullah-emblem': '/ansar.jpg',
    Ansarullah: '/ansar.jpg',
    'lajna-emblem': '/lajna_logo.png',
    Lajna: '/lajna_logo.png',
    'khuddam-emblem': '/MKAN-logo1.png',
    Khuddam: '/MKAN-logo1.png',
  };
  const emblemSrc =
    template.logoUrl ||
    AUXILIARY_LOGO_SRC[template.logoType] ||
    AUXILIARY_LOGO_SRC[template.auxiliary as string] ||
    '/ahmadiyyah_logo.png';
  const emblemAlt = template.logoUrl
    ? 'Organization logo'
    : template.auxiliary
      ? `${template.auxiliary} logo`
      : 'Ahmadiyyah logo';

  return (
    <div
      id="certificate-print-area"
      className="relative w-full h-full bg-white shadow-2xl rounded-sm overflow-hidden select-none"
    >
      {/* Framed artwork background (waves + gold seal baked in) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frameSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ---------- Live text content on top of the frame ---------- */}
      <div className="relative z-10 h-full flex flex-col justify-between px-16 pt-10 pb-14 text-center">
        {/* Centered header */}
        <div className="flex items-center justify-center gap-3 shrink-0">
          <div
            className="w-11 h-11 rounded-full border-[3px] p-0.5 shrink-0 bg-white overflow-hidden flex items-center justify-center"
            style={{ borderColor: primaryColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="text-left">
            <h2 className="text-[15px] font-black tracking-wide uppercase text-black font-sans leading-tight">
              {template.organizationName}
            </h2>
            <p className="text-[10.5px] text-slate-700 font-medium">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Middle */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-2 overflow-hidden">
          <h1
            className="text-[25px] font-black uppercase tracking-tight font-sans leading-[1.2]"
            style={{ color: primaryColor }}
          >
            {eventName}
          </h1>

          {/* Badge pill matching the gold/green frame */}
          <div className="inline-block pb-0.5">
            <span
              className="inline-block px-8 py-[5px] rounded text-[12.5px] font-bold tracking-[0.12em] text-white uppercase whitespace-nowrap shadow-sm"
              style={{
                backgroundColor: primaryColor,
                border: `1.5px solid ${goldColor}`,
              }}
            >
              {template.typeBadgeText}
            </span>
          </div>

          {/* Body lines with underline blanks */}
          <div className="w-full text-center text-[12px] leading-[2] text-slate-900 font-sans">
            <p>
              This is to congratulate and certify that {salutation}{' '}
              <Blank value={participantName} width={130} />, Dilla{' '}
              <Blank value={dilla} width={90} />, Ilaqa.
            </p>
            <p>
              from <Blank value={jamaat} width={150} /> Muqami,{' '}
              <Blank value={muqami} width={130} />.
            </p>
            <p>Participated in a week Islamic Vacation Course which took place</p>
            <p>
              at <Blank value={venue} width={130} /> from{' '}
              <Blank value={fromPlace} width={105} /> to <Blank value={toPlace} width={130} />.
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[13px] font-bold text-black font-sans">
              {template.programDurationText}, with the
            </p>
            <p className="text-[16px] font-black text-black font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[11px] text-slate-800 leading-snug font-sans max-w-2xl mx-auto line-clamp-3">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between shrink-0">
          {/* Spacer — the frame's gold seal sits bottom-left */}
          <div className="w-24 shrink-0" />
          <div className="flex-1 text-center px-4">
            <div className="font-mono text-[9px] text-slate-400 tracking-wider">{certNumber}</div>
          </div>
          <div className="w-56 text-center">
            <div className="h-8 flex items-end justify-center mb-0.5">
              {template.signature1Image ? (
                <img
                  src={template.signature1Image}
                  alt="Official Signature"
                  className="max-h-8 max-w-[140px] object-contain"
                  style={{ filter: 'contrast(1.1)' }}
                />
              ) : (
                <svg viewBox="0 0 180 40" className="w-32 h-8 overflow-visible">
                  <path
                    d="M10 28 Q 25 5, 45 22 T 80 18 T 120 28 Q 140 12, 160 25"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M35 12 Q 55 35, 75 10 T 115 32"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M95 18 L 140 38"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <div className="w-full h-px bg-slate-900 mx-auto mb-1" />
            <div className="text-[12px] font-bold text-slate-900 leading-tight font-sans">
              {template.signature1Name}
            </div>
            <div className="text-[9.5px] font-medium text-slate-600 leading-tight">
              {template.signature1Title}
            </div>
            <div className="text-[9.5px] text-slate-500 font-medium mt-0.5">
              {template.signature1Date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
