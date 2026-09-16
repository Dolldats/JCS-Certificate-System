'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { ModernCertificate } from './ModernCertificate';
import { EmeraldPrestigeCertificate } from './EmeraldPrestigeCertificate';
import { IvoryMinimalCertificate } from './IvoryMinimalCertificate';
import { RoyalMaroonCertificate } from './RoyalMaroonCertificate';
import { TealSurgeCertificate } from './TealSurgeCertificate';
import { OnyxExecutiveCertificate } from './OnyxExecutiveCertificate';
import { Button } from '../ui/Button';
import { Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

// Fixed design size (A4 landscape ratio). The certificate is rendered at
// this size internally, then scaled down to fit the container width —
// guaranteeing the whole certificate is always visible (no cropping).
const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = DESIGN_WIDTH / 1.414;

interface CertificatePreviewProps {
  certificate?: Partial<Certificate>;
  template: CertificateTemplate;
  previewMode?: boolean;
  showActions?: boolean;
}

export function CertificatePreview({
  certificate,
  template,
  previewMode = false,
  showActions = false,
}: CertificatePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const prevTitle = document.title;
    document.title = `${template.typeBadgeText || 'Certificate'}-${certNumber}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
  };

  const certNumber =
    certificate?.certificateNumber || (previewMode ? 'JCS-ATF-2025-0001' : 'JCS-PENDING');

  function renderCertificate() {
    switch (template.design || 'modern-rings') {
      case 'emerald-prestige':
        return (
          <EmeraldPrestigeCertificate
            certificate={certificate}
            template={template}
            previewMode={previewMode}
          />
        );
      case 'ivory-minimal':
        return (
          <IvoryMinimalCertificate
            certificate={certificate}
            template={template}
            previewMode={previewMode}
          />
        );
      case 'royal-maroon':
        return (
          <RoyalMaroonCertificate
            certificate={certificate}
            template={template}
            previewMode={previewMode}
          />
        );
      case 'teal-surge':
        return (
          <TealSurgeCertificate
            certificate={certificate}
            template={template}
            previewMode={previewMode}
          />
        );
      case 'onyx-executive':
        return (
          <OnyxExecutiveCertificate
            certificate={certificate}
            template={template}
            previewMode={previewMode}
          />
        );
      case 'modern-rings':
      default:
        return (
          <ModernCertificate
            certificate={certificate}
            template={template}
            previewMode={previewMode}
          />
        );
    }
  }

  // Scale-to-fit: measure the available width and shrink the fixed-size
  // certificate to fit, so the full page is always visible.
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / DESIGN_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {showActions && (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 print:hidden bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Serial Number: <span className="font-mono text-emerald-700 font-bold">{certNumber}</span>
            </span>
            {certificate?.status === 'Issued' ? (
              <span className="inline-flex items-center gap-1 text-2xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified &amp; Issued
              </span>
            ) : certificate?.status === 'Revoked' ? (
              <span className="inline-flex items-center gap-1 text-2xs bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-medium">
                Revoked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Live Preview
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print Certificate
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
            >
              Save as PDF
            </Button>
          </div>
        </div>
      )}

      {/* Render Certificate — scaled to fit so the WHOLE page is visible.
          The cert-* classes let the print stylesheet neutralize this
          scale-to-fit scaffolding (transforms break position:fixed in print). */}
      <div ref={containerRef} className="certificate-screen-wrap w-full overflow-hidden">
        <div
          className="certificate-screen-sizer relative"
          style={{
            width: '100%',
            height: DESIGN_HEIGHT * scale,
          }}
        >
          <div
            className="certificate-screen-scaler absolute left-0 top-0 origin-top-left"
            style={{
              width: DESIGN_WIDTH,
              height: DESIGN_HEIGHT,
              transform: `scale(${scale})`,
            }}
          >
            {renderCertificate()}
          </div>
        </div>
      </div>

      {showActions && (
        <p className="print:hidden mt-3 text-3xs text-slate-500 text-center leading-relaxed max-w-4xl">
          For an exact PDF: in the print dialog set <strong>Margins → None</strong>,{' '}
          <strong>Scale → 100 (Default)</strong>, tick{' '}
          <strong>Background graphics</strong>, and keep{' '}
          <strong>Landscape</strong> orientation.
        </p>
      )}
    </div>
  );
}
