'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation, getRegionLabel } from './certificateText';

interface ModernCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/** Underline blank — shows the value on a line, or an empty line in preview. */
function Blank({ value, width }: { value?: string; width: number }) {
  const filled = value && !/^[_\s]+$/.test(value);
  return (
    <span
      className={`inline-block border-b-[1.5px] border-black leading-[1.5] px-1.5 text-center align-baseline ${
        filled ? 'font-black text-black' : ''
      }`}
      style={{ minWidth: width }}
    >
      {filled ? value : ' '}
    </span>
  );
}

export function ModernCertificate({
  certificate,
  template,
  previewMode = false,
}: ModernCertificateProps) {
  // Dynamic replacement data.
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
  const certNumber = certificate?.certificateNumber || (previewMode ? 'JCS-ATF-2025-0001' : 'JCS-VERIFIED');

  // Colors
  const primaryColor = template.primaryColor || '#15803d';
  const accentColor = template.accentColor || '#84cc16';
  const neutralColor = template.neutralColor || '#0f172a';
  const bgColor = template.backgroundColor || '#ffffff';

  // Auxiliary emblems — real logos from /public.
  // Ahmadiyyah logo is the default; Ansar / Lajna / Khuddam use their own.
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
      style={{
        backgroundColor: bgColor,
        /* Screen size is driven by the parent scale-to-fit wrapper
           (see CertificatePreview). Print size is forced in globals.css. */
      }}
    >
      {/* 1. Subtle Guilloche / Wavy Background Watermark */}
      {template.showWaveWatermark && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 707"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="guilloche-waves" width="100" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 20 Q 25 5, 50 20 T 100 20"
                fill="none"
                stroke={primaryColor}
                strokeWidth="0.4"
                opacity="0.35"
              />
              <path
                d="M0 25 Q 25 10, 50 25 T 100 25"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.3"
                opacity="0.25"
              />
            </pattern>
          </defs>
          <rect width="1000" height="707" fill="url(#guilloche-waves)" />
        </svg>
      )}

      {/* 1b. Zoomed auxiliary logo watermark — centered behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="w-[62%] max-w-[520px] aspect-square object-contain opacity-10 mix-blend-multiply"
        />
      </div>

      {/* 2. Top-Right 3D Torus Ring Decoration */}
      {template.showTorusRings && (
        <div className="absolute -top-16 -right-16 w-64 h-64 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="torusGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="50%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <circle
              cx="110"
              cy="90"
              r="75"
              fill="none"
              stroke="url(#torusGradTop)"
              strokeWidth="32"
              strokeLinecap="round"
              transform="rotate(-20 110 90)"
            />
          </svg>
        </div>
      )}

      {/* 3. Bottom-Left 3D Torus Ring Decoration & Rosette Badge */}
      {template.showTorusRings && (
        <div className="absolute -bottom-16 -left-16 w-64 h-64 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="torusGradBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="60%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <circle
              cx="90"
              cy="110"
              r="75"
              fill="none"
              stroke="url(#torusGradBottom)"
              strokeWidth="32"
              strokeLinecap="round"
              transform="rotate(35 90 110)"
            />
          </svg>
        </div>
      )}

      {/* Rosette Ribbon Seal (Bottom Left) */}
      {template.showRosetteBadge && (
        <div className="absolute bottom-5 left-5 w-[88px] h-[88px] pointer-events-none drop-shadow-lg z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="70%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            {/* Ribbons hanging down */}
            <polygon points="35,65 25,95 40,88 50,95 45,65" fill={primaryColor} opacity="0.9" />
            <polygon points="65,65 55,95 65,88 75,95 60,65" fill={primaryColor} opacity="0.8" />
            {/* Serrated Star rosette */}
            <path
              d="M50 12 L56 20 L66 18 L68 28 L78 30 L76 40 L84 44 L78 52 L84 60 L74 64 L74 74 L64 74 L60 84 L50 80 L40 84 L36 74 L26 74 L26 64 L16 60 L22 52 L16 44 L24 40 L22 30 L32 28 L34 18 L44 20 Z"
              fill="url(#sealGrad)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Inner Ring */}
            <circle cx="50" cy="50" r="22" fill="#ffffff" opacity="0.2" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2,2" />
            {/* Center Emblem / Checkmark */}
            <circle cx="50" cy="50" r="14" fill={primaryColor} />
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

      {/* 4. Main Certificate Content Layout — tight rhythm like the official design */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 pt-4 pb-4 print:p-[12mm] text-center">
        {/* Top Header: Logo + Organization Title */}
        <div className="flex items-center gap-2.5 text-left shrink-0">
          {/* Official Emblem — real auxiliary logo from /public */}
          <div
            className="w-12 h-12 rounded-full border-2 p-0.5 shrink-0 shadow-sm flex items-center justify-center bg-white overflow-hidden"
            style={{ borderColor: primaryColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="h-11 w-px bg-slate-400" />

          <div>
            <h2
              className="text-[14px] font-extrabold tracking-wide uppercase font-sans"
              style={{ color: neutralColor }}
            >
              {template.organizationName}
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Central Headlines & Body — compact so the whole page fits the landscape ratio */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-1 space-y-2 w-full px-8 overflow-hidden">
          {/* Big Main Event Title */}
          <h1
            className="text-[26px] font-black uppercase tracking-tight font-sans leading-[1.2]"
            style={{ color: neutralColor }}
          >
            {eventName}
          </h1>

          {/* Certificate Type Badge Pill */}
          <div className="inline-block pb-0.5">
            <span
              className="inline-block px-8 py-1.5 rounded-md text-[13px] font-extrabold tracking-wider text-white shadow-sm uppercase"
              style={{ backgroundColor: primaryColor }}
            >
              {template.typeBadgeText}
            </span>
          </div>

          {/* Body — centered, underline blanks, balanced wrapping (no stranded fragments) */}
          <div className="w-full text-center text-[13px] leading-[1.8] text-black font-bold font-sans text-balance">
            <p>
              This is to congratulate and certify that {salutation}{' '}
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

          {/* Date & Theme Highlight */}
          <div className="space-y-0.5">
            <p className="text-[13px] font-bold text-black font-sans">
              from {template.programDurationText}, with the
            </p>
            <p className="text-[18px] font-black tracking-tight font-sans text-black">
              {theme}
            </p>
          </div>

          {/* Focus & Mission Description */}
          <p className="w-full text-center text-[12px] text-black font-bold leading-snug font-sans max-w-2xl mx-auto line-clamp-3">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer: Serial (bottom-center, clear of corner rings) & Official Signatory */}
        <div className="flex items-end justify-between pt-1 shrink-0">
          {/* Spacer — reserves room for the bottom-left rosette seal */}
          <div className="w-24 shrink-0" />
          {/* Serial Number & Security Code — centered where it reads cleanly */}
          <div className="flex-1 text-center px-4">
            <div className="text-3xs text-slate-400 font-mono tracking-wider">Serial No:</div>
            <div className="font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
              {certNumber}
            </div>
          </div>

          {/* Official Signatory Section */}
          <div className="w-52 text-center">
            {/* Signature: uploaded image OR fallback SVG vector */}
            <div className="h-8 flex items-end justify-center mb-1">
              {template.signature1Image ? (
                <img
                  src={template.signature1Image}
                  alt="Official Signature"
                  className="max-h-10 max-w-[144px] object-contain"
                  style={{ filter: 'contrast(1.1)' }}
                />
              ) : (
                <svg viewBox="0 0 180 40" className="w-36 h-9 overflow-visible">
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

            {/* Divider Line */}
            <div className="w-full h-0.5 bg-slate-800 mx-auto mb-1.5" />

            {/* Name & Title */}
            <div className="text-[12px] font-bold text-slate-900 leading-tight font-sans">
              {template.signature1Name}
            </div>
            <div className="text-[10px] font-medium text-slate-600 leading-tight">
              {template.signature1Title}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {template.signature1Date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
