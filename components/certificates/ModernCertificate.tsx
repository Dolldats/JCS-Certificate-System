'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';

interface ModernCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

export function ModernCertificate({
  certificate,
  template,
  previewMode = false,
}: ModernCertificateProps) {
  // Dynamic replacement data.
  // Blank template look (like the original): when there is no issued
  // certificate, show neat handwriting lines instead of sample names.
  const BLANK = '________________________';
  const BLANK_SHORT = '____________________';
  const participantName = certificate?.participantName || BLANK;
  const dilla = certificate?.dila || BLANK_SHORT;
  const jamaat = certificate?.jamaat || BLANK;
  const muqami =
    (certificate as unknown as { muqami?: string })?.muqami || certificate?.ilaqa || BLANK_SHORT;
  const venue = certificate?.venue || BLANK_SHORT;
  // Line 4 from/to comes from "Program Duration & Dates" (e.g. "3rd August to Sunday 10th August, 2025").
  const durationParts = (template.programDurationText || '').split(/\s+to\s+/i);
  const fromPlace =
    (certificate as unknown as { fromPlace?: string })?.fromPlace ||
    (durationParts.length > 1 ? durationParts[0].trim() : BLANK_SHORT);
  const toPlace =
    (certificate as unknown as { toPlace?: string })?.toPlace ||
    (durationParts.length > 1 ? durationParts.slice(1).join(' to ').trim() : BLANK);
  // Member salutation per auxiliary (Atfal=Tifl, Khuddam=Khadim, etc.)
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
    AUX_SALUTATION[template.auxiliary as string] ||
    AUX_SALUTATION[template.logoType] ||
    'Tifl';
  const eventName = certificate?.eventName || template.eventTitle;
  const theme = certificate?.theme || template.themeTitle;
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
      className="relative w-full max-w-4xl aspect-[1.414/1] bg-white shadow-2xl rounded-sm overflow-hidden select-none"
      style={{
        backgroundColor: bgColor,
        /* Screen: aspect-ratio drives height */
        /* Print: globals.css overrides to 297mm × 210mm */
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
        <div className="absolute bottom-6 left-6 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none drop-shadow-lg z-20">
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

      {/* 4. Main Certificate Content Layout */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 print:p-[12mm] text-center">
        {/* Top Header: Logo + Organization Title */}
        <div className="flex items-center gap-3 text-left">
          {/* Official Emblem — real auxiliary logo from /public */}
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 p-0.5 shrink-0 shadow-sm flex items-center justify-center bg-white overflow-hidden"
            style={{ borderColor: primaryColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emblemSrc}
              alt={emblemAlt}
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="h-9 w-px bg-slate-400" />

          <div>
            <h2
              className="text-xs sm:text-sm font-extrabold tracking-wide uppercase font-sans"
              style={{ color: neutralColor }}
            >
              {template.organizationName}
            </h2>
            <p className="text-3xs sm:text-2xs text-slate-600 font-medium">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Central Headlines & Body — neat blank-template layout like the original */}
        <div className="my-auto py-3 sm:py-4 space-y-4 sm:space-y-5 w-full px-1 sm:px-4">
          {/* Big Main Event Title */}
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight font-sans leading-tight"
            style={{ color: neutralColor }}
          >
            {eventName}
          </h1>

          {/* Certificate Type Badge Pill */}
          <div className="inline-block pb-1">
            <span
              className="inline-block px-8 py-2 rounded-md text-sm sm:text-base font-extrabold tracking-wider text-white shadow-sm uppercase"
              style={{ backgroundColor: primaryColor }}
            >
              {template.typeBadgeText}
            </span>
          </div>

          {/* Line 1–2: exactly like the original — line 1 ends with bare "Ilaqa." */}
          <div className="w-full text-left text-base sm:text-lg md:text-xl leading-loose text-black font-bold font-sans">
            <p>
              This is to congratulate and certify that {salutation}{' '}
              <span className="font-black text-black px-1">{participantName}</span>, Dilla{' '}
              <span className="font-black text-black px-1">{dilla}</span>, Ilaqa.
            </p>
            <p>
              from <span className="font-black text-black px-1">{jamaat}</span> Muqami,{' '}
              <span className="font-black text-black px-1">{muqami}</span>.
            </p>
          </div>

          {/* Line 3–4: participation — centered like the original */}
          <div className="w-full text-center text-base sm:text-lg md:text-xl font-bold text-black font-sans leading-loose">
            <p>Participated in a week Islamic Vacation Course which took place</p>
            <p>
              at <span className="font-black text-black px-1">{venue}</span> from{' '}
              <span className="font-black text-black px-1">{fromPlace}</span> to{' '}
              <span className="font-black text-black px-1">{toPlace}</span>.
            </p>
          </div>

          {/* Date & Theme Highlight */}
          <div className="space-y-1.5 pt-1">
            <p className="text-base sm:text-lg md:text-xl font-bold text-black font-sans">
              {template.programDurationText}, with the
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-black tracking-tight font-sans text-black">
              {theme}
            </p>
          </div>

          {/* Focus & Mission Description */}
          <p className="w-full text-center text-base sm:text-lg text-black font-bold leading-relaxed font-sans max-w-3xl mx-auto">
            {template.bodyFocusText}
          </p>
        </div>

        {/* Footer: Serial (bottom-center, clear of corner rings) & Official Signatory */}
        <div className="flex items-end justify-between pt-4">
          {/* Spacer — reserves room for the bottom-left rosette seal */}
          <div className="w-20 sm:w-28 shrink-0" />
          {/* Serial Number & Security Code — centered where it reads cleanly */}
          <div className="flex-1 text-center px-4">
            <div className="text-3xs text-slate-400 font-mono tracking-wider">Serial No:</div>
            <div className="font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
              {certNumber}
            </div>
          </div>

          {/* Official Signatory Section */}
          <div className="w-56 sm:w-64 text-center">
            {/* Signature: uploaded image OR fallback SVG vector */}
            <div className="h-10 flex items-end justify-center mb-1">
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
            <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight font-sans">
              {template.signature1Name}
            </div>
            <div className="text-3xs sm:text-2xs font-medium text-slate-600 leading-tight">
              {template.signature1Title}
            </div>
            <div className="text-3xs text-slate-500 font-medium mt-0.5">
              {template.signature1Date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
