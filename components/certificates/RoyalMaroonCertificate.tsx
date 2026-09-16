'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation, getRegionLabel } from './certificateText';

interface RoyalMaroonCertificateProps {
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

/**
 * "Royal Maroon" design (coded):
 * maroon/gold top & bottom strips, medallion emblem header,
 * formal centered layout, maroon badge pill, matching seal.
 */
export function RoyalMaroonCertificate({
  certificate,
  template,
  previewMode = false,
}: RoyalMaroonCertificateProps) {
  const participantName = certificate?.participantName || undefined;
  const dilla = certificate?.dila || undefined;
  const jamaat = certificate?.jamaat || undefined;
  const ilaqa = certificate?.ilaqa || undefined;
  const venue = certificate?.venue || undefined;
  const salutation = getSalutation(template);
  const regionLabel = getRegionLabel(template);

  const eventName = certificate?.eventName || template.eventTitle;
  const theme = certificate?.theme || template.themeTitle;
  const participationLine =
    template.participationLine || 'Participated in a week Islamic Vacation Course which took place';
  const certNumber =
    certificate?.certificateNumber || (previewMode ? 'JCS-ATF-2025-0001' : 'JCS-VERIFIED');

  const primaryColor = template.primaryColor || '#7f1d2e';
  const goldColor = template.accentColor || '#c9a227';
  const bgColor = template.backgroundColor || '#fffdf9';

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
      {/* Top strip */}
      <div className="absolute top-0 left-0 w-full pointer-events-none">
        <div className="h-[13px] w-full" style={{ backgroundColor: primaryColor }} />
        <div className="h-[2.5px] w-full" style={{ backgroundColor: goldColor }} />
      </div>
      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none">
        <div className="h-[2.5px] w-full" style={{ backgroundColor: goldColor }} />
        <div className="h-[13px] w-full" style={{ backgroundColor: primaryColor }} />
      </div>

      {/* Zoomed auxiliary logo watermark — centered behind content */}
      {template.showWaveWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={emblemSrc}
            alt=""
            aria-hidden="true"
            className="w-[62%] max-w-[520px] aspect-square object-contain opacity-10 mix-blend-multiply"
          />
        </div>
      )}

      {/* Seal (bottom left) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-9 left-9 w-[74px] h-[74px] pointer-events-none drop-shadow-lg z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="maroonSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={goldColor} />
                <stop offset="55%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#2a0a12" />
              </linearGradient>
            </defs>
            <polygon points="35,65 25,95 40,88 50,95 45,65" fill={primaryColor} opacity="0.9" />
            <polygon points="65,65 55,95 65,88 75,95 60,65" fill={primaryColor} opacity="0.8" />
            <path
              d="M50 8 L55 15 L63 13 L65 21 L73 22 L72 30 L80 33 L75 40 L81 47 L73 51 L74 59 L66 60 L64 68 L56 66 L50 72 L44 66 L36 68 L34 60 L26 59 L27 51 L19 47 L25 40 L20 33 L28 30 L27 22 L35 21 L37 13 L45 15 Z"
              fill="url(#maroonSeal)"
              stroke="#fff7d6"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="42" r="18" fill="none" stroke="#fff7d6" strokeWidth="1.2" />
            <circle cx="50" cy="42" r="11" fill={primaryColor} />
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
      <div className="relative z-10 h-full flex flex-col justify-between px-14 pt-9 pb-10 text-center">
        {/* Medallion header */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="w-12 h-12 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-md p-0.5"
            style={{ border: `2.5px solid ${primaryColor}`, outline: `1.5px solid ${goldColor}`, outlineOffset: '2.5px' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h2 className="mt-2 text-[14px] font-black tracking-[0.1em] uppercase font-sans leading-tight"
            style={{ color: primaryColor }}>
            {template.organizationName}
          </h2>
          <p className="text-[10px] text-slate-600 font-medium">
            {template.organizationSubtitle}
          </p>
        </div>

        {/* Middle */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-2 overflow-hidden">
          <h1 className="text-[24px] font-black uppercase tracking-tight text-slate-900 font-sans leading-[1.2]">
            {eventName}
          </h1>

          <div className="flex items-center gap-2.5">
            <span className="h-px w-16" style={{ backgroundColor: goldColor }} />
            <span
              className="inline-block px-7 py-[5px] rounded text-[12px] font-bold tracking-[0.12em] text-white uppercase whitespace-nowrap shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {template.typeBadgeText}
            </span>
            <span className="h-px w-16" style={{ backgroundColor: goldColor }} />
          </div>

          <div className="w-full text-center text-[12px] leading-[1.95] text-slate-800 font-sans">
            <p>
              This is to congratulate and certify that {salutation}{' '}
              <Blank value={participantName} width={120} />, from{' '}
              <Blank value={ilaqa} width={90} /> {regionLabel},{' '}
              <Blank value={dilla} width={90} /> Dilla,{' '}
              <Blank value={jamaat} width={120} /> Jama&apos;at.
            </p>
            <p>{participationLine}</p>
            <p>
              at <Blank value={venue} width={130} />.
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[12.5px] font-semibold text-slate-600 font-sans">
              from {template.programDurationText}, with the
            </p>
            <p className="text-[15.5px] font-black text-slate-900 font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[10.5px] text-slate-500 leading-snug font-sans max-w-2xl mx-auto line-clamp-2">
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
