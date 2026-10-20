'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import {
  eventsApi,
  participantsApi,
  certificatesApi,
  templatesApi,
  cleanTheme,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { CertificateModal } from '../../../components/certificates/CertificateModal';
import { CertificatePreview } from '../../../components/certificates/CertificatePreview';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { FilterDropdown } from '../../../components/ui/FilterDropdown';
import { EditCertificateModal } from '../../../components/certificates/EditCertificateModal';
import {
  Award,
  Search,
  Eye,
  Pencil,
  Sparkles,
  FileCheck,
  FileOutput,
  Printer,
  Download,
  Trash2,
  RefreshCw,
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

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CertificatesContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';
  const initialQuery = searchParams.get('q') || '';
  const { user, activeAuxiliary } = useAuth();
  const { toast } = useToast();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [bulkQueue, setBulkQueue] = useState<Certificate[] | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);

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
  const [certificateNumberToVerify, setCertificateNumberToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isVerifyingCertificate, setIsVerifyingCertificate] = useState(false);
  // The event is the source of truth for its own facts: venue, auxiliary,
  // theme and dates always follow the current event record so editing the
  // event updates every certificate automatically.
  const enrichCertificates = (certs: Certificate[], allEvents: Event[]) =>
    certs.map((c) => {
      const event = allEvents.find((e) => e.id === c.eventId);
      if (!event) return c;
      const range =
        event.endDate && event.endDate !== event.date
          ? `${event.date} to ${event.endDate}`
          : event.date;
      return {
        ...c,
        venue: event.venue || c.venue || '',
        auxiliary: event.auxiliary || c.auxiliary,
        theme: cleanTheme(event.theme || c.theme),
        eventDate: range || c.eventDate,
      };
    });

  const loadData = async () => {
    setLoading(true);

    try {
      const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
      const [certs, allEvents, allTemplates] = await Promise.all([
        certificatesApi.getAll(aux),
        eventsApi.getAll(aux),
        templatesApi.getActive(aux),
      ]);

      setCertificates(enrichCertificates(certs, allEvents));
      setEvents(allEvents);
      setTemplates(allTemplates);

      if (allEvents.length > 0 && !wizardEventId) setWizardEventId(allEvents[0].id);
      setWizardTemplateId((currentTemplateId) =>
        allTemplates.some((template) => template.id === currentTemplateId)
          ? currentTemplateId
          : allTemplates[0]?.id || ''
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load certificate data from the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await loadData();
    }
    run();
  }, [activeAuxiliary]);

  useEffect(() => {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(selectedEventId)) return;
    let cancelled = false;
    certificatesApi.getByEvent(selectedEventId).then((data) => {
      if (!cancelled) setCertificates(enrichCertificates(data, events));
    }).catch((error) => {
      console.error('Could not load certificates for the selected event', error);
      if (!cancelled) toast.error(error instanceof Error ? error.message : 'Could not load certificates for this event.');
    });
    return () => { cancelled = true; };
  }, [selectedEventId, events, toast]);

  // Keep the search box in sync when arriving via the navbar search (?q=...).
  const navbarQuery = searchParams.get('q') || '';
  const [prevNavbarQuery, setPrevNavbarQuery] = useState(navbarQuery);
  if (navbarQuery !== prevNavbarQuery) {
    setPrevNavbarQuery(navbarQuery);
    setSearchQuery(navbarQuery);
  }

  useEffect(() => {
    async function loadWizardParticipants() {
      if (!wizardEventId) return;
      try {
        const parts = await participantsApi.getByEvent(wizardEventId);
        const verified = parts.filter((p) => p.verificationStatus === 'Verified');
        setWizardParticipants(verified);
        const alreadyCertified = new Set(
          certificates
            .filter((certificate) => certificate.eventId === wizardEventId && certificate.status !== 'Revoked')
            .map((certificate) => certificate.participantId)
        );
        const unassigned = verified
          .filter((p) => !p.certificateAssigned && !alreadyCertified.has(p.id))
          .map((p) => p.id);
        setSelectedParticipantIds(unassigned);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load verified participants for this event.');
      }
    }
    loadWizardParticipants();
  }, [wizardEventId, certificates, toast]);

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
      toast.success('Certificates generated for the selected participants.');
    } catch (err) {
      console.error('Failed to generate certificates', err);
      const message = err instanceof Error ? err.message : 'Could not generate certificates.';
      await loadData();
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (certId: string, reason: string) => {
    if (!user) return;

    try {
      await certificatesApi.revoke(certId, reason, user);
      await loadData();
      toast.success('Certificate revoked and audit logged.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke this certificate.');
      throw error;
    }
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

  const handleVerifyCertificate = async () => {
    if (!certificateNumberToVerify.trim()) return;
    setIsVerifyingCertificate(true);
    try {
      const result = await certificatesApi.verifyByNumber(certificateNumberToVerify.trim());
      const record = result && typeof result === 'object' ? result as Record<string, unknown> : null;
      if (!record) {
        setVerificationResult('Certificate not found');
      } else if (typeof record.isValid === 'boolean' || typeof record.valid === 'boolean') {
        setVerificationResult((record.isValid ?? record.valid) ? 'Authentic' : 'Invalid or revoked');
      } else {
        setVerificationResult(String(record.authenticity || record.message || (record.status === 'Revoked' ? 'Revoked' : record.status || 'Authentic')));
      }
    } catch (error) {
      setVerificationResult(error instanceof Error ? error.message : 'Certificate verification failed');
    } finally {
      setIsVerifyingCertificate(false);
    }
  };

  const handleViewCertificate = async (certificate: Certificate) => {
    // The detail route doesn't send venue/auxiliary — fill both from the
    // event so the modal and print match the enriched list.
    const withEventDetails = async (cert: Certificate): Promise<Certificate> => {
      try {
        const evt = await eventsApi.getById(cert.eventId);
        if (!evt) return cert;
        const range =
          evt.endDate && evt.endDate !== evt.date ? `${evt.date} to ${evt.endDate}` : evt.date;
        return {
          ...cert,
          venue: evt.venue || cert.venue || '',
          auxiliary: evt.auxiliary || cert.auxiliary,
          theme: cleanTheme(evt.theme || cert.theme),
          eventDate: range || cert.eventDate,
        };
      } catch {
        return cert;
      }
    };
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(certificate.id)) {
      try {
        const details = await certificatesApi.getById(certificate.id);
        if (details.memberId && (!details.dila || !details.jamaat)) {
          try {
            const verification = await participantsApi.verifyMemberId(details.memberId, details.auxiliary);
            if (verification.status === 'Verified' && verification.member) {
              setSelectedCertificate(await withEventDetails({
                ...details,
                dila: details.dila || verification.member.dila,
                jamaat: details.jamaat || verification.member.jamaat,
              }));
              return;
            }
          } catch {
            // Show the saved certificate values if the member directory is unavailable.
          }
        }
        setSelectedCertificate(await withEventDetails(details));
        return;
      } catch {
        // Keep the already-loaded certificate available if the detail route is unavailable.
      }
    }
    setSelectedCertificate(await withEventDetails(certificate));
  };

  const handleGenerateFile = async (certificate: Certificate) => {

    try {
      const blob = await certificatesApi.generateFile(certificate.id);
      downloadBlob(blob, `${certificate.certificateNumber}.pdf`);
      await loadData();
      toast.success('Certificate PDF is ready and downloading.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not generate this certificate PDF.');
    }
  };

  const handlePreviewEventPdfs = async () => {
    if (!selectedEventId) return;
    const queue = certificates.filter(
      (c) => c.eventId === selectedEventId && c.status !== 'Revoked'
    );
    if (queue.length === 0) {
      toast.info('No certificates to preview for this event yet. Generate some first.');
      return;
    }
    // Fill each card's Dilla/Jama'at from the event roster — the raw
    // certificate rows don't always carry member details.
    try {
      const parts = await participantsApi.getByEvent(selectedEventId);
      const byMember = new Map(parts.map((p) => [p.memberId.toUpperCase(), p]));
      setBulkQueue(
        queue.map((c) => {
          const p = byMember.get(c.memberId.toUpperCase());
          if (!p) return c;
          return {
            ...c,
            participantName: c.participantName || p.fullName,
            auxiliary: c.auxiliary || p.auxiliary,
            dila: c.dila || p.dila,
            jamaat: c.jamaat || p.jamaat,
          };
        })
      );
    } catch {
      setBulkQueue(queue);
    }
    // Bulk print CSS keys off this class (stacked pages vs single fixed page).
    document.body.classList.add('printing-bulk');
  };

  const closeBulkQueue = () => {
    document.body.classList.remove('printing-bulk');
    setBulkQueue(null);
  };

  const handleDeleteCertificate = (certificate: Certificate) => {
    setCertificateToDelete(certificate);
  };

  const confirmDeleteCertificate = async () => {
    if (!certificateToDelete) return;

    // Let the dialog surface the real reason instead of contradicting itself.
    await certificatesApi.delete(certificateToDelete.id, user || undefined, certificateToDelete);
    await loadData();
    toast.success(`Certificate ${certificateToDelete.certificateNumber} was deleted.`);
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

  // Certificate-type filter options — a dropdown, because the horizontal tab
  // strip overflowed and cut off the later types.
  const typeTabs = [
    { value: 'all', label: 'All Certificates', count: certificates.length },
    ...CERTIFICATE_TYPES.map((t) => ({
      value: t,
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => void loadData()}
            disabled={loading}
            leftIcon={
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            }
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsGenerateWizardOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            Batch Certificate Generator
          </Button>
          {selectedEventId && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(selectedEventId) && (
            <Button variant="outline" size="md" onClick={() => void handlePreviewEventPdfs()} leftIcon={<Eye className="w-4 h-4" />}>
              Preview Bulk Event PDFs
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input label="Verify certificate number" value={certificateNumberToVerify} onChange={(event) => setCertificateNumberToVerify(event.target.value)} placeholder="e.g. JCS-ATF-2026-0001" />
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleVerifyCertificate()} isLoading={isVerifyingCertificate} disabled={!certificateNumberToVerify.trim()}>
            Verify Certificate
          </Button>
          {verificationResult && <p role="status" className="text-xs font-semibold text-slate-700">Result: {verificationResult}</p>}
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by serial #, participant, or event..."
            className="focus:border-slate-300 focus:ring-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <FilterDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeTabs}
            className="w-full sm:w-56"
          />
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
                        {!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(cert.id) && (
                          <Button variant="outline" size="sm" onClick={() => setEditingCertificate(cert)} leftIcon={<Pencil className="w-3.5 h-3.5" />}>
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleViewCertificate(cert)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Preview
                        </Button>
                        {cert.status === 'Issued' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(cert.id) && !cert.filePath && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => void handleGenerateFile(cert)} leftIcon={<FileOutput className="h-3.5 w-3.5" />}>
                              Generate PDF
                            </Button>
                          </>
                        )}
                        {cert.status === 'Issued' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(cert.id) && !!cert.filePath && (
                          <span className="text-3xs font-semibold text-slate-400">PDF ready — open Preview to print</span>
                        )}
                        {cert.status === 'Revoked' && (
                          <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => void handleDeleteCertificate(cert)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                            Delete
                          </Button>
                        )}
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
            disabled={templates.length === 0}
            options={[
              {
                value: '',
                label: templates.length > 0 ? 'Select an active saved template' : 'No active saved templates found',
              },
              ...templates.map((tmpl) => ({
                value: tmpl.id,
                label: `${tmpl.name} (${tmpl.orientation})`,
              })),
            ]}
          />
          {templates.length === 0 && (
            <p className="-mt-2 text-xs text-amber-700">
              Save and activate a design in the{' '}
              <a href="/templates" className="font-semibold underline underline-offset-2">
                Certificate Templates
              </a>{' '}
              page first, then reopen this generator.
            </p>
          )}

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
              disabled={selectedParticipantIds.length === 0 || !wizardTemplateId}
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
        templates={templates}
        onRevoke={handleRevoke}
      />

      <Modal
        isOpen={Boolean(bulkQueue)}
        onClose={closeBulkQueue}
        title={
          bulkQueue && bulkQueue.length > 0
            ? `Event Certificates (${bulkQueue.length})`
            : 'Event Certificates'
        }
        description="Every issued certificate for this event — preview all, print all, or download the PDFs."
        maxWidth="5xl"
      >
        <div className="space-y-6">
          {(bulkQueue || []).map((cert) => {
            const template = templates.find((t) => t.id === cert.templateId) || templates[0];
            return (
              <div key={cert.id} className="overflow-hidden rounded-2xl border border-slate-200 print:overflow-visible print:rounded-none print:border-0 print:break-after-page print:last:break-after-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 print:hidden">
                  <div className="text-xs">
                    <span className="font-mono font-bold text-emerald-800">{cert.certificateNumber}</span>
                    <span className="ml-2 font-semibold text-slate-700">{cert.participantName}</span>
                  </div>
                  <span className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
                    {cert.status}
                  </span>
                </div>
                {template ? (
                  <CertificatePreview
                    certificate={cert}
                    template={template}
                    previewMode={true}
                    showActions={false}
                  />
                ) : (
                  <p className="p-6 text-center text-xs text-slate-500">
                    No template available to render this certificate.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={closeBulkQueue}>
            Close
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>
            Print All
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Save All as PDFs
          </Button>
        </div>
      </Modal>

      <EditCertificateModal
        isOpen={Boolean(editingCertificate)}
        onClose={() => setEditingCertificate(null)}
        certificate={editingCertificate}
        templates={templates}
        onSave={handleUpdate}
      />

      <ConfirmDialog
        isOpen={Boolean(certificateToDelete)}
        onClose={() => setCertificateToDelete(null)}
        onConfirm={confirmDeleteCertificate}
        title="Delete Certificate?"
        description={
          certificateToDelete
            ? `Permanently delete certificate ${certificateToDelete.certificateNumber} issued to ${certificateToDelete.participantName}? This cannot be undone.`
            : undefined
        }
        confirmLabel="Yes, Delete"
        tone="danger"
        successTitle="Deleted Successfully!"
        successDescription={
          certificateToDelete
            ? `Certificate ${certificateToDelete.certificateNumber} has been permanently deleted.`
            : undefined
        }
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
