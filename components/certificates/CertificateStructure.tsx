'use client';

import React from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { getSalutation } from './certificateText';

interface CertificateStructureProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  logoSrc: string;
  logoAlt: string;
  certificateNumber?: string;
}

function isLightColor(color: string): boolean {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return true;
  const raw = match[1];
  const hex = raw.length === 3 ? raw.split('').map((digit) => digit + digit).join('') : raw;
  const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = channels
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.42;
}

function Field({ value, width, accent }: { value?: string; width: number; accent: string }) {
  const filled = Boolean(value?.trim()) && !/^[_\s]+$/.test(value || '');
  return (
    <span
      className="inline-block align-baseline px-1 text-center leading-[1.55]"
      style={{
        minWidth: width,
        color: filled ? accent : undefined,
        fontWeight: filled ? 700 : undefined,
        borderBottom: filled ? 'none' : '1px solid currentColor',
      }}
    >
      {filled ? value : '\u00a0'}
    </span>
  );
}

const RECIPIENT_TYPOGRAPHY: Record<NonNullable<CertificateTemplate['design']>, React.CSSProperties> = {
  'modern-rings': {
    fontFamily: 'Lobster, cursive',
    fontWeight: 400,
  },
  'emerald-prestige': {
    fontFamily: 'Marck Script, cursive',
    fontWeight: 400,
  },
  'ivory-minimal': {
    fontFamily: 'Berkshire Swash, cursive',
    fontWeight: 400,
  },
  'royal-maroon': {
    fontFamily: 'Great Vibes, cursive',
    fontWeight: 400,
  },
  'teal-surge': {
    fontFamily: 'Satisfy, cursive',
    fontWeight: 400,
  },
  'onyx-executive': {
    fontFamily: 'Cormorant Garamond, Garamond, serif',
    fontWeight: 700,
    letterSpacing: '0.015em',
  },
  'emerald-ribbon': {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontStyle: 'italic',
    fontWeight: 500,
  },
};

export function CertificateStructure({
  certificate,
  template,
  logoSrc,
  logoAlt,
  certificateNumber,
}: CertificateStructureProps) {
  const primary = template.primaryColor || '#15803d';
  const accent = template.accentColor || primary;
  const design = template.design || 'modern-rings';
  const lightCanvas = template.design === 'emerald-ribbon'
    ? false
    : isLightColor(template.backgroundColor || '#ffffff');
  const foreground = lightCanvas ? template.neutralColor || '#17211c' : '#f8fafc';
  const muted = lightCanvas ? '#64736a' : '#c0d0c8';
  const name = certificate?.participantName || 'Participant Name';
  const salutation = getSalutation(template);
  const award = (template.typeBadgeText || template.certificateType)
    .replace(/^certificate\s+of\s+/i, '')
    .trim();
  const eventName = certificate?.eventName || template.eventTitle;
  const theme = certificate?.theme || template.themeTitle;
  const date = template.signature1Date || certificate?.eventDate;
  const number = certificateNumber || certificate?.certificateNumber;
  const signatureSrc = template.signature1Image || template.signatureAssetPath;
  const recipientStyle: React.CSSProperties = {
    color: design === 'emerald-ribbon' ? accent : primary,
    ...RECIPIENT_TYPOGRAPHY[design],
  };
  const labelHasBadge = !['ivory-minimal', 'emerald-ribbon'].includes(design);
  const badgeRadius: Record<NonNullable<CertificateTemplate['design']>, string> = {
    'modern-rings': 'rounded-md',
    'emerald-prestige': 'rounded-full border',
    'ivory-minimal': '',
    'royal-maroon': 'rounded-sm',
    'teal-surge': 'rounded-full',
    'onyx-executive': 'rounded-none border',
    'emerald-ribbon': '',
  };

  return (
    <div className="absolute inset-0 z-[10] flex h-full flex-col items-center justify-between px-[6%] pb-[3.5%] pt-[4%] text-center font-sans">
      <header className="flex shrink-0 items-center justify-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white p-0.5 shadow-sm"
          style={{ borderColor: primary }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt={logoAlt} className="h-full w-full rounded-full object-contain" />
        </div>
        <div className="h-10 w-px" style={{ backgroundColor: `${accent}88` }} />
        <div className="text-left">
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em]" style={{ color: foreground }}>
            {template.organizationName}
          </h2>
          {template.organizationSubtitle && (
            <p className="mt-0.5 text-[10px] font-medium" style={{ color: muted }}>
              {template.organizationSubtitle}
            </p>
          )}
        </div>
      </header>

      <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1.5 py-3">
        <h1 className="text-[29px] font-bold uppercase leading-none tracking-[0.18em]" style={{ color: foreground }}>
          Certificate
        </h1>
        <p
          className={`px-5 py-1 text-[12px] font-semibold uppercase tracking-[0.22em] ${badgeRadius[design]}`}
          style={{
            color: labelHasBadge ? '#ffffff' : accent,
            backgroundColor: labelHasBadge ? primary : 'transparent',
            borderColor: design === 'emerald-prestige' || design === 'onyx-executive' ? accent : undefined,
          }}
        >
          of {award}
        </p>
        <p className="mt-2 text-[11px] font-medium" style={{ color: muted }}>
          This certificate is proudly presented to
        </p>
        <p className="max-w-[92%] text-[36px] leading-tight" style={recipientStyle}>
          {salutation} {name}
        </p>
        <div className="my-0.5 h-px w-32" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

        <div className="mt-1 w-full max-w-[92%] text-[12px] leading-[1.65]" style={{ color: foreground }}>
          <p>
            This is to certify that {salutation}{' '}
            <Field value={certificate?.participantName} width={120} accent={accent} />, from{' '}
            <Field value={certificate?.dila} width={88} accent={accent} /> Dilla,{' '}
            <Field value={certificate?.jamaat} width={110} accent={accent} /> Jama&apos;at.
          </p>
          <p className="mt-0.5">
            Participated in the <Field value={eventName} width={210} accent={accent} /> which took place at{' '}
            <Field value={certificate?.venue} width={140} accent={accent} />.
          </p>
        </div>

        {template.programDurationText && (
          <p className="mt-1 text-[11px] font-medium" style={{ color: muted }}>
            {template.programDurationText}
          </p>
        )}
        {theme && <p className="text-[12px] font-bold" style={{ color: accent }}>{theme}</p>}
        {template.bodyFocusText && (
          <p className="mt-1 max-w-[82%] text-[10px] leading-relaxed" style={{ color: muted }}>
            {template.bodyFocusText}
          </p>
        )}
      </main>

      {number && number !== 'JCS-PENDING' && (
        <p className="pointer-events-none absolute bottom-[78px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-wider" style={{ color: muted }}>
          Serial No. {number}
        </p>
      )}

      <footer className="grid w-full shrink-0 grid-cols-3 items-end gap-6 text-[9px]" style={{ color: muted }}>
        <div className="text-center">
          {date && <p className="mb-1 text-[10px] font-semibold" style={{ color: foreground }}>{date}</p>}
          <div className="mx-auto mb-1 h-px w-32" style={{ backgroundColor: `${accent}bb` }} />
          <span className="uppercase tracking-[0.2em]">Date</span>
        </div>
        <div aria-hidden="true" />
        <div className="text-center">
          <div className="mb-1 flex h-7 items-end justify-center">
            {signatureSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatureSrc} alt="Authorized signature" className="max-h-7 max-w-36 object-contain" />
            ) : (
              <svg viewBox="0 0 180 40" className="h-8 w-32 overflow-visible" aria-hidden="true">
                <path d="M10 28 Q25 5 45 22 T80 18 T120 28 Q140 12 160 25" fill="none" stroke={foreground} strokeWidth="2" strokeLinecap="round" />
                <path d="M35 12 Q55 35 75 10 T115 32 M95 18l45 20" fill="none" stroke={foreground} strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div className="mx-auto mb-1 h-px w-36" style={{ backgroundColor: `${accent}bb` }} />
          <p className="font-semibold" style={{ color: foreground }}>{template.signature1Name}</p>
          <p className="uppercase tracking-[0.12em]">{template.signature1Title}</p>
        </div>
      </footer>
    </div>
  );
}
