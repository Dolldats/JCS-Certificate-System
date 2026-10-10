'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';

interface SageArchCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/** Underline blank — shows the value on a line, or an empty line in preview. */
function Blank({ value, width }: { value?: string; width: number }) {
  const filled = value && !/^[_\s]+$/.test(value);
  return (
    <span
      className={`inline-block border-b border-slate-500 leading-[1.5] px-1.5 text-center align-baseline ${
        filled ? 'font-semibold text-slate-900 border-slate-900' : ''
      }`}
      style={{ minWidth: width }}
    >
      {filled ? value : ' '}
    </span>
  );
}

/**
 * "Sage Arch" design (coded):
 * soft arch backdrop, left header, outline badge, airy modern body,
 * gold baseline rule with diamond.
 */
export function SageArchCertificate({
  certificate,
  template,
  previewMode = false,
}: SageArchCertificateProps) {
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

  const primaryColor = template.primaryColor || '#3f6212';
  const goldColor = template.accentColor || '#b45309';
  const bgColor = template.backgroundColor || '#ffffff';

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
      className="relative w-full h-full shadow-2xl rounded-sm overflow-hidden select-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* Soft arch backdrop */}
      <svg
        className="absolute inset-x-0 top-0 w-full h-full pointer-events-none"
        viewBox="0 0 900 637"
        preserveAspectRatio="none"
      >
        <path
          d="M130 637 V300 C130 160 260 60 450 60 C640 60 770 160 770 300 V637 Z"
          fill={primaryColor}
          opacity="0.10"
        />
        <path
          d="M130 637 V300 C130 160 260 60 450 60 C640 60 770 160 770 300 V637"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          opacity="0.45"
        />
        <circle cx="450" cy="60" r="5" fill={goldColor} />
      </svg>

      {/* Small seal (bottom left) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-8 left-10 w-[66px] h-[66px] pointer-events-none opacity-95 drop-shadow z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="archSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={goldColor} />
                <stop offset="100%" stopColor={primaryColor} />
              </linearGradient>
            </defs>
            <polygon points="35,62 25,96 40,88 50,96 45,62" fill={primaryColor} opacity="0.85" />
            <polygon points="65,62 55,96 65,88 75,96 60,62" fill={primaryColor} opacity="0.75" />
            <path
              d="M50 8 L55 15 L63 13 L65 21 L73 22 L72 30 L80 33 L75 40 L81 47 L73 51 L74 59 L66 60 L64 68 L56 66 L50 72 L44 66 L36 68 L34 60 L26 59 L27 51 L19 47 L25 40 L20 33 L28 30 L27 22 L35 21 L37 13 L45 15 Z"
              fill="url(#archSeal)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="42" r="14" fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="50" cy="42" r="8" fill="#ffffff" opacity="0.85" />
          </svg>
        </div>
      )}

      {/* ---------- Content ---------- */}
      <div className="relative z-10 h-full flex flex-col justify-between px-12 py-8">
        {/* Left header */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-10 h-10 rounded-full border-2 p-0.5 shrink-0 bg-white overflow-hidden flex items-center justify-center shadow-sm"
            style={{ borderColor: primaryColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-800 font-sans leading-tight">
              {template.organizationName}
            </h2>
            <p className="text-[10px] text-slate-500">{template.organizationSubtitle}</p>
          </div>
        </div>

        {/* Middle */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-2 overflow-hidden text-center">
          <span
            className="inline-block px-8 py-[5px] rounded-full text-[11.5px] font-bold tracking-[0.2em] uppercase whitespace-nowrap bg-white/70"
            style={{ border: `1.5px solid ${primaryColor}`, color: primaryColor }}
          >
            {template.typeBadgeText}
          </span>

          <h1
            className="text-[26px] font-black tracking-tight font-sans leading-[1.2] max-w-2xl"
            style={{ color: primaryColor }}
          >
            {eventName}
          </h1>

          <div className="w-full text-center text-[12px] leading-[1.95] text-slate-600 font-sans">
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
            <p className="text-[12px] text-slate-500 font-sans">
              {template.programDurationText}, with the
            </p>
            <p className="text-[16px] font-bold text-slate-900 font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[10.5px] text-slate-500 leading-relaxed font-sans max-w-xl mx-auto line-clamp-2">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer with gold baseline */}
        <div className="shrink-0">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="h-px flex-1 bg-slate-200" />
            <span
              className="w-1.5 h-1.5 rotate-45 shrink-0"
              style={{ backgroundColor: goldColor }}
            />
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-left">
              <div className="font-mono text-[9px] text-slate-400 tracking-wider">{certNumber}</div>
              <div className="text-[9px] text-slate-400">{template.signature1Date}</div>
            </div>
            <div className="w-52 text-center">
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
                      stroke="#334155"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M35 12 Q 55 35, 75 10 T 115 32"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <div className="w-full h-px bg-slate-400 mx-auto mb-1" />
              <div className="text-[11.5px] font-bold text-slate-900 leading-tight font-sans">
                {template.signature1Name}
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">
                {template.signature1Title}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
