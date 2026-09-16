'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation, getRegionLabel } from './certificateText';

interface EmeraldPrestigeCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/** Underline blank — shows the value on a line, or an empty line in preview. */
function Blank({ value, width }: { value?: string; width: number }) {
  const filled = value && !/^[_\s]+$/.test(value);
  return (
    <span
      className={`inline-block border-b-[1.5px] border-slate-800 leading-[1.5] px-1.5 text-center align-baseline ${
        filled ? 'font-bold text-black' : ''
      }`}
      style={{ minWidth: width }}
    >
      {filled ? value : ' '}
    </span>
  );
}

/**
 * "Emerald Prestige" design (coded):
 * deep-green header band with gold rule, white body, centered premium
 * layout, gold-trimmed badge pill, dynamic rosette seal.
 */
export function EmeraldPrestigeCertificate({
  certificate,
  template,
  previewMode = false,
}: EmeraldPrestigeCertificateProps) {
  // Blank look: no value = neat underline; value = bold name on a line.
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

  const primaryColor = template.primaryColor || '#064e3b';
  const accentColor = template.accentColor || '#c9a227';
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
      {/* Header band */}
      <div
        className="absolute top-0 left-0 w-full h-[118px] pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      >
        <div
          className="absolute bottom-0 left-0 w-full h-[3px]"
          style={{ backgroundColor: accentColor }}
        />
        {/* faint oversized emblem watermark in band */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="absolute -right-8 -top-10 w-44 h-44 object-contain opacity-10 pointer-events-none"
        />
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

      {/* Rosette seal (bottom left) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-7 left-8 w-[78px] h-[78px] pointer-events-none drop-shadow-lg z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="prestigeSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="60%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
            </defs>
            <polygon points="35,65 25,95 40,88 50,95 45,65" fill={primaryColor} opacity="0.9" />
            <polygon points="65,65 55,95 65,88 75,95 60,65" fill={primaryColor} opacity="0.8" />
            <path
              d="M50 12 L56 20 L66 18 L68 28 L78 30 L76 40 L84 44 L78 52 L84 60 L74 64 L74 74 L64 74 L60 84 L50 80 L40 84 L36 74 L26 74 L26 64 L16 60 L22 52 L16 44 L24 40 L22 30 L32 28 L34 18 L44 20 Z"
              fill="url(#prestigeSeal)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2,2" />
            <circle cx="50" cy="50" r="13" fill={primaryColor} />
            <path
              d="M44 50 L48 54 L56 46"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* ---------- Content ---------- */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header content inside band */}
        <div className="h-[118px] shrink-0 flex items-center gap-3 px-8">
          <div className="w-12 h-12 rounded-full border-2 border-white/90 p-0.5 shrink-0 bg-white overflow-hidden flex items-center justify-center shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="h-10 w-px bg-white/40" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-black tracking-wide uppercase text-white font-sans leading-tight truncate">
              {template.organizationName}
            </h2>
            <p className="text-[11px] text-white/80 font-medium truncate">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-10 py-2 space-y-2 overflow-hidden text-center">
          <h1 className="text-[25px] font-black uppercase tracking-tight text-slate-900 font-sans leading-[1.2]">
            {eventName}
          </h1>

          <span
            className="inline-block px-8 py-[5px] rounded-full text-[12px] font-bold tracking-[0.14em] text-white uppercase whitespace-nowrap shadow-sm"
            style={{ backgroundColor: primaryColor, border: `1.5px solid ${accentColor}` }}
          >
            {template.typeBadgeText}
          </span>

          <div className="w-full text-center text-[12.5px] leading-[1.8] text-slate-800 font-sans text-balance">
            <p>
              This is to congratulate and certify that <strong>{salutation}</strong>{' '}
              <Blank value={participantName} width={110} />, from{' '}
              <Blank value={ilaqa} width={90} /> {regionLabel},{' '}
              <Blank value={dilla} width={90} /> Dilla,{' '}
              <Blank value={jamaat} width={110} /> Jama&apos;at.
            </p>
            <p className="mt-1">
              {participationLine} at{' '}
              <Blank value={venue} width={120} />.
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[12.5px] font-semibold text-slate-700 font-sans">
              from {template.programDurationText}, with the
            </p>
            <p className="text-[16px] font-black text-slate-900 font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[11px] text-slate-600 leading-snug font-sans max-w-2xl mx-auto line-clamp-2">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 pb-5">
          <div className="h-px w-full bg-slate-200 mb-2.5" />
          <div className="flex items-end justify-between">
            <div className="w-24 shrink-0" />
            <div className="flex-1 text-center px-4">
              <div className="text-3xs text-slate-400 font-mono tracking-wider">Serial No:</div>
              <div className="font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                {certNumber}
              </div>
            </div>
            <div className="w-52 text-center">
              <div className="h-8 flex items-end justify-center mb-1">
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
    </div>
  );
}
