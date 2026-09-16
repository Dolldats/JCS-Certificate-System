'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation, getRegionLabel } from './certificateText';

interface TealSurgeCertificateProps {
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
 * "Teal Surge" design (coded):
 * flowing layered wave bands along the bottom plus a top-right
 * accent sweep, left header, rounded badge pill, dynamic seal.
 */
export function TealSurgeCertificate({
  certificate,
  template,
  previewMode = false,
}: TealSurgeCertificateProps) {
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

  const primaryColor = template.primaryColor || '#0f766e';
  const accentColor = template.accentColor || '#2dd4bf';
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
      {/* Bottom layered waves */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[110px] pointer-events-none"
        viewBox="0 0 900 110"
        preserveAspectRatio="none"
      >
        <path
          d="M0 110 V62 C 140 62, 220 30, 360 34 C 520 38, 600 70, 760 66 C 830 64, 870 56, 900 48 V110 Z"
          fill={primaryColor}
          opacity="0.18"
        />
        <path
          d="M0 110 V76 C 140 76, 220 48, 360 52 C 520 56, 600 82, 760 78 C 830 76, 870 70, 900 62 V110 Z"
          fill={primaryColor}
          opacity="0.35"
        />
        <path
          d="M0 110 V90 C 140 90, 220 66, 360 70 C 520 74, 600 94, 760 90 C 830 88, 870 84, 900 78 V110 Z"
          fill={primaryColor}
        />
        <path
          d="M0 90 C 140 90, 220 66, 360 70 C 520 74, 600 94, 760 90 C 830 88, 870 84, 900 78"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
        />
      </svg>
      {/* Top-right accent sweep */}
      <svg
        className="absolute top-0 right-0 w-[30%] h-[72px] pointer-events-none"
        viewBox="0 0 270 72"
        preserveAspectRatio="none"
      >
        <path d="M270 0 V40 C 200 40, 150 24, 90 28 C 60 30, 30 36, 0 44 V0 Z" fill={primaryColor} opacity="0.9" />
        <path d="M270 40 C 200 40, 150 24, 90 28 C 60 30, 30 36, 0 44" fill="none" stroke={accentColor} strokeWidth="3" />
        <circle cx="52" cy="52" r="4" fill={accentColor} />
        <circle cx="72" cy="58" r="2.5" fill={primaryColor} opacity="0.5" />
      </svg>

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

      {/* Seal riding the wave (bottom left) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-9 left-9 w-[76px] h-[76px] pointer-events-none drop-shadow-lg z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="surgeSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="60%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#04211f" />
              </linearGradient>
            </defs>
            <polygon points="35,65 25,95 40,88 50,95 45,65" fill={primaryColor} opacity="0.9" />
            <polygon points="65,65 55,95 65,88 75,95 60,65" fill={primaryColor} opacity="0.8" />
            <path
              d="M50 12 L56 20 L66 18 L68 28 L78 30 L76 40 L84 44 L78 52 L84 60 L74 64 L74 74 L64 74 L60 84 L50 80 L40 84 L36 74 L26 74 L26 64 L16 60 L22 52 L16 44 L24 40 L22 30 L32 28 L34 18 L44 20 Z"
              fill="url(#surgeSeal)"
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
      <div className="relative z-10 h-full flex flex-col justify-between p-6 text-center">
        {/* Left header */}
        <div className="flex items-center gap-2.5 text-left shrink-0">
          <div
            className="w-10 h-10 rounded-full border-2 p-0.5 shrink-0 shadow-sm flex items-center justify-center bg-white overflow-hidden"
            style={{ borderColor: primaryColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="h-9 w-px bg-slate-300" />
          <div>
            <h2 className="text-[13px] font-extrabold tracking-wide uppercase font-sans text-slate-900">
              {template.organizationName}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Middle */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-1 space-y-2 w-full px-8 overflow-hidden">
          <h1
            className="text-[25px] font-black uppercase tracking-tight font-sans leading-[1.2]"
            style={{ color: primaryColor }}
          >
            {eventName}
          </h1>

          <span
            className="inline-block px-8 py-[6px] rounded-full text-[12px] font-bold tracking-[0.14em] text-white uppercase whitespace-nowrap shadow"
            style={{ backgroundColor: primaryColor }}
          >
            {template.typeBadgeText}
          </span>

          <div className="w-full text-center text-[12.5px] leading-[1.8] text-slate-700 font-sans text-balance">
            <p>
              This is to congratulate and certify that <strong>{salutation}</strong>{' '}
              <Blank value={participantName} width={110} />, from{' '}
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
              <Blank value={jamaat} width={110} /> Jama&apos;at.
            </p>
            <p className="mt-1">
              {participationLine} at{' '}
              <Blank value={venue} width={120} />.
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[12.5px] font-medium text-slate-500 font-sans">
              from {template.programDurationText}, with the
            </p>
            <p className="text-[16px] font-black text-slate-900 font-sans">{theme}</p>
          </div>

          <p className="w-full text-center text-[11px] text-slate-500 leading-snug font-sans max-w-2xl mx-auto line-clamp-2">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between pt-1 shrink-0">
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
            <div className="w-full h-0.5 rounded" style={{ backgroundColor: primaryColor }} />
            <div className="text-[12px] font-bold text-slate-900 leading-tight font-sans mt-1">
              {template.signature1Name}
            </div>
            <div className="text-[10px] font-medium text-slate-500 leading-tight">
              {template.signature1Title}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              {template.signature1Date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
