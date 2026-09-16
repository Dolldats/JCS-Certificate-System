'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';

interface HeritageGoldCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/** Underline blank — shows the value on a line, or an empty line in preview. */
function Blank({ value, width }: { value?: string; width: number }) {
  const filled = value && !/^[_\s]+$/.test(value);
  return (
    <span
      className={`inline-block border-b border-slate-800 leading-[1.5] px-1.5 text-center align-baseline ${
        filled ? 'font-bold text-black' : ''
      }`}
      style={{ minWidth: width }}
    >
      {filled ? value : ' '}
    </span>
  );
}

function CornerOrnament({ className, color }: { className: string; color: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`absolute w-9 h-9 pointer-events-none ${className}`}>
      <path d="M2 38 V14 Q2 2 14 2 H38" fill="none" stroke={color} strokeWidth="2" />
      <path d="M8 38 V18 Q8 8 18 8 H38" fill="none" stroke={color} strokeWidth="0.9" opacity="0.8" />
      <rect x="12" y="12" width="7" height="7" transform="rotate(45 15.5 15.5)" fill={color} />
      <circle cx="15.5" cy="15.5" r="1.4" fill="#ffffff" />
    </svg>
  );
}

/**
 * "Heritage Gold" design (coded):
 * cream canvas, double gold border with corner ornaments, stacked
 * centered header (emblem above name), ribbon-banner badge, gold seal.
 */
export function HeritageGoldCertificate({
  certificate,
  template,
  previewMode = false,
}: HeritageGoldCertificateProps) {
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
  const bgColor = template.backgroundColor || '#fffdf5';

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
      {/* Double gold border */}
      <div
        className="absolute inset-3 border-2 pointer-events-none"
        style={{ borderColor: goldColor }}
      />
      <div
        className="absolute inset-[18px] border pointer-events-none opacity-80"
        style={{ borderColor: goldColor }}
      />
      <CornerOrnament className="top-[22px] left-[22px]" color={goldColor} />
      <CornerOrnament className="top-[22px] right-[22px] -scale-x-100" color={goldColor} />
      <CornerOrnament className="bottom-[22px] left-[22px] -scale-y-100" color={goldColor} />
      <CornerOrnament
        className="bottom-[22px] right-[22px] -scale-x-100 -scale-y-100"
        color={goldColor}
      />

      {/* Gold rosette seal (bottom left, inside border) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-10 left-10 w-[72px] h-[72px] pointer-events-none drop-shadow-lg z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="heritageSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f6e27a" />
                <stop offset="45%" stopColor={goldColor} />
                <stop offset="100%" stopColor="#8a6d1b" />
              </linearGradient>
            </defs>
            <polygon points="35,62 25,96 40,88 50,96 45,62" fill="#b8912a" />
            <polygon points="65,62 55,96 65,88 75,96 60,62" fill="#a07f22" />
            <path
              d="M50 8 L55 15 L63 13 L65 21 L73 22 L72 30 L80 33 L75 40 L81 47 L73 51 L74 59 L66 60 L64 68 L56 66 L50 72 L44 66 L36 68 L34 60 L26 59 L27 51 L19 47 L25 40 L20 33 L28 30 L27 22 L35 21 L37 13 L45 15 Z"
              fill="url(#heritageSeal)"
              stroke="#fff7d6"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="42" r="19" fill="none" stroke="#7a5f16" strokeWidth="1.3" />
            <circle cx="50" cy="42" r="11" fill={primaryColor} opacity="0.9" />
            <path
              d="M45 42 L48.5 45.5 L55 38"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* ---------- Content ---------- */}
      <div className="relative z-10 h-full flex flex-col justify-between px-16 pt-10 pb-9 text-center">
        {/* Stacked centered header: emblem above name */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="w-11 h-11 rounded-full border-[3px] p-0.5 bg-white overflow-hidden flex items-center justify-center shadow-sm"
            style={{ borderColor: goldColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h2 className="mt-1.5 text-[13.5px] font-black tracking-[0.08em] uppercase text-black font-sans leading-tight">
            {template.organizationName}
          </h2>
          <p className="text-[10px] text-slate-600 font-medium">
            {template.organizationSubtitle}
          </p>
          {/* Gold divider */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-px w-24" style={{ backgroundColor: goldColor }} />
            <span
              className="w-1.5 h-1.5 rotate-45 shrink-0"
              style={{ backgroundColor: goldColor }}
            />
            <span className="h-px w-24" style={{ backgroundColor: goldColor }} />
          </div>
        </div>

        {/* Middle */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-1.5 overflow-hidden">
          <h1
            className="text-[24px] font-black uppercase tracking-tight font-sans leading-[1.2]"
            style={{ color: primaryColor }}
          >
            {eventName}
          </h1>

          {/* Ribbon banner badge with notched ends */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 40 26" className="w-9 h-6 shrink-0 -mr-1">
              <polygon points="40,4 8,4 0,13 8,22 40,22" fill={primaryColor} opacity="0.82" />
              <polygon points="40,4 8,4 0,13 8,22 40,22" fill="none" stroke={goldColor} strokeWidth="1" />
            </svg>
            <span
              className="inline-block px-7 py-[5px] text-[12px] font-bold tracking-[0.12em] text-white uppercase whitespace-nowrap shadow-sm z-10"
              style={{
                backgroundColor: primaryColor,
                borderTop: `1.5px solid ${goldColor}`,
                borderBottom: `1.5px solid ${goldColor}`,
              }}
            >
              {template.typeBadgeText}
            </span>
            <svg viewBox="0 0 40 26" className="w-9 h-6 shrink-0 -ml-1 -scale-x-100">
              <polygon points="40,4 8,4 0,13 8,22 40,22" fill={primaryColor} opacity="0.82" />
              <polygon points="40,4 8,4 0,13 8,22 40,22" fill="none" stroke={goldColor} strokeWidth="1" />
            </svg>
          </div>

          {/* Body lines with underline blanks */}
          <div className="w-full text-center text-[11.5px] leading-[1.95] text-slate-900 font-sans">
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
            <p className="text-[12.5px] font-bold text-black font-sans">
              {template.programDurationText}, with the
            </p>
            <p className="text-[15px] font-black text-black font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[10.5px] text-slate-700 leading-snug font-sans max-w-2xl mx-auto line-clamp-2">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between shrink-0">
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
