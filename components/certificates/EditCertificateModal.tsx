'use client';

import React, { useEffect, useState } from 'react';
import { Certificate, CertificateTemplate, CertificateType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CertificatePreview } from './CertificatePreview';
import { getRegionLabel } from './certificateText';
import { INITIAL_TEMPLATES } from '../../services/mockData';
import { PencilLine, Save } from 'lucide-react';

interface EditCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  templates: CertificateTemplate[];
  onSave: (
    certificateId: string,
    updates: Partial<
      Pick<
        Certificate,
        | 'participantName'
        | 'dila'
        | 'ilaqa'
        | 'jamaat'
        | 'eventName'
        | 'eventDate'
        | 'venue'
        | 'theme'
        | 'type'
        | 'templateId'
      >
    >
  ) => Promise<void>;
}

const CERTIFICATE_TYPES: CertificateType[] = [
  'Certificate of Participation',
  'Certificate of Merit',
  'Certificate of Excellence',
  'Certificate of Appreciation',
  'Certificate of Recognition',
  'Certificate of Attendance',
];

export function EditCertificateModal({
  isOpen,
  onClose,
  certificate,
  templates,
  onSave,
}: EditCertificateModalProps) {
  const [form, setForm] = useState({
    participantName: '',
    dila: '',
    ilaqa: '',
    jamaat: '',
    eventName: '',
    eventDate: '',
    venue: '',
    theme: '',
    type: 'Certificate of Participation' as CertificateType,
    templateId: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (certificate && isOpen) {
      setForm({
        participantName: certificate.participantName,
        dila: certificate.dila,
        ilaqa: certificate.ilaqa || '',
        jamaat: certificate.jamaat,
        eventName: certificate.eventName,
        eventDate: certificate.eventDate,
        venue: certificate.venue || '',
        theme: certificate.theme || '',
        type: certificate.type,
        templateId: certificate.templateId,
      });
    }
  }, [certificate, isOpen]);

  if (!certificate) return null;

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const previewTemplate: CertificateTemplate =
    templates.find((t) => t.id === form.templateId) ||
    INITIAL_TEMPLATES.find((t) => t.id === form.templateId) ||
    INITIAL_TEMPLATES[0];

  const handleSave = async () => {
    if (!form.participantName.trim()) return;
    setIsSaving(true);
    try {
      await onSave(certificate.id, {
        participantName: form.participantName.trim(),
        dila: form.dila.trim(),
        ilaqa: form.ilaqa.trim(),
        jamaat: form.jamaat.trim(),
        eventName: form.eventName.trim(),
        eventDate: form.eventDate.trim(),
        venue: form.venue.trim(),
        theme: form.theme.trim(),
        type: form.type,
        templateId: form.templateId,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update certificate', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Certificate ${certificate.certificateNumber}`}
      description="Fix names, places, dates or swap the design — the preview updates live. Serial number and member ID stay fixed."
      maxWidth="5xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!form.participantName.trim()}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <PencilLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recipient</span>
          </div>
          <Input
            label="Participant Name *"
            value={form.participantName}
            onChange={(e) => set('participantName', e.target.value)}
            placeholder="e.g. Kabeer Olasunkanmi"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={getRegionLabel({ auxiliary: certificate.auxiliary })}
              value={form.ilaqa}
              onChange={(e) => set('ilaqa', e.target.value)}
              placeholder="e.g. South West"
            />
            <Input
              label="Dilla"
              value={form.dila}
              onChange={(e) => set('dila', e.target.value)}
              placeholder="e.g. Lagos"
            />
          </div>
          <Input
            label="Jama'at"
            value={form.jamaat}
            onChange={(e) => set('jamaat', e.target.value)}
            placeholder="e.g. Ilasamaja"
          />

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pt-2 border-t border-slate-100">
            <PencilLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Event Details</span>
          </div>
          <Input
            label="Event Name"
            value={form.eventName}
            onChange={(e) => set('eventName', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Event Date"
              value={form.eventDate}
              onChange={(e) => set('eventDate', e.target.value)}
            />
            <Input
              label="Venue"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
          </div>
          <Input
            label="Theme"
            value={form.theme}
            onChange={(e) => set('theme', e.target.value)}
            placeholder="e.g. My Faith, My Identity"
          />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <Select
              label="Certificate Type"
              value={form.type}
              onChange={(e) => set('type', e.target.value as CertificateType)}
              options={CERTIFICATE_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <Select
              label="Design Template"
              value={form.templateId}
              onChange={(e) => set('templateId', e.target.value)}
              options={templates.map((tmpl) => ({
                value: tmpl.id,
                label: tmpl.name,
              }))}
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-slate-100/70 rounded-xl p-3 border border-slate-200">
          <p className="text-3xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Live Preview
          </p>
          <CertificatePreview
            certificate={{
              ...certificate,
              participantName: form.participantName || '________________',
              dila: form.dila,
              ilaqa: form.ilaqa,
              jamaat: form.jamaat,
              eventName: form.eventName,
              eventDate: form.eventDate,
              venue: form.venue,
              theme: form.theme,
              type: form.type,
              templateId: form.templateId,
            }}
            template={previewTemplate}
            previewMode={false}
            showActions={false}
          />
        </div>
      </div>
    </Modal>
  );
}
