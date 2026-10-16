'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { eventsApi, participantsApi } from '../../../services/api';
import { Event, EventType, Auxiliary, EventStatus } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Tabs } from '../../../components/ui/Tabs';
import {
  CalendarDays,
  Plus,
  Search,
  Users,
  Award,
  MapPin,
  Calendar,
  Building,
  Pencil,
  Trash2,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

const EVENT_TYPES: EventType[] = [
  'Ijtema',
  'Competition',
  'Training',
  'Seminar',
  'Workshop',
  'Other',
];

const AUXILIARY_OPTIONS: Auxiliary[] = [
  'Khuddam',
  'Ansarullah',
  'Lajna',
  'Nasra',
  'Atfal',
];

export default function EventsPage() {
  const { user, activeAuxiliary } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Create Event Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    eventType: 'Ijtema' as EventType,
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    venue: '',
    auxiliary: (user?.assignedAuxiliary || 'Atfal') as Auxiliary,
    orgLevel: 'Ilaqa' as Event['orgLevel'],
    orgUnitName: 'Western Region',
    status: 'Upcoming' as EventStatus,
    theme: '',
  });

  const loadEvents = async () => {
    setLoading(true);
    const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
    const data = await eventsApi.getAll(aux);
    // Count the real roster per event instead of trusting the event record's
    // counters, which stay 0/0 when the backend doesn't maintain them.
    const withCounts = await Promise.all(
      data.map(async (event) => {
        try {
          const parts = await participantsApi.getByEvent(event.id);
          if (parts.length === 0) return event;
          return {
            ...event,
            participantsCount: parts.length,
            verifiedCount: parts.filter((p) => p.verificationStatus === 'Verified').length,
          };
        } catch {
          return event;
        }
      })
    );
    setEvents(withCounts);
    setLoading(false);
  };

  useEffect(() => {
    async function run() {
      await loadEvents();
    }
    run();
  }, [activeAuxiliary]);

  const handleAuxiliaryChange = (aux: Auxiliary) => {
    const isLajnaOrNasra = aux === 'Lajna' || aux === 'Nasra';
    setNewEvent({
      ...newEvent,
      auxiliary: aux,
      orgLevel: isLajnaOrNasra ? 'District' : 'Mulk',
      orgUnitName: isLajnaOrNasra ? 'District South' : 'National',
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const eventData = {
          name: newEvent.name,
          description: newEvent.description,
          eventType: newEvent.eventType,
          date: newEvent.date,
          endDate: newEvent.endDate || undefined,
          venue: newEvent.venue,
          auxiliary: newEvent.auxiliary,
          orgLevel: newEvent.orgLevel,
          orgUnitName: newEvent.orgUnitName,
          status: newEvent.status,
          createdBy: user.fullName,
          theme: newEvent.theme,
        };
      if (editingEventId) {
        await eventsApi.update(editingEventId, eventData, user);
      } else {
        await eventsApi.create(eventData, user);
      }
      const wasEditing = Boolean(editingEventId);
      setIsCreateOpen(false);
      setEditingEventId(null);
      setNewEvent({
        name: '',
        description: '',
        eventType: 'Ijtema',
        date: new Date().toISOString().split('T')[0],
        endDate: '',
        venue: '',
        auxiliary: (user?.assignedAuxiliary || 'Atfal') as Auxiliary,
        orgLevel: 'Ilaqa',
        orgUnitName: 'Western Region',
        status: 'Upcoming',
        theme: '',
      });
      await loadEvents();
      toast.success(wasEditing ? 'Event changes saved.' : 'Event created.');
    } catch (err) {
      console.error('Failed to save event', err);
      toast.error(err instanceof Error ? err.message : 'Could not save this event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = async (event: Event) => {
    const latest = await eventsApi.getById(event.id);
    const target = latest || event;
    setEditingEventId(target.id);
    setNewEvent({
      name: target.name,
      description: target.description,
      eventType: target.eventType,
      date: target.date,
      endDate: target.endDate || '',
      venue: target.venue,
      auxiliary: target.auxiliary,
      orgLevel: target.orgLevel,
      orgUnitName: target.orgUnitName,
      status: target.status,
      theme: target.theme || '',
    });
    setIsCreateOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!user || !eventToDelete) return;
    try {
      await eventsApi.delete(eventToDelete.id, user);
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.orgUnitName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || e.eventType === selectedType;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const typeTabs = [
    { id: 'all', label: 'All Types', count: events.length },
    ...EVENT_TYPES.map((t) => ({
      id: t,
      label: t,
      count: events.filter((e) => e.eventType === t).length,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Event Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, plan, and administer events across all five auxiliaries.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          size="md"
        >
          Create Event
        </Button>
      </div>

      <Tabs
        tabs={typeTabs}
        activeTab={selectedType}
        onChange={(id) => setSelectedType(id)}
      />

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by event name, venue, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-44">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Upcoming', label: 'Upcoming' },
                { value: 'Active', label: 'Active / In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Draft', label: 'Draft' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No events found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching events found. Try adjusting your search filters or create a new event.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              Create New Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge auxiliary={event.auxiliary} />
                  <div className="flex items-center gap-2">
                    <Badge status={event.status} />
                    <button type="button" onClick={() => void handleEditEvent(event)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" aria-label={`Edit ${event.name}`} title="Edit event">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => void handleDeleteEvent(event)} className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${event.name}`} title="Delete event">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-3xs uppercase font-extrabold tracking-wider text-emerald-700">
                    {event.eventType}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
                    {event.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {event.description}
                  </p>
                  {event.theme && (
                    <div className="text-2xs font-semibold text-emerald-800 mt-2 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      Theme: {event.theme}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-3xs bg-slate-100 px-1.5 py-0.5 rounded">
                      {event.orgLevel}: {event.orgUnitName}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-around text-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {event.verifiedCount} / {event.participantsCount}
                    </div>
                    <div className="text-3xs text-slate-500">Verified Members</div>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <div className="font-bold text-emerald-700">
                      {event.certificatesIssuedCount}
                    </div>
                    <div className="text-3xs text-slate-500">Certificates Issued</div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/participants?eventId=${event.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs" leftIcon={<Users className="w-3.5 h-3.5" />}>
                    Participants
                  </Button>
                </Link>
                <Link
                  href={`/certificates?eventId=${event.id}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full text-xs" leftIcon={<Award className="w-3.5 h-3.5" />}>
                    Certificates
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingEventId(null); }}
        title={editingEventId ? 'Update Auxiliary Event' : 'Create New Auxiliary Event'}
        description="Configure event information and organizational hierarchy."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Event Name *"
            value={newEvent.name}
            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            placeholder="e.g. Islamic Vacation Course / Regional Ijtema 2025"
            required
          />

          <Input
            label="Event Theme *"
            value={newEvent.theme}
            onChange={(e) => setNewEvent({ ...newEvent, theme: e.target.value })}
            placeholder="e.g. My Faith, My Identity"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Auxiliary *"
              value={newEvent.auxiliary}
              onChange={(e) => handleAuxiliaryChange(e.target.value as Auxiliary)}
              options={AUXILIARY_OPTIONS.map((a) => ({ value: a, label: `${a} Majlis` }))}
              disabled={user?.role === 'GENERAL_ADMIN'}
            />

            <Select
              label="Event Type *"
              value={newEvent.eventType}
              onChange={(e) =>
                setNewEvent({ ...newEvent, eventType: e.target.value as EventType })
              }
              options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={newEvent.endDate}
              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
            />
          </div>

          <Input
            label="Venue / Location *"
            value={newEvent.venue}
            onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
            placeholder="e.g. Jamia Ahmadiyya Ilaro, Ogun State"
            required
          />

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Organizational Structure Level</span>
              <span className="text-3xs text-emerald-700 font-mono">
                {newEvent.auxiliary === 'Lajna' || newEvent.auxiliary === 'Nasra'
                  ? 'District → Dilla → Jama\'at'
                  : 'Mulk → Ilaqa → Dilla → Jama\'at'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Hierarchy Level *"
                value={newEvent.orgLevel}
                onChange={(e) =>
                  setNewEvent({
                    ...newEvent,
                    orgLevel: e.target.value as Event['orgLevel'],
                  })
                }
                options={
                  newEvent.auxiliary === 'Lajna' || newEvent.auxiliary === 'Nasra'
                    ? [
                        { value: 'District', label: 'District' },
                        { value: 'Dila', label: 'Dilla' },
                        { value: 'Jamaat', label: 'Jama\'at' },
                      ]
                    : [
                        { value: 'Mulk', label: 'Mulk (National)' },
                        { value: 'Ilaqa', label: 'Ilaqa (Region)' },
                        { value: 'Dila', label: 'Dilla (Zone/Division)' },
                        { value: 'Jamaat', label: 'Jama\'at (Local)' },
                      ]
                }
              />

              <Input
                label="Unit / Region Name *"
                value={newEvent.orgUnitName}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, orgUnitName: e.target.value })
                }
                placeholder="e.g. Western Region, Lagos Dilla, or Ilasamaja"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Description
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              placeholder="Provide context on courses, competitions, and participants..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {editingEventId ? 'Save Event Changes' : 'Save &amp; Create Event'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event?"
        description={
          eventToDelete
            ? `Delete “${eventToDelete.name}” and its event record? Participants and certificates linked to it will be orphaned.`
            : undefined
        }
        confirmLabel="Yes, Delete"
        tone="danger"
        successTitle="Deleted Successfully!"
        successDescription={
          eventToDelete
            ? `The “${eventToDelete.name}” event record has been permanently deleted.`
            : undefined
        }
      />
    </div>
  );
}
