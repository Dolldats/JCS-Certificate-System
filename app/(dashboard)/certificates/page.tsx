'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  eventsApi,
  participantsApi,
  certificatesApi,
  templatesApi,
} from '../../../services/api';
import {
  Event,
  Participant,
  Certificate,
  CertificateTemplate,
  CertificateType,
  Auxiliary,
} from '../../../types';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { CertificateModal } from '../../../components/certificates/CertificateModal';
import { EditCertificateModal } from '../../../components/certificates/EditCertificateModal';
import {
  Award,
  Search,
  Eye,
  Pencil,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

const CERTIFICATE_TYPES: CertificateType[] = [
  'Certificate of Participation',
  'Certificate of Merit',
  'Certificate of Excellence',
  'Certificate of Appreciation',
  'Certificate of Recognition',
  'Certificate of Attendance',
];

function CertificatesContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';
  const initialQuery = searchParams.get('q') || '';
  const { user, activeAuxiliary } = useAuth();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

  // Batch Generation Wizard State
  const [isGenerateWizardOpen, setIsGenerateWizardOpen] = useState(false);
  const [wizardEventId, setWizardEventId] = useState('');
  const [wizardParticipants, setWizardParticipants] = useState<Participant[]>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [wizardCertType, setWizardCertType] = useState<CertificateType>(
    'Certificate of Participation'
  );
  const [wizardTemplateId, setWizardTemplateId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
    const [certs, allEvents, allTemplates] = await Promise.all([
      certificatesApi.getAll(aux),
      eventsApi.getAll(aux),
      templatesApi.getAll(aux),
    ]);

    setCertificates(certs);
    setEvents(allEvents);
    setTemplates(allTemplates);

    if (allEvents.length > 0 && !wizardEventId) {
      setWizardEventId(allEvents[0].id);
    }
    if (allTemplates.length > 0 && !wizardTemplateId) {
      setWizardTemplateId(allTemplates[0].id);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeAuxiliary]);

  // Keep the search box in sync when arriving via the navbar search (?q=...).
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function loadWizardParticipants() {
      if (!wizardEventId) return;
      const parts = await participantsApi.getByEvent(wizardEventId);
      const verified = parts.filter((p) => p.verificationStatus === 'Verified');
      setWizardParticipants(verified);
      const unassigned = verified
        .filter((p) => !p.certificateAssigned)
        .map((p) => p.id);
      setSelectedParticipantIds(unassigned);
    }
    loadWizardParticipants();
  }, [wizardEventId]);

  const handleGenerateBatch = async () => {
    if (!wizardEventId || selectedParticipantIds.length === 0 || !user) return;
    setIsGenerating(true);
    try {
      await certificatesApi.generateBulk(
        wizardEventId,
        selectedParticipantIds,
        wizardCertType,
        wizardTemplateId,
        user
      );
      setIsGenerateWizardOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to generate certificates', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (certId: string, reason: string) => {
    if (!user) return;
    await certificatesApi.revoke(certId, reason, user);
    await loadData();
  };

  const handleUpdate = async (
    certId: string,
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
  ) => {
    if (!user) return;
    const updated = await certificatesApi.update(certId, updates, user);
    await loadData();
    // Keep the view modal in sync if it is open for this certificate.
    setSelectedCertificate((prev) => (prev && prev.id === certId ? updated : prev));
  };

  const filteredCertificates = certificates.filter((c) => {
    const matchesSearch =
      c.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jamaat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = !selectedEventId || c.eventId === selectedEventId;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesEvent && matchesType;
  });

  const typeTabs = [
    { id: 'all', label: 'All Certificates', count: certificates.length },
    ...CERTIFICATE_TYPES.map((t) => ({
      id: t,
      label: t.replace('Certificate of ', ''),
      count: certificates.filter((c) => c.type === t).length,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Certificate Management &amp; Issuance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate, preview, print, track, and verify certificates for validated event attendees.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsGenerateWizardOpen(true)}
          leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
        >
          Batch Certificate Generator
        </Button>
      </div>

      <Tabs
        tabs={typeTabs}
        activeTab={typeFilter}
        onChange={(id) => setTypeFilter(id)}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by serial #, participant, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            options={[
              { value: '', label: 'All Events' },
              ...events.map((evt) => ({
                value: evt.id,
                label: evt.name,
              })),
            ]}
          />
        </div>
      </div>

      {/* Certificate Repository Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading issued certificates...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">
                No certificates found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No issued certificates match your filters. Launch the generator to issue certificates to verified participants.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGenerateWizardOpen(true)}
              >
                Launch Generator
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Event &amp; Auxiliary</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-mono text-xs font-bold text-emerald-800">
                      {cert.certificateNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {cert.participantName}
                      </div>
                      <div className="text-3xs text-slate-500 font-mono">
                        {cert.memberId} &bull; {cert.jamaat}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {cert.eventName}
                      </div>
                      <Badge auxiliary={cert.auxiliary} className="mt-0.5" />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-700">
                        {cert.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(cert.issuedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge status={cert.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCertificate(cert)}
                          leftIcon={<Pencil className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCertificate(cert)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View / Print
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batch Certificate Generator Wizard Modal */}
      <Modal
        isOpen={isGenerateWizardOpen}
        onClose={() => setIsGenerateWizardOpen(false)}
        title="Batch Certificate Generator"
        description="Select verified event participants, certificate type, and template to produce certificates."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Event *"
              value={wizardEventId}
              onChange={(e) => setWizardEventId(e.target.value)}
              options={events.map((evt) => ({
                value: evt.id,
                label: `${evt.name} (${evt.auxiliary})`,
              }))}
            />

            <Select
              label="Certificate Type *"
              value={wizardCertType}
              onChange={(e) => setWizardCertType(e.target.value as CertificateType)}
              options={CERTIFICATE_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <Select
            label="Certificate Design Template *"
            value={wizardTemplateId}
            onChange={(e) => setWizardTemplateId(e.target.value)}
            options={templates.map((tmpl) => ({
              value: tmpl.id,
              label: `${tmpl.name} (${tmpl.orientation})`,
            }))}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>
                Verified Participants ({selectedParticipantIds.length} of{' '}
                {wizardParticipants.length} selected)
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedParticipantIds(
                    selectedParticipantIds.length === wizardParticipants.length
                      ? []
                      : wizardParticipants.map((p) => p.id)
                  )
                }
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                {selectedParticipantIds.length === wizardParticipants.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {wizardParticipants.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No verified participants in this event yet. Add or verify participants in the Participant Roster first.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {wizardParticipants.map((p) => {
                  const isChecked = selectedParticipantIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipantIds([
                                ...selectedParticipantIds,
                                p.id,
                              ]);
                            } else {
                              setSelectedParticipantIds(
                                selectedParticipantIds.filter((id) => id !== p.id)
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-semibold text-slate-900">
                            {p.fullName}
                          </span>
                          <span className="ml-2 font-mono text-3xs text-slate-400">
                            ({p.memberId})
                          </span>
                        </div>
                      </div>
                      <span className="text-3xs text-slate-500 font-medium">
                        {p.jamaat}, {p.dila}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateWizardOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGenerateBatch}
              isLoading={isGenerating}
              disabled={selectedParticipantIds.length === 0}
              leftIcon={<FileCheck className="w-4 h-4" />}
            >
              Generate {selectedParticipantIds.length} Certificates
            </Button>
          </div>
        </div>
      </Modal>

      <CertificateModal
        isOpen={Boolean(selectedCertificate)}
        onClose={() => setSelectedCertificate(null)}
        certificate={selectedCertificate}
        onRevoke={handleRevoke}
      />

      <EditCertificateModal
        isOpen={Boolean(editingCertificate)}
        onClose={() => setEditingCertificate(null)}
        certificate={editingCertificate}
        templates={templates}
        onSave={handleUpdate}
      />
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading certificates...</div>}>
      <CertificatesContent />
    </Suspense>
  );
}
