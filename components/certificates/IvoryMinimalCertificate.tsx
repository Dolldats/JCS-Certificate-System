'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation, getRegionLabel } from './certificateText';

interface IvoryMinimalCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/** Underline blank — shows the value on a line, or an empty line in preview. */
function Blank({ value, width }: { value?: string; width: number }) {
  const filled = value && !/^[_\s]+$/.test(value);
  return (
    <span
      className={`inline-block border-b border-slate-400 leading-[1.5] px-1.5 text-center align-baseline ${
        filled ? 'font-semibold text-slate-900 border-slate-900' : ''
      }`}
      style={{ minWidth: width }}
    >
      {filled ? value : ' '}
    </span>
  );
}

/**
 * "Ivory Minimal" design (coded):
 * clean ivory canvas, slim accent edge bar, airy left-aligned header,
 * letterspaced label badge between hairlines, light body text.
 */
export function IvoryMinimalCertificate({
  certificate,
  template,
  previewMode = false,
}: IvoryMinimalCertificateProps) {
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

  const primaryColor = template.primaryColor || '#047857';
  const goldColor = template.accentColor || '#b45309';
  const bgColor = template.backgroundColor || '#faf8f2';

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
      {/* Slim accent edge bar */}
      <div className="absolute left-0 top-0 w-[7px] h-full" style={{ backgroundColor: primaryColor }} />
      <div className="absolute left-[7px] top-0 w-[2px] h-full" style={{ backgroundColor: goldColor }} />

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

      {/* Small seal (bottom left) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-8 left-9 w-[64px] h-[64px] pointer-events-none opacity-90 drop-shadow z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="minimalSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={goldColor} />
                <stop offset="100%" stopColor={primaryColor} />
              </linearGradient>
            </defs>
            <polygon points="35,62 25,96 40,88 50,96 45,62" fill={primaryColor} opacity="0.85" />
            <polygon points="65,62 55,96 65,88 75,96 60,62" fill={primaryColor} opacity="0.75" />
            <path
              d="M50 8 L55 15 L63 13 L65 21 L73 22 L72 30 L80 33 L75 40 L81 47 L73 51 L74 59 L66 60 L64 68 L56 66 L50 72 L44 66 L36 68 L34 60 L26 59 L27 51 L19 47 L25 40 L20 33 L28 30 L27 22 L35 21 L37 13 L45 15 Z"
              fill="url(#minimalSeal)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="42" r="14" fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="50" cy="42" r="8" fill="#ffffff" opacity="0.85" />
          </svg>
        </div>
      )}

      {/* ---------- Content ---------- */}
      <div className="relative z-10 h-full flex flex-col justify-between pl-12 pr-10 py-8">
        {/* Airy header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0 p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-800 font-sans leading-tight">
              {template.organizationName}
            </h2>
            <p className="text-[10px] text-slate-500 font-normal">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Middle */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-2.5 overflow-hidden text-center">
          <p
            className="text-[10px] font-bold tracking-[0.3em] uppercase font-sans"
            style={{ color: primaryColor }}
          >
            {template.typeBadgeText}
          </p>
          <h1 className="text-[27px] font-black tracking-tight text-slate-900 font-sans leading-[1.2] max-w-2xl">
            {eventName}
          </h1>
          <div className="flex items-center gap-3 w-full max-w-md">
            <span className="h-px flex-1 bg-slate-300" />
            <span
              className="w-1.5 h-1.5 rotate-45 shrink-0"
              style={{ backgroundColor: goldColor }}
            />
            <span className="h-px flex-1 bg-slate-300" />
          </div>

          <div className="w-full text-center text-[12px] leading-[2] text-slate-600 font-sans font-normal">
            <p>
              This is to congratulate and certify that {salutation}{' '}
              <Blank value={participantName} width={120} />, from{' '}
              {regionLabel === 'District' ? (
                <>
                  District/Region <Blank value={ilaqa} width={90} />,{ ' ' }
                </>
              ) : (
                <>
                  <Blank value={ilaqa} width={90} /> {regionLabel},{' '}
                </>
              )}
              <Blank value={dilla} width={90} /> Dilla,{' '}
              <Blank value={jamaat} width={120} /> Jama&apos;at.
            </p>
            <p>{participationLine}</p>
            <p>
              at <Blank value={venue} width={130} />.
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[12px] text-slate-500 font-sans">
              from {template.programDurationText}, with the
            </p>
            <p className="text-[16px] font-bold text-slate-900 font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[10.5px] text-slate-500 leading-relaxed font-sans max-w-xl mx-auto line-clamp-2">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between shrink-0">
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
  );
}
