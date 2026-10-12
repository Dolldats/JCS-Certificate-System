'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';

interface SapphireModernCertificateProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
}

/**
 * "Sapphire Modern" design (coded):
 * white canvas, deep diagonal corner blocks with gold edges,
 * left-aligned header, full-width badge bar, centered body,
 * dynamic-color rosette seal.
 */
export function SapphireModernCertificate({
  certificate,
  template,
  previewMode = false,
}: SapphireModernCertificateProps) {
  const BLANK = '____________';
  const BLANK_SHORT = '________';
  const participantName = certificate?.participantName || BLANK;
  const dilla = certificate?.dila || BLANK_SHORT;
  const jamaat = certificate?.jamaat || BLANK;
  const muqami =
    (certificate as unknown as { muqami?: string })?.muqami || certificate?.ilaqa || BLANK_SHORT;
  const venue = certificate?.venue || BLANK_SHORT;

  const durationParts = (template.programDurationText || '').split(/\s+to\s+/i);
  const fromPlace =
    (certificate as unknown as { fromPlace?: string })?.fromPlace ||
    (durationParts.length > 1 ? durationParts[0].trim() : BLANK_SHORT);
  const toPlace =
    (certificate as unknown as { toPlace?: string })?.toPlace ||
    (durationParts.length > 1 ? durationParts.slice(1).join(' to ').trim() : BLANK);

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

  const primaryColor = template.primaryColor || '#1e3a8a';
  const accentColor = template.accentColor || '#c9a227';
  const neutralColor = template.neutralColor || '#0f172a';
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
      {/* Diagonal corner blocks with gold edges */}
      <svg
        className="absolute top-0 right-0 w-[38%] h-[120px] pointer-events-none"
        viewBox="0 0 340 120"
        preserveAspectRatio="none"
      >
        <polygon points="340,0 340,120 120,0" fill={primaryColor} />
        <polygon points="340,0 340,120 120,0" fill={primaryColor} opacity="0.25" transform="translate(-14 0)" />
        <line x1="120" y1="0" x2="340" y2="120" stroke={accentColor} strokeWidth="4" />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-[30%] h-[100px] pointer-events-none"
        viewBox="0 0 270 100"
        preserveAspectRatio="none"
      >
        <polygon points="0,100 0,0 270,100" fill={primaryColor} />
        <polygon points="0,100 0,0 270,100" fill={primaryColor} opacity="0.25" transform="translate(0 -12)" />
        <line x1="0" y1="0" x2="270" y2="100" stroke={accentColor} strokeWidth="4" />
      </svg>

      {/* Subtle watermark */}
      {template.showWaveWatermark && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 707"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="sapphire-waves" width="100" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 20 Q 25 5, 50 20 T 100 20"
                fill="none"
                stroke={primaryColor}
                strokeWidth="0.4"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="1000" height="707" fill="url(#sapphire-waves)" />
        </svg>
      )}

      {/* Rosette seal (bottom left) */}
      {template.showRosetteBadge !== false && (
        <div className="absolute bottom-8 left-10 w-[80px] h-[80px] pointer-events-none drop-shadow-lg z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="sapphireSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="60%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#0a1030" />
              </linearGradient>
            </defs>
            <polygon points="35,65 25,95 40,88 50,95 45,65" fill={primaryColor} opacity="0.9" />
            <polygon points="65,65 55,95 65,88 75,95 60,65" fill={primaryColor} opacity="0.8" />
            <path
              d="M50 12 L56 20 L66 18 L68 28 L78 30 L76 40 L84 44 L78 52 L84 60 L74 64 L74 74 L64 74 L60 84 L50 80 L40 84 L36 74 L26 74 L26 64 L16 60 L22 52 L16 44 L24 40 L22 30 L32 28 L34 18 L44 20 Z"
              fill="url(#sapphireSeal)"
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
        {/* Left-aligned header */}
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
          <div className="h-9 w-px bg-slate-400" />
          <div>
            <h2
              className="text-[13px] font-extrabold tracking-wide uppercase font-sans"
              style={{ color: neutralColor }}
            >
              {template.organizationName}
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              {template.organizationSubtitle}
            </p>
          </div>
        </div>

        {/* Middle — centered */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-1 space-y-2 w-full px-8 overflow-hidden">
          <h1
            className="text-[25px] font-black uppercase tracking-tight font-sans leading-[1.2]"
            style={{ color: primaryColor }}
          >
            {eventName}
          </h1>

          {/* Full-width badge bar with gold rules */}
          <div className="w-full max-w-xl">
            <div className="h-[2px] w-full" style={{ backgroundColor: accentColor }} />
            <div
              className="py-1.5 px-4 text-[12.5px] font-bold tracking-[0.14em] text-white uppercase whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ backgroundColor: primaryColor }}
            >
              {template.typeBadgeText}
            </div>
            <div className="h-[2px] w-full" style={{ backgroundColor: accentColor }} />
          </div>

          <div className="w-full text-center text-[12.5px] leading-[1.7] text-black font-bold font-sans">
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

          <div className="w-full text-center text-[12.5px] font-bold text-black font-sans leading-[1.7]">
            <p>Participated in a week Islamic Vacation Course which took place</p>
            <p>
              at <span className="font-black text-black px-1">{venue}</span> from{' '}
              <span className="font-black text-black px-1">{fromPlace}</span> to{' '}
              <span className="font-black text-black px-1">{toPlace}</span>.
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[12.5px] font-bold text-black font-sans">
              {template.programDurationText}, with the
            </p>
            <p className="text-[16px] font-black tracking-tight font-sans text-black">{theme}</p>
          </div>

          <p className="w-full text-center text-[11px] text-black font-bold leading-snug font-sans max-w-2xl mx-auto line-clamp-2">
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
            <div className="w-full h-0.5 bg-slate-800 mx-auto mb-1.5" />
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
