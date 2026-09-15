'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { eventsApi, participantsApi } from '../../../services/api';
import { Event, Participant, Auxiliary } from '../../../types';
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
import {
  Users,
  UserPlus,
  Upload,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function ParticipantsContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';
  const { user, activeAuxiliary } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Single Add Modal
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [singleMemberId, setSingleMemberId] = useState('');
  const [isVerifyingSingle, setIsVerifyingSingle] = useState(false);
  const [singleVerificationResult, setSingleVerificationResult] = useState<any>(null);

  // Bulk Upload Modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<any>(null);

  useEffect(() => {
    async function initEvents() {
      const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
      const allEvents = await eventsApi.getAll(aux);
      setEvents(allEvents);

      if (allEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(allEvents[0].id);
      }
    }
    initEvents();
  }, [activeAuxiliary]);

  const loadParticipants = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    const data = await participantsApi.getByEvent(selectedEventId);
    setParticipants(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedEventId) {
      loadParticipants();
    }
  }, [selectedEventId]);

  const activeEvent = events.find((e) => e.id === selectedEventId);

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !user || !singleMemberId.trim()) return;
    setIsVerifyingSingle(true);
    try {
      const res = await participantsApi.addSingle(
        selectedEventId,
        singleMemberId.trim(),
        user
      );
      setSingleVerificationResult(res);
      await loadParticipants();
      setSingleMemberId('');
      setTimeout(() => {
        setIsSingleAddOpen(false);
        setSingleVerificationResult(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to add participant', err);
    } finally {
      setIsVerifyingSingle(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!selectedEventId || !user || !bulkInputText.trim()) return;
    setIsBulkProcessing(true);
    try {
      const ids = bulkInputText
        .split(/[\n,;]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      const result = await participantsApi.bulkUpload(selectedEventId, ids, user);
      setBulkSummary(result);
      await loadParticipants();
    } catch (err) {
      console.error('Failed to process bulk upload', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleSampleBulkFill = () => {
    setBulkInputText(
      'ATF-2025-01\nATF-2025-02\nATF-2025-03\nATF-2025-04\nINVALID-999\nMK-UNKNOWN-001'
    );
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jamaat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || p.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = participants.filter((p) => p.verificationStatus === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Participant Verification &amp; Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Verify Member IDs via central Jama&apos;at API individually or in bulk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkOpen(true)}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Bulk Excel/CSV Import
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSingleAddOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Member ID
          </Button>
        </div>
      </div>

      {/* Event Selector Card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex-1 max-w-md">
            <Select
              label="Select Active Event to Manage Participants"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              options={events.map((evt) => ({
                value: evt.id,
                label: `${evt.name} (${evt.auxiliary} - ${evt.orgUnitName})`,
              }))}
            />
          </div>

          {activeEvent && (
            <div className="flex items-center gap-6 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block text-3xs uppercase font-semibold">
                  Event Scope
                </span>
                <Badge auxiliary={activeEvent.auxiliary} />
              </div>
              <div>
                <span className="text-slate-400 block text-3xs uppercase font-semibold">
                  Total Enrolled
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {participants.length}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-3xs uppercase font-semibold">
                  Verified Clean
                </span>
                <span className="font-bold text-emerald-700 text-sm">
                  {verifiedCount}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by Member ID, name, or Jama'at..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Verification States' },
                { value: 'Verified', label: '✅ Verified' },
                { value: 'Not Found', label: '❌ Not Found' },
                { value: 'Invalid', label: '⚠️ Invalid Format' },
                { value: 'Duplicate', label: '⚠️ Duplicate' },
                { value: 'Verification Failed', label: '🚫 Failed / Inactive' },
              ]}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadParticipants}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Roster Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Checking records with Jama&apos;at API...
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">
                No participants in roster
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No participants matched your filter or none have been enrolled for this event yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSingleAddOpen(true)}
              >
                Add First Participant
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Participant Name</TableHead>
                  <TableHead>Auxiliary &amp; Region</TableHead>
                  <TableHead>Jama&apos;at</TableHead>
                  <TableHead>Verification Status</TableHead>
                  <TableHead>Certificate Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {p.memberId}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {p.fullName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge auxiliary={p.auxiliary} />
                        <span className="text-xs text-slate-500">{p.dila}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {p.jamaat}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge status={p.verificationStatus} />
                        {p.verificationDetails && (
                          <div className="text-3xs text-slate-400 max-w-xs truncate">
                            {p.verificationDetails}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.certificateAssigned ? (
                        <span className="inline-flex items-center gap-1 text-2xs bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                          {p.certificateAssigned}
                        </span>
                      ) : p.verificationStatus === 'Verified' ? (
                        <span className="text-3xs text-emerald-700 font-medium">
                          Ready for Issuance
                        </span>
                      ) : (
                        <span className="text-3xs text-slate-400">Not Eligible</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Single Add Modal */}
      <Modal
        isOpen={isSingleAddOpen}
        onClose={() => {
          setIsSingleAddOpen(false);
          setSingleVerificationResult(null);
        }}
        title="Add &amp; Verify Individual Member"
        description="Enter the member ID. The system queries the Jama'at Member API automatically."
        maxWidth="md"
      >
        <form onSubmit={handleSingleAdd} className="space-y-4">
          <Input
            label="Jama'at Member ID *"
            value={singleMemberId}
            onChange={(e) => setSingleMemberId(e.target.value)}
            placeholder="e.g. ATF-2025-01 or MK-10293"
            helperText="Format: ATF-XXXX (Atfal), MK-XXXX (Khuddam), LAJ-XXXX (Lajna)"
            required
          />

          {singleVerificationResult && (
            <div className="p-3.5 rounded-xl border bg-slate-50 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Badge status={singleVerificationResult.verificationStatus} />
                <span>{singleVerificationResult.fullName}</span>
              </div>
              <p className="text-slate-500 text-2xs">
                {singleVerificationResult.verificationDetails}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSingleAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isVerifyingSingle}
            >
              Verify &amp; Add
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => {
          setIsBulkOpen(false);
          setBulkSummary(null);
          setBulkInputText('');
        }}
        title="Bulk Member Verification &amp; Import"
        description="Upload or paste a list of Member IDs from Excel or CSV."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {!bulkSummary ? (
            <>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Paste Member IDs (one per line or comma-separated)
                </label>
                <button
                  type="button"
                  onClick={handleSampleBulkFill}
                  className="text-2xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  ⚡ Insert Demo Test Batch
                </button>
              </div>

              <textarea
                value={bulkInputText}
                onChange={(e) => setBulkInputText(e.target.value)}
                placeholder="ATF-2025-01&#10;ATF-2025-02&#10;ATF-2025-03&#10;..."
                rows={7}
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />

              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-2xs leading-relaxed">
                  The system validates each Member ID against the central Jama&apos;at API and returns an instant breakdown of: <strong>Verified</strong>, <strong>Not Found</strong>, <strong>Invalid</strong>, <strong>Duplicate</strong>, and <strong>Failed</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkSubmit}
                  isLoading={isBulkProcessing}
                  disabled={!bulkInputText.trim()}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Run Central Verification
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Bulk Verification Completed
                </h4>
                <p className="text-xs text-slate-500">
                  Processed {bulkSummary.totalRows} participant Member IDs
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-lg font-bold text-emerald-700">
                    {bulkSummary.verifiedCount}
                  </div>
                  <div className="text-3xs font-semibold text-emerald-800">Verified</div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-lg font-bold text-rose-700">
                    {bulkSummary.notFoundCount}
                  </div>
                  <div className="text-3xs font-semibold text-rose-800">Not Found</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-lg font-bold text-amber-700">
                    {bulkSummary.invalidCount}
                  </div>
                  <div className="text-3xs font-semibold text-amber-800">Invalid Format</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                  <div className="text-lg font-bold text-slate-700">
                    {bulkSummary.duplicateCount}
                  </div>
                  <div className="text-3xs font-semibold text-slate-800">Duplicate</div>
                </div>
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <div className="text-lg font-bold text-red-700">
                    {bulkSummary.failedCount}
                  </div>
                  <div className="text-3xs font-semibold text-red-800">Failed / Inactive</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsBulkOpen(false);
                    setBulkSummary(null);
                  }}
                >
                  Done &amp; View Roster
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function ParticipantsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading participant roster...</div>}>
      <ParticipantsContent />
    </Suspense>
  );
}
