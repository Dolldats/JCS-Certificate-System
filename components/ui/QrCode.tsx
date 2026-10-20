'use client';

import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  logo?: string; // center emblem image src
}

export function QrCode({ value, size = 120, className, logo }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).then(setDataUrl);
  }, [value, size]);

  if (!dataUrl) return null;

  return (
    <div
      className={`inline-block shrink-0 relative ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={dataUrl}
        alt="QR code"
        className="block shrink-0"
        style={{ width: size, height: size }}
        decoding="async"
      />
      {logo && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="relative shrink-0"
            style={{
              width: size * 0.22,
              height: size * 0.22,
            }}
          >
            {/* White cushion so the logo sits on a clean spot of the QR code */}
            <div
              className="absolute inset-0 rounded-full bg-white shadow-sm"
              style={{
                boxShadow: '0 0 0 3px #0f172a',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt="Auxiliary emblem"
              className="absolute inset-0 rounded-full object-contain z-10"
              style={{
                width: '70%',
                height: '70%',
                top: '15%',
                left: '15%',
              }}
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
}
