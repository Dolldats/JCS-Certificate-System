'use client';

import React, { useState } from 'react';
import { Certificate, CertificateTemplate } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CertificatePreview } from './CertificatePreview';
import { INITIAL_TEMPLATES } from '../../services/mockData';
import { AlertTriangle } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  onRevoke?: (certId: string, reason: string) => Promise<void>;
}

export function CertificateModal({
  isOpen,
  onClose,
  certificate,
  onRevoke,
}: CertificateModalProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!certificate) return null;

  const template: CertificateTemplate =
    INITIAL_TEMPLATES.find((t) => t.id === certificate.templateId) || INITIAL_TEMPLATES[0];

  const handleRevokeSubmit = async () => {
    if (!revokeReason.trim() || !onRevoke) return;
    setIsLoading(true);
    try {
      await onRevoke(certificate.id, revokeReason);
      setIsRevoking(false);
      onClose();
    } catch (err) {
      console.error('Failed to revoke certificate', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRevoking ? 'Revoke Certificate' : 'Certificate Details & Preview'}
      description={
        isRevoking
          ? `Revoking certificate ${certificate.certificateNumber} will record an audit trail.`
          : `Issued to ${certificate.participantName} (${certificate.memberId})`
      }
      maxWidth="5xl"
      footer={
        isRevoking ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRevoking(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRevokeSubmit}
              isLoading={isLoading}
              disabled={!revokeReason.trim()}
            >
              Confirm Revocation
            </Button>
          </>
        ) : (
          <>
            {certificate.status === 'Issued' && onRevoke && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<AlertTriangle className="w-4 h-4" />}
                onClick={() => setIsRevoking(true)}
              >
                Revoke Certificate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </>
        )
      }
    >
      {isRevoking ? (
        <div className="space-y-4 py-2">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Warning: Action will be recorded in audit log</span>
            </div>
            <p>
              Revoking marks the certificate status as &quot;Revoked&quot; and invalidates future verification scans.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Revocation *
            </label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Disqualified attendee, data correction, or duplicate issue..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-2">
          <CertificatePreview
            certificate={certificate}
            template={template}
            showActions={true}
          />
        </div>
      )}
    </Modal>
  );
}
