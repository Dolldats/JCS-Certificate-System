'use client';

import { create } from 'qrcode';
import React, { useMemo } from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  logo?: string; // center emblem image src
}

/**
 * Renders a QR code as inline SVG.
 *
 * The library's canvas renderer is asynchronous and needs a real <canvas>,
 * which made the code appear late (or not at all) in print output. `create()`
 * is synchronous and pure data, so the modules are drawn as an SVG path
 * instead — deterministic, crisp at any size, and identical on screen and
 * paper.
 */
export function QrCode({ value, size = 120, className, logo }: QrCodeProps) {
  const qr = useMemo(() => {
    try {
      // 'H' recovery so the centre emblem stays scannable.
      return create(value, { errorCorrectionLevel: 'H' });
    } catch {
      return null;
    }
  }, [value]);

  if (!qr) return null;

  const { size: modules, data } = qr.modules;
  const margin = 1;
  const extent = modules + margin * 2;

  // One path for every dark module — far lighter than a rect per module.
  let path = '';
  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      if (data[y * modules + x]) {
        path += `M${x + margin} ${y + margin}h1v1h-1z`;
      }
    }
  }

  return (
    <div
      className={`relative inline-block shrink-0 ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${extent} ${extent}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role="img"
        aria-label="Certificate verification QR code"
      >
        <rect width={extent} height={extent} fill="#ffffff" />
        <path d={path} fill="#0f172a" />
      </svg>

      {logo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="relative shrink-0 rounded-full bg-white"
            style={{
              width: size * 0.24,
              height: size * 0.24,
              boxShadow: '0 0 0 2px #0f172a',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="absolute rounded-full object-contain"
              style={{
                width: '68%',
                height: '68%',
                top: '16%',
                left: '16%',
              }}
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
}
