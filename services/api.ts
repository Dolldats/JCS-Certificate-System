import { jamaatMemberApi } from './jamaatMemberApi';
import { backendFetch, getAuthToken } from './backendClient';

import {
  User,
  Event,
  EventType,
  EventStatus,
  Participant,
  VerificationStatus,
  CertificateTemplate,
  Certificate,
  CertificateStatus,
  AuditLog,
  JamaatMember,
  BulkVerificationResult,
  Auxiliary,
  CertificateType,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_PARTICIPANTS,
  INITIAL_TEMPLATES,
  INITIAL_CERTIFICATES,
  INITIAL_AUDIT_LOGS,
} from './mockData';

/** Loose JSON object shape returned by the central backend API. */
type BackendRecord = Record<string, unknown>;

const bStr = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const bNum = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const bBool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const bRec = (value: unknown): BackendRecord | undefined =>
  typeof value === 'object' && value !== null ? (value as BackendRecord) : undefined;

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const LEGACY_DEMO_USERS = [
  { memberId: 'JMT-00101', fullName: 'Maulana Hafiz Tariq', email: 'tariq.admin@jamaat.org' },
  { memberId: 'MK-10293', fullName: 'Abdur Raob Akhryemi', email: 'sadr@khuddam.ng' },
  { memberId: 'ATF-60201', fullName: 'Bilal Farooq', email: 'atfal.sec@atfal.ng' },
  { memberId: 'LAJ-40912', fullName: 'Amatul Noor Khan', email: 'amatul.noor@lajna.org' },
  { memberId: 'ANS-30112', fullName: 'Dr. Munir Ahmad Zafar', email: 'munir.zafar@ansar.org' },
  { memberId: 'NAS-50118', fullName: 'Ahmad Rufai', email: 'ahmad.rufai@nasra.org' },
];

function isLegacyDemoUser(user: User): boolean {
  const memberId = String(user.memberId || '').trim().toUpperCase();
  const fullName = String(user.fullName || '').trim().toLowerCase();
  const email = String(user.email || '').trim().toLowerCase();
  return LEGACY_DEMO_USERS.some(
    (demo) => memberId === demo.memberId &&
      fullName === demo.fullName.toLowerCase() &&
      email === demo.email.toLowerCase()
  );
}

function isGeneratedMemberName(name: string): boolean {
  const cleanName = name.trim();
  return !cleanName || /^Brother\s+\S+$/i.test(cleanName) || /^Name unavailable$/i.test(cleanName);
}

async function lookupMemberProfile(memberId: string): Promise<Partial<JamaatMember> | null> {
  const cleanId = memberId.trim().toUpperCase();
  if (!cleanId) return null;

  const cachedParticipant = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS)
    .find((participant) =>
      participant.memberId.trim().toUpperCase() === cleanId &&
      !isGeneratedMemberName(participant.fullName)
    );
  if (cachedParticipant) {
    return {
      memberId: cleanId,
      fullName: cachedParticipant.fullName,
      auxiliary: cachedParticipant.auxiliary,
      dila: cachedParticipant.dila,
      jamaat: cachedParticipant.jamaat,
    };
  }

  if (getAuthToken()) {
    try {
      const response = await backendFetch<BackendRecord>(
        `Participants/verify/${encodeURIComponent(cleanId)}`
      );
      const profile = bRec(response.member) || bRec(response.profile) || response;
      const fullName = bStr(profile.fullName).trim();
      if (fullName && !isGeneratedMemberName(fullName)) {
        return {
          memberId: cleanId,
          fullName,
          email: bStr(profile.email) || undefined,
          auxiliary: profile.auxiliary as Auxiliary | undefined,
          dila: bStr(profile.dila) || undefined,
          jamaat: bStr(profile.jamaat) || undefined,
        };
      }
    } catch {
      // Try the configured Jama'at member directory next.
    }
  }

  try {
    const member = await jamaatMemberApi.lookupMember(cleanId);
    if (member?.fullName?.trim() && !isGeneratedMemberName(member.fullName)) return member;
  } catch {
    // The caller displays a neutral fallback when neither source resolves the ID.
  }
  return null;
}

async function resolveMemberNames(users: User[]): Promise<User[]> {
  return Promise.all(users.map(async (user) => {
    if (!isGeneratedMemberName(user.fullName)) return user;
    const member = await lookupMemberProfile(user.memberId);
    return member?.fullName?.trim()
      ? {
          ...user,
          fullName: member.fullName.trim(),
          email: member.email || user.email,
          dila: member.dila || user.dila,
          jamaat: member.jamaat || user.jamaat,
        }
      : { ...user, fullName: 'Name unavailable' };
  }));
}

function removeLegacyDemoUsers(users: User[]): User[] {
  return users.filter((user) => !isLegacyDemoUser(user));
}

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(`jcs_v2_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`jcs_v2_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to persist ${key}`, e);
  }
}

// AUDIT API
export const auditApi = {
  async getLogs(auxiliaryFilter?: Auxiliary): Promise<AuditLog[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await backendFetch<BackendRecord[]>('AuditLogs');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: AuditLog[] = res.map((item) => ({
            id: bStr(item.id, `log-${Date.now()}`),
            action: bStr(item.action, 'Login') as AuditLog['action'],
            adminName: bStr(item.performedBy || item.adminName, 'Admin'),
            adminRole: bStr(item.role || item.adminRole, 'SUPER_ADMIN') as AuditLog['adminRole'],
            auxiliary: item.auxiliary as Auxiliary | undefined,
            target: bStr(item.target || item.entityName, 'System'),
            details: bStr(item.details || item.description),
            timestamp: bStr(item.timestamp || item.createdAt, new Date().toISOString()),
            ipAddress: bStr(item.ipAddress, '127.0.0.1'),
          }));
          setStorage('audit_logs', mapped);
          if (!auxiliaryFilter) return mapped;
          return mapped.filter((l) => !l.auxiliary || l.auxiliary === auxiliaryFilter);
        }
      } catch (err) {
        console.warn('Backend AuditLogs fetch failed, using cached logs:', err);
      }
    }
    await delay(150);
    const logs = getStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    if (!auxiliaryFilter) return logs;
    return logs.filter((l) => !l.auxiliary || l.auxiliary === auxiliaryFilter);
  },

  async recordLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const logs = getStorage<AuditLog[]>('audit_logs', []);
    const newLog: AuditLog = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1 (local)',
    };
    setStorage('audit_logs', [newLog, ...logs]);
    return newLog;
  },
};

// AUTH & ADMINS API
export const authApi = {
  /** Returns the currently signed-in user from sessionStorage, or null if not logged in. */
  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('jcs_current_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  async getAllUsers(): Promise<User[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await backendFetch<BackendRecord[]>('Users');
        if (Array.isArray(res) && res.length > 0) {
          const mapped = removeLegacyDemoUsers(res.map((u) => {
            const member = bRec(u.member) || bRec(u.profile);
            return {
              id: bStr(u.id, `usr-${bStr(u.membershipId)}`),
              memberId: bStr(u.membershipId || u.memberId || member?.membershipId || member?.memberId).toUpperCase(),
              fullName: bStr(u.fullName || member?.fullName),
              email: bStr(u.email || member?.email),
              role: (bStr(u.role) === 'SuperAdmin' ? 'SUPER_ADMIN' : 'GENERAL_ADMIN') as User['role'],
              assignedAuxiliary: (u.auxiliary || member?.auxiliary) as Auxiliary | undefined,
              dila: bStr(u.dila || member?.dila) || undefined,
              jamaat: bStr(u.jamaat || member?.jamaat) || undefined,
            };
          }));
          const usersWithNames = await resolveMemberNames(mapped);
          setStorage('users', usersWithNames);
          return usersWithNames;
        }
      } catch (err) {
        console.warn('Backend Users fetch failed, using cached list:', err);
      }
    }
    await delay(100);
    const stored = removeLegacyDemoUsers(getStorage<User[]>('users', INITIAL_USERS));
    const usersWithNames = await resolveMemberNames(stored);
    setStorage('users', usersWithNames);
    return usersWithNames;
  },

  async assignGeneralAdmin(memberId: string, auxiliary: Auxiliary, performedBy: User): Promise<User> {
    const cleanId = memberId.trim().toUpperCase();
    const token = getAuthToken();
    const users = removeLegacyDemoUsers(getStorage<User[]>('users', INITIAL_USERS));
    const existing = users.find((u) => u.memberId.toUpperCase() === cleanId);
    const lookupPromise = lookupMemberProfile(cleanId);
    let backendAssignment: BackendRecord | undefined;
    let backendSucceeded = false;

    if (token) {
      try {
        backendAssignment = await backendFetch<BackendRecord>('Users/assign-admin', {
          method: 'POST',
          body: JSON.stringify({
            membershipId: cleanId,
            auxiliary,
          }),
        });
        backendSucceeded = true;
      } catch (err) {
        console.warn('Backend assign-admin failed, updating locally:', err);
      }
    }

    const directoryMember = await lookupPromise;
    const backendMember = bRec(backendAssignment?.member) || bRec(backendAssignment?.profile) || backendAssignment;
    const resolvedName = bStr(backendMember?.fullName) || directoryMember?.fullName ||
      (existing && !isGeneratedMemberName(existing.fullName) ? existing.fullName : '');

    if (!resolvedName && !backendSucceeded) {
      throw new Error('Could not find this Member ID in the member directory. Check the ID and try again.');
    }

    await delay(250);
    let updated: User;
    if (existing) {
      updated = {
        ...existing,
        fullName: resolvedName || 'Name unavailable',
        email: directoryMember?.email || bStr(backendMember?.email) || existing.email,
        dila: directoryMember?.dila || bStr(backendMember?.dila) || existing.dila,
        jamaat: directoryMember?.jamaat || bStr(backendMember?.jamaat) || existing.jamaat,
        role: 'GENERAL_ADMIN',
        assignedAuxiliary: auxiliary,
      };
      setStorage('users', users.map((u) => (u.id === existing.id ? updated : u)));
    } else {
      updated = {
        id: bStr(backendMember?.id, `usr-${Date.now()}`),
        memberId: cleanId,
        fullName: resolvedName || 'Name unavailable',
        email: directoryMember?.email || bStr(backendMember?.email),
        role: 'GENERAL_ADMIN',
        assignedAuxiliary: auxiliary,
        dila: directoryMember?.dila || bStr(backendMember?.dila) || undefined,
        jamaat: directoryMember?.jamaat || bStr(backendMember?.jamaat) || undefined,
      };
      setStorage('users', [...users, updated]);
    }

    await auditApi.recordLog({
      action: 'General Admin Assigned',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary,
      target: `${updated.fullName} (${cleanId})`,
      details: `Assigned as General Admin for ${auxiliary} Majlis by Super Admin.`,
    });

    return updated;
  },

  async revokeGeneralAdmin(userId: string, performedBy: User): Promise<void> {
    await delay(200);
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    setStorage('users', users.filter((u) => u.id !== userId));

    await auditApi.recordLog({
      action: 'General Admin Revoked',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: target.assignedAuxiliary,
      target: `${target.fullName} (${target.memberId})`,
      details: `General Admin assignment for ${target.assignedAuxiliary} was revoked.`,
    });
  },
};

// EVENTS API & MAPPER
function mapBackendEventToEvent(raw: BackendRecord): Event {
  const eventDate = bStr(raw.eventDate || raw.date, new Date().toISOString());
  const endDateRaw = bStr(raw.endDate);
  return {
    id: bStr(raw.id, `evt-${Date.now()}`),
    name: bStr(raw.name, 'Untitled Event'),
    description: bStr(raw.description),
    eventType: (raw.eventType === 'WorkShop' ? 'Workshop' : bStr(raw.eventType, 'Ijtema')) as EventType,
    date: eventDate.includes('T') ? eventDate.split('T')[0] : eventDate,
    endDate: endDateRaw ? (endDateRaw.includes('T') ? endDateRaw.split('T')[0] : endDateRaw) : undefined,
    venue: bStr(raw.venue),
    auxiliary: bStr(raw.auxiliary, 'Atfal') as Auxiliary,
    orgLevel: bStr(raw.organizationalLevel || raw.orgLevel, 'Ilaqa') as Event['orgLevel'],
    orgUnitName: bStr(raw.organizationalUnit || raw.orgUnitName, 'General'),
    status: bStr(raw.status, 'Upcoming') as EventStatus,
    createdAt: bStr(raw.createdAt, new Date().toISOString()),
    createdBy: bStr(raw.createdBy, 'System Admin'),
    participantsCount: bNum(raw.participantsCount ?? (Array.isArray(raw.participants) ? raw.participants.length : 0)),
    verifiedCount: bNum(raw.verifiedParticipantsCount ?? raw.verifiedCount ?? 0),
    certificatesIssuedCount: bNum(raw.certificatesIssuedCount ?? raw.certificatesCount ?? 0),
    theme: bStr(raw.theme) || undefined,
  };
}

export const eventsApi = {
  async getAll(auxiliary?: Auxiliary): Promise<Event[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const path = auxiliary ? `Events/auxiliary/${auxiliary}` : 'Events';
        const res = await backendFetch<BackendRecord[]>(path);
        if (Array.isArray(res)) {
          const mapped = res.map(mapBackendEventToEvent);
          // Sync into local storage cache
          setStorage('events', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Backend Events fetch failed, falling back to cached events:', err);
      }
    }
    await delay(150);
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    if (!auxiliary) return events;
    return events.filter((e) => e.auxiliary === auxiliary);
  },

  async getById(id: string): Promise<Event | null> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await backendFetch<BackendRecord>(`Events/${id}`);
        if (res && res.id) {
          return mapBackendEventToEvent(res);
        }
      } catch (err) {
        console.warn(`Backend Events/${id} fetch failed, checking local cache:`, err);
      }
    }
    await delay(100);
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    return events.find((e) => e.id === id) || null;
  },

  async create(
    data: Omit<Event, 'id' | 'createdAt' | 'participantsCount' | 'verifiedCount' | 'certificatesIssuedCount'>,
    performedBy: User
  ): Promise<Event> {
    const token = getAuthToken();
    if (token) {
      try {
        const backendPayload = {
          name: data.name.trim(),
          description: data.description || null,
          eventType: data.eventType === 'Workshop' ? 'WorkShop' : data.eventType,
          eventDate: new Date(data.date).toISOString(),
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          venue: data.venue.trim(),
          auxiliary: data.auxiliary,
          organizationalLevel: data.orgLevel,
          organizationalUnit: data.orgUnitName.trim() || null,
        };

        const res = await backendFetch<BackendRecord>('Events', {
          method: 'POST',
          body: JSON.stringify(backendPayload),
        });

        const newEvent = mapBackendEventToEvent(res || { ...data, id: `evt-${Date.now()}` });

        const events = getStorage<Event[]>('events', INITIAL_EVENTS);
        setStorage('events', [newEvent, ...events.filter((e) => e.id !== newEvent.id)]);

        await auditApi.recordLog({
          action: 'Event Created',
          adminName: performedBy.fullName,
          adminRole: performedBy.role,
          auxiliary: data.auxiliary,
          target: newEvent.name,
          details: `Created new ${newEvent.eventType} at ${newEvent.venue} (${newEvent.orgLevel}: ${newEvent.orgUnitName})`,
        });

        return newEvent;
      } catch (err) {
        console.error('Failed to create event on backend:', err);
        throw err;
      }
    }

    // Fallback to local storage
    await delay(250);
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    const newEvent: Event = {
      ...data,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      participantsCount: 0,
      verifiedCount: 0,
      certificatesIssuedCount: 0,
    };
    setStorage('events', [newEvent, ...events]);

    await auditApi.recordLog({
      action: 'Event Created',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: data.auxiliary,
      target: newEvent.name,
      details: `Created new ${newEvent.eventType} at ${newEvent.venue} (${newEvent.orgLevel}: ${newEvent.orgUnitName})`,
    });

    return newEvent;
  },

  async update(
    id: string,
    data: Partial<Event>,
    performedBy: User
  ): Promise<Event> {
    const token = getAuthToken();
    if (token) {
      try {
        const backendPayload = {
          name: data.name,
          description: data.description || null,
          eventType: data.eventType === 'Workshop' ? 'WorkShop' : data.eventType,
          eventDate: data.date ? new Date(data.date).toISOString() : undefined,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          venue: data.venue,
          auxiliary: data.auxiliary,
          organizationalLevel: data.orgLevel,
          organizationalUnit: data.orgUnitName,
          status: data.status,
        };

        const res = await backendFetch<BackendRecord>(`Events/${id}`, {
          method: 'PUT',
          body: JSON.stringify(backendPayload),
        });

        const updated = mapBackendEventToEvent(res);
        const events = getStorage<Event[]>('events', INITIAL_EVENTS);
        setStorage('events', events.map((e) => (e.id === id ? updated : e)));

        await auditApi.recordLog({
          action: 'Event Updated',
          adminName: performedBy.fullName,
          adminRole: performedBy.role,
          auxiliary: updated.auxiliary,
          target: `${updated.name} (${id})`,
          details: `Updated event ${updated.name} on the backend.`,
        });
        return updated;
      } catch (err) {
        console.error(`Failed to update event ${id} on backend:`, err);
        throw err;
      }
    }

    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    const existing = events.find((e) => e.id === id);
    if (!existing) throw new Error('Event not found');
    const updated: Event = { ...existing, ...data };
    setStorage('events', events.map((e) => (e.id === id ? updated : e)));
    return updated;
  },

  async delete(id: string, performedBy: User): Promise<void> {
    const token = getAuthToken();
    if (token) {
      try {
        await backendFetch<void>(`Events/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error(`Failed to delete event ${id} on backend:`, err);
        throw err;
      }
    }
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    const existing = events.find((e) => e.id === id);
    setStorage('events', events.filter((e) => e.id !== id));

    await auditApi.recordLog({
      action: 'Event Deleted',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: existing?.auxiliary,
      target: existing ? `${existing.name} (${id})` : id,
      details: existing ? `Deleted event ${existing.name}.` : `Deleted event ${id}.`,
    });
  },
};

// PARTICIPANTS API & MAPPER
function mapBackendVerificationStatus(status: string | undefined): VerificationStatus {
  if (!status) return 'Verified';
  const clean = status.replace(/[\s_-]+/g, '').toLowerCase();
  if (clean === 'verified') return 'Verified';
  if (clean === 'notfound') return 'Not Found';
  if (clean === 'invalid') return 'Invalid';
  if (clean === 'duplicate') return 'Duplicate';
  if (clean === 'verificationfailed' || clean === 'failed') return 'Verification Failed';
  return 'Verified';
}

function mapBackendParticipantToParticipant(raw: BackendRecord, fallbackEventId?: string): Participant {
  return {
    id: bStr(raw.id, `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
    eventId: bStr(raw.eventId || fallbackEventId),
    memberId: bStr(raw.membershipId || raw.memberId).toUpperCase(),
    fullName: bStr(raw.fullName, 'Unknown Member'),
    auxiliary: bStr(raw.auxiliary, 'Atfal') as Auxiliary,
    dila: bStr(raw.dila, 'Dila South'),
    ilaqa: bStr(raw.ilaqa) || undefined,
    jamaat: bStr(raw.jamaat, 'Headquarters'),
    verificationStatus: mapBackendVerificationStatus(bStr(raw.verificationStatus) || (bBool(raw.isVerified, false) ? 'Verified' : 'Pending')),
    verificationDetails: bStr(raw.verificationMessage || raw.verificationDetails) || (bBool(raw.isVerified, false) ? 'Verified via central registry' : undefined),
    certificateAssigned: (bStr(raw.certificateAssigned || raw.certificateType) || undefined) as Participant['certificateAssigned'],
    certificateId: raw.certificateId ? String(raw.certificateId) : undefined,
    addedAt: bStr(raw.createdAt || raw.addedAt, new Date().toISOString()),
    notes: bStr(raw.notes) || undefined,
  };
}

export const participantsApi = {
  async getByEvent(eventId: string): Promise<Participant[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await backendFetch<BackendRecord[]>(`Participants/event/${eventId}`);
        if (Array.isArray(res)) {
          const mapped = res.map((p) => mapBackendParticipantToParticipant(p, eventId));
          const allStored = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
          const others = allStored.filter((p) => p.eventId !== eventId);
          setStorage('participants', [...mapped, ...others]);
          return mapped;
        }
      } catch (err) {
        console.warn(`Backend Participants for event ${eventId} fetch failed, falling back to local storage:`, err);
      }
    }
    await delay(150);
    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    return participants.filter((p) => p.eventId === eventId);
  },

  async verifyMemberId(memberId: string, auxiliary: Auxiliary): Promise<{
    status: Participant['verificationStatus'];
    details: string;
    member?: JamaatMember;
  }> {
    const cleanId = memberId.trim().toUpperCase();
    const token = getAuthToken();

    if (token) {
      try {
        const res = await backendFetch<BackendRecord>(`Participants/verify/${encodeURIComponent(cleanId)}`);
        if (res) {
          const status = mapBackendVerificationStatus(bStr(res.verificationStatus) || 'Verified');
          return {
            status,
            details: bStr(res.verificationMessage, 'Verified via central Jama\'at member registry'),
            member: {
              memberId: cleanId,
              fullName: bStr(res.fullName, `Brother ${cleanId}`),
              auxiliary: (res.auxiliary || auxiliary) as Auxiliary,
              mulkOrDistrict: bStr(res.mulkOrDistrict, 'National HQ'),
              ilaqa: bStr(res.ilaqa) || undefined,
              dila: bStr(res.dila, 'Central Dilla'),
              jamaat: bStr(res.jamaat, 'Headquarters'),
              email: bStr(res.email, `${cleanId.toLowerCase()}@jamaat.org`),
              phone: bStr(res.phone) || undefined,
              status: 'Active',
            },
          };
        }
      } catch (err) {
        console.warn(`Backend verify/${cleanId} failed, falling back to local registry adapter:`, err);
      }
    }

    // Fallback to local registry adapter
    return jamaatMemberApi.verifyMember(cleanId, auxiliary);
  },

  async addSingle(eventId: string, memberId: string, performedBy: User): Promise<Participant> {
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const cleanId = memberId.trim().toUpperCase();
    const token = getAuthToken();

    // Verify first
    const verification = await this.verifyMemberId(cleanId, event.auxiliary);
    const memberData: Partial<JamaatMember> = verification.member || {
      fullName: `Member ${cleanId}`,
      auxiliary: event.auxiliary,
    };

    if (token) {
      try {
        const backendPayload = {
          eventId,
          membershipId: cleanId,
          fullName: memberData.fullName || `Member ${cleanId}`,
          email: memberData.email || `${cleanId.toLowerCase()}@jamaat.org`,
          phone: memberData.phone || null,
          jamaat: memberData.jamaat || 'Headquarters',
          dila: memberData.dila || 'Central Dilla',
          ilaqa: memberData.ilaqa || null,
          auxiliary: memberData.auxiliary || event.auxiliary,
        };

        const res = await backendFetch<BackendRecord>('Participants', {
          method: 'POST',
          body: JSON.stringify(backendPayload),
        });

        const newParticipant = mapBackendParticipantToParticipant(res || { ...backendPayload, id: `part-${Date.now()}` }, eventId);
        newParticipant.verificationStatus = verification.status;
        newParticipant.verificationDetails = verification.details;

        const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
        setStorage('participants', [newParticipant, ...participants.filter((p) => p.id !== newParticipant.id)]);

        await auditApi.recordLog({
          action: 'Member Verification',
          adminName: performedBy.fullName,
          adminRole: performedBy.role,
          auxiliary: event.auxiliary,
          target: `${cleanId} (${event.name})`,
          details: `Enrolled participant on backend: Status ${verification.status}`,
        });

        return newParticipant;
      } catch (err) {
        console.warn('Backend create participant failed, adding locally:', err);
      }
    }

    // Fallback
    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    const newParticipant: Participant = {
      id: `part-${Date.now()}`,
      eventId,
      memberId: cleanId,
      fullName: memberData.fullName || `Member ${cleanId}`,
      auxiliary: (memberData.auxiliary as Auxiliary) || event.auxiliary,
      dila: memberData.dila || 'Lagos',
      ilaqa: memberData.ilaqa || 'South West',
      jamaat: memberData.jamaat || 'Headquarters',
      verificationStatus: verification.status,
      verificationDetails: verification.details,
      addedAt: new Date().toISOString(),
    };

    setStorage('participants', [newParticipant, ...participants]);

    await auditApi.recordLog({
      action: 'Member Verification',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: event.auxiliary,
      target: `${cleanId} (${event.name})`,
      details: `Enrolled participant: Status ${verification.status}`,
    });

    return newParticipant;
  },

  async bulkUpload(eventId: string, memberIds: string[], performedBy: User): Promise<BulkVerificationResult> {
    await delay(400);
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    const existingSet = new Set(
      participants.filter((p) => p.eventId === eventId).map((p) => p.memberId.toUpperCase())
    );

    const newlyAdded: Participant[] = [];
    let verifiedCount = 0;
    let notFoundCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const rawId of memberIds) {
      const cleanId = rawId.trim().toUpperCase();
      if (!cleanId) continue;

      let status: Participant['verificationStatus'] = 'Verified';
      let details = '';
      let memberInfo: Partial<JamaatMember> = {};

      if (existingSet.has(cleanId)) {
        status = 'Duplicate';
        details = 'Participant is already enrolled in this event';
        duplicateCount++;
      } else {
        existingSet.add(cleanId);
        const res = await this.verifyMemberId(cleanId, event.auxiliary);
        status = res.status;
        details = res.details;
        if (res.member) memberInfo = res.member;

        if (status === 'Verified') verifiedCount++;
        else if (status === 'Not Found') notFoundCount++;
        else if (status === 'Invalid') invalidCount++;
        else failedCount++;
      }

      const participant: Participant = {
        id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId,
        memberId: cleanId,
        fullName: memberInfo.fullName || `Member ${cleanId}`,
        auxiliary: (memberInfo.auxiliary as Auxiliary) || event.auxiliary,
        dila: memberInfo.dila || 'Lagos',
        ilaqa: memberInfo.ilaqa || 'South West',
        jamaat: memberInfo.jamaat || 'Headquarters',
        verificationStatus: status,
        verificationDetails: details,
        addedAt: new Date().toISOString(),
      };

      newlyAdded.push(participant);
    }

    setStorage('participants', [...newlyAdded, ...participants]);

    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    setStorage(
      'events',
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              participantsCount: e.participantsCount + newlyAdded.length,
              verifiedCount: e.verifiedCount + verifiedCount,
            }
          : e
      )
    );

    await auditApi.recordLog({
      action: 'Participant Import',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: event.auxiliary,
      target: `${newlyAdded.length} Participants (${event.name})`,
      details: `Bulk Import: ${verifiedCount} Verified, ${notFoundCount} Not Found, ${invalidCount} Invalid, ${duplicateCount} Duplicate.`,
    });

    return {
      totalRows: memberIds.length,
      verifiedCount,
      notFoundCount,
      invalidCount,
      duplicateCount,
      failedCount,
      participants: newlyAdded,
    };
  },

  async uploadFile(eventId: string, file: File, performedBy: User): Promise<BackendRecord> {
    const token = getAuthToken();
    if (token) {
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const endpoint = isCsv
        ? `Participants/event/${eventId}/upload-csv`
        : `Participants/event/${eventId}/upload-excel`;

      const formData = new FormData();
      formData.append('file', file);

      const res = await backendFetch<BackendRecord>(endpoint, {
        method: 'POST',
        body: formData,
      });

      await this.getByEvent(eventId);

      await auditApi.recordLog({
        action: 'Participant Import',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        target: file.name,
        details: `Uploaded participant roster file (${file.name}) to event.`,
      });

      return res;
    }
    throw new Error('Please sign in to upload roster files.');
  },
};

// CERTIFICATE & TEMPLATE MAPPERS
function toBackendCertType(certType: string): string {
  return certType.replace(/^Certificate\s+of\s+/i, '').trim();
}

function fromBackendCertType(typeStr: string | undefined): CertificateType {
  if (!typeStr) return 'Certificate of Participation';
  if (typeStr.startsWith('Certificate of ')) return typeStr as CertificateType;
  return `Certificate of ${typeStr}` as CertificateType;
}

function mapBackendTemplateToTemplate(raw: BackendRecord): CertificateTemplate {
  let config: BackendRecord = {};
  if (typeof raw.configurationJson === 'string' && raw.configurationJson) {
    try {
      const parsed: unknown = JSON.parse(raw.configurationJson);
      if (bRec(parsed)) config = parsed as BackendRecord;
    } catch {}
  } else if (bRec(raw.configurationJson)) {
    config = raw.configurationJson as BackendRecord;
  }

  const orientationStr = bStr(raw.orientation || config.orientation, 'landscape').toLowerCase();
  const orientation: 'landscape' | 'portrait' = orientationStr === 'portrait' ? 'portrait' : 'landscape';

  return {
    id: bStr(raw.id, `tmpl-${Date.now()}`),
    name: bStr(raw.name, 'Official Template'),
    auxiliary: (bStr(raw.auxiliary, 'All')) as Auxiliary | 'All',
    certificateType: fromBackendCertType(bStr(raw.certificateType || config.certificateType) || undefined),
    design: bStr(config.design, 'modern-rings') as CertificateTemplate['design'],
    orientation,
    primaryColor: bStr(config.primaryColor, '#15803d'),
    accentColor: bStr(config.accentColor, '#84cc16'),
    neutralColor: bStr(config.neutralColor, '#0f172a'),
    backgroundColor: bStr(config.backgroundColor, '#ffffff'),
    showWaveWatermark: bBool(config.showWaveWatermark, true),
    showTorusRings: bBool(config.showTorusRings, true),
    showRosetteBadge: bBool(config.showRosetteBadge, true),
    organizationName: bStr(config.organizationName, 'MAJLIS ATFAL-UL AHMADIYYA NIGERIA'),
    organizationSubtitle: bStr(config.organizationSubtitle, '(Ahmadiyya Muslims Children Organization)'),
    logoType: bStr(config.logoType, 'atfal-emblem') as CertificateTemplate['logoType'],
    logoUrl: bStr(raw.filePath || raw.backgroundImagePath || config.logoUrl, '/ahmadiyyah_logo.png'),
    eventTitle: bStr(config.eventTitle, 'ISLAMIC VACATION COURSE/REGIONAL IJTEMA 2025'),
    typeBadgeText: bStr(config.typeBadgeText, 'CERTIFICATE OF PARTICIPATION'),
    participationLine: bStr(config.participationLine, 'Participated in a week Islamic Vacation Course which took place'),
    themeTitle: bStr(config.themeTitle, 'Theme: My Faith, My Identity.'),
    programDurationText: bStr(config.programDurationText, '3rd August to Sunday 10th August, 2025'),
    bodyIntroText: bStr(config.bodyIntroText, 'This is to congratulate and certify that {{Salutation}} {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}} from {{Jamaat}}.'),
    bodyDescriptionText: bStr(config.bodyDescriptionText, 'Participated in a week Islamic Vacation Course which took place at {{Venue}}.'),
    bodyFocusText: bStr(config.bodyFocusText, 'The program focussed on enhancing Islamic knowledge, promoting religious tolerance...'),
    signature1Name: bStr(config.signature1Name, 'Abdur Raob Akhryemi'),
    signature1Title: bStr(config.signature1Title, 'Sadr Majlis Khuddamul Ahmadiyya Nigeria'),
    signature1Date: bStr(config.signature1Date, '10th August, 2025'),
    signature1Image: bStr(config.signature1Image) || undefined,
    isDefault: bBool(raw.isActive, false),
    updatedAt: bStr(raw.updatedAt, new Date().toISOString()),
  };
}

function mapBackendCertificateToCertificate(raw: BackendRecord): Certificate {
  const certType = fromBackendCertType(bStr(raw.certificateType || raw.type) || undefined);
  const status: CertificateStatus = raw.status === 'Revoked' ? 'Revoked' : 'Issued';
  const evt = bRec(raw.event);
  const part = bRec(raw.participant);
  const evtDate = evt ? bStr(evt.eventDate) : '';
  return {
    id: bStr(raw.id, `cert-${Date.now()}`),
    certificateNumber: bStr(raw.certificateNumber || raw.serialNumber, `JCS-CERT-${Date.now()}`),
    eventId: bStr(raw.eventId),
    eventName: bStr(evt?.name || raw.eventName, 'Event'),
    eventDate: evtDate
      ? (evtDate.includes('T') ? evtDate.split('T')[0] : evtDate)
      : (bStr(raw.eventDate) || new Date().toISOString().split('T')[0]),
    venue: bStr(evt?.venue || raw.venue),
    participantId: bStr(raw.participantId),
    participantName: bStr(part?.fullName || raw.participantName, 'Participant'),
    memberId: bStr(part?.membershipId || raw.memberId),
    auxiliary: bStr(raw.auxiliary || evt?.auxiliary || part?.auxiliary, 'Atfal') as Auxiliary,
    dila: bStr(part?.dila || raw.dila, 'Dila South'),
    ilaqa: bStr(part?.ilaqa || raw.ilaqa) || undefined,
    jamaat: bStr(part?.jamaat || raw.jamaat, 'Headquarters'),
    type: certType,
    templateId: bStr(raw.certificateTemplateId || raw.templateId, 'tmpl-01'),
    issuedAt: bStr(raw.issuedAt || raw.createdAt, new Date().toISOString()),
    issuedBy: bStr(raw.issuedBy, 'System Admin'),
    status,
    revocationReason: bStr(raw.revocationReason) || undefined,
    revokedAt: bStr(raw.revokedAt) || undefined,
    revokedBy: bStr(raw.revokedBy) || undefined,
    verificationHash: bStr(raw.verificationHash || raw.qrCodeUrl) || Math.random().toString(36).substring(2, 14),
    theme: bStr(evt?.theme || raw.theme) || undefined,
  };
}

// TEMPLATES API
export const templatesApi = {
  async getAll(auxiliary?: Auxiliary): Promise<CertificateTemplate[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await backendFetch<BackendRecord[]>('CertificateTemplates');
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map(mapBackendTemplateToTemplate);
          const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
          const merged = mapped.map((tmpl) =>
            savedOverrides[tmpl.id] ? { ...tmpl, ...savedOverrides[tmpl.id] } : tmpl
          );
          if (!auxiliary) return merged;
          return merged.filter((t) => !t.auxiliary || t.auxiliary === 'All' || t.auxiliary === auxiliary);
        }
      } catch (err) {
        console.warn('Backend CertificateTemplates fetch failed, falling back to local list:', err);
      }
    }

    await delay(100);
    const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
    const merged: CertificateTemplate[] = INITIAL_TEMPLATES.map((tmpl) =>
      savedOverrides[tmpl.id] ? { ...tmpl, ...savedOverrides[tmpl.id] } : tmpl
    );

    if (!auxiliary) return merged;
    return merged.filter(
      (t) => !t.auxiliary || t.auxiliary === 'All' || t.auxiliary === auxiliary
    );
  },

  async save(templateData: CertificateTemplate, performedBy: User): Promise<CertificateTemplate> {
    const updatedTemplate: CertificateTemplate = {
      ...templateData,
      updatedAt: new Date().toISOString(),
    };

    const token = getAuthToken();
    if (token) {
      try {
        const configurationJson = JSON.stringify({
          design: templateData.design,
          primaryColor: templateData.primaryColor,
          accentColor: templateData.accentColor,
          neutralColor: templateData.neutralColor,
          backgroundColor: templateData.backgroundColor,
          showWaveWatermark: templateData.showWaveWatermark,
          showTorusRings: templateData.showTorusRings,
          showRosetteBadge: templateData.showRosetteBadge,
          organizationName: templateData.organizationName,
          organizationSubtitle: templateData.organizationSubtitle,
          logoType: templateData.logoType,
          logoUrl: templateData.logoUrl,
          eventTitle: templateData.eventTitle,
          typeBadgeText: templateData.typeBadgeText,
          participationLine: templateData.participationLine,
          themeTitle: templateData.themeTitle,
          programDurationText: templateData.programDurationText,
          bodyIntroText: templateData.bodyIntroText,
          bodyDescriptionText: templateData.bodyDescriptionText,
          bodyFocusText: templateData.bodyFocusText,
          signature1Name: templateData.signature1Name,
          signature1Title: templateData.signature1Title,
          signature1Date: templateData.signature1Date,
          signature1Image: templateData.signature1Image,
        });

        const backendPayload = {
          name: templateData.name,
          description: `Template for ${templateData.auxiliary || 'All'} Auxiliaries`,
          auxiliary: templateData.auxiliary === 'All' ? null : templateData.auxiliary,
          orientation: templateData.orientation === 'portrait' ? 'Portrait' : 'Landscape',
          configurationJson,
          isActive: true,
        };

        // If template ID is a UUID, update it; otherwise create or update
        if (templateData.id && templateData.id.includes('-') && templateData.id.length > 20) {
          await backendFetch<BackendRecord>(`CertificateTemplates/${templateData.id}`, {
            method: 'PUT',
            body: JSON.stringify(backendPayload),
          });
        }
      } catch (err) {
        console.warn('Failed to save template to backend, saving locally:', err);
      }
    }

    const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
    savedOverrides[updatedTemplate.id] = updatedTemplate;
    setStorage('template_overrides', savedOverrides);

    await auditApi.recordLog({
      action: 'Template Modified',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary:
        updatedTemplate.auxiliary === 'All'
          ? undefined
          : (updatedTemplate.auxiliary as Auxiliary),
      target: updatedTemplate.name,
      details: `Customized certificate template style: Primary ${updatedTemplate.primaryColor}, Accent ${updatedTemplate.accentColor}, Background ${updatedTemplate.backgroundColor}`,
    });

    return updatedTemplate;
  },
};

// CERTIFICATES API
export const certificatesApi = {
  async getAll(auxiliary?: Auxiliary): Promise<Certificate[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await backendFetch<BackendRecord[]>('Certificates');
        if (Array.isArray(res)) {
          const mapped = res.map(mapBackendCertificateToCertificate);
          setStorage('certificates', mapped);
          if (!auxiliary) return mapped;
          return mapped.filter((c) => c.auxiliary === auxiliary);
        }
      } catch (err) {
        console.warn('Backend Certificates fetch failed, falling back to local cache:', err);
      }
    }

    await delay(100);
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    if (!auxiliary) return certs;
    return certs.filter((c) => c.auxiliary === auxiliary);
  },

  async generateBulk(
    eventId: string,
    participantIds: string[],
    certificateType: CertificateType,
    templateId: string,
    performedBy: User
  ): Promise<Certificate[]> {
    const token = getAuthToken();
    const newlyGenerated: Certificate[] = [];

    if (token) {
      try {
        const backendCertType = toBackendCertType(certificateType);
        for (const pId of participantIds) {
          const res = await backendFetch<BackendRecord>('Certificates', {
            method: 'POST',
            body: JSON.stringify({
              eventId,
              participantId: pId,
              certificateTemplateId: templateId.includes('-') && templateId.length > 20 ? templateId : null,
              certificateType: backendCertType,
            }),
          });
          if (res && res.id) {
            newlyGenerated.push(mapBackendCertificateToCertificate(res));
          }
        }

        if (newlyGenerated.length > 0) {
          const existing = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
          setStorage('certificates', [...newlyGenerated, ...existing]);
          await auditApi.recordLog({
            action: 'Certificate Generated',
            adminName: performedBy.fullName,
            adminRole: performedBy.role,
            target: `Batch of ${newlyGenerated.length} Certificates`,
            details: `Generated certificates on backend for ${newlyGenerated.length} attendees.`,
          });
          return newlyGenerated;
        }
      } catch (err) {
        console.warn('Backend batch certificate generation failed, generating locally:', err);
      }
    }

    // Fallback generation
    await delay(400);
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const auxCode = event.auxiliary.slice(0, 3).toUpperCase();
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < participantIds.length; i++) {
      const p = participants.find((part) => part.id === participantIds[i]);
      if (!p || p.verificationStatus !== 'Verified') continue;

      const serial = String(certs.length + newlyGenerated.length + 1).padStart(4, '0');
      const certNumber = `JCS-${auxCode}-${currentYear}-${serial}`;

      const newCert: Certificate = {
        id: `cert-${Date.now()}-${i}`,
        certificateNumber: certNumber,
        eventId: event.id,
        eventName: event.name,
        eventDate: `${event.date} to ${event.endDate || event.date}`,
        venue: event.venue,
        theme: event.theme,
        participantId: p.id,
        participantName: p.fullName,
        memberId: p.memberId,
        auxiliary: p.auxiliary,
        dila: p.dila,
        ilaqa: p.ilaqa,
        jamaat: p.jamaat,
        type: certificateType,
        templateId,
        issuedAt: new Date().toISOString(),
        issuedBy: performedBy.fullName,
        status: 'Issued',
        verificationHash: Math.random().toString(36).substring(2, 14),
      };

      newlyGenerated.push(newCert);
      p.certificateAssigned = certificateType;
      p.certificateId = newCert.id;
    }

    setStorage('participants', participants);
    setStorage('certificates', [...newlyGenerated, ...certs]);

    await auditApi.recordLog({
      action: 'Certificate Generated',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: event.auxiliary,
      target: `Batch of ${newlyGenerated.length} Certificates (${event.name})`,
      details: `Generated official certificates for ${newlyGenerated.length} verified attendees.`,
    });

    return newlyGenerated;
  },

  async update(
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
    >,
    performedBy: User
  ): Promise<Certificate> {
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const target = certs.find((c) => c.id === certificateId);
    if (!target) throw new Error('Certificate not found');

    const updated: Certificate = { ...target, ...updates };
    setStorage('certificates', certs.map((c) => (c.id === certificateId ? updated : c)));

    await auditApi.recordLog({
      action: 'Certificate Updated',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: target.auxiliary,
      target: `${target.certificateNumber} (${updated.participantName})`,
      details: `Edited certificate details for ${updated.participantName}.`,
    });

    return updated;
  },

  async revoke(certificateId: string, reason: string, performedBy: User): Promise<Certificate> {
    const token = getAuthToken();
    if (token && certificateId.includes('-') && certificateId.length > 20) {
      try {
        await backendFetch<BackendRecord>(`Certificates/${certificateId}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'Revoked',
            revocationReason: reason,
            revokedBy: performedBy.fullName,
          }),
        });
      } catch (err) {
        console.warn('Backend revoke certificate failed, updating locally:', err);
      }
    }

    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const target = certs.find((c) => c.id === certificateId);
    if (!target) throw new Error('Certificate not found');

    const updated: Certificate = {
      ...target,
      status: 'Revoked',
      revocationReason: reason,
      revokedAt: new Date().toISOString(),
      revokedBy: performedBy.fullName,
    };

    setStorage('certificates', certs.map((c) => (c.id === certificateId ? updated : c)));

    await auditApi.recordLog({
      action: 'Certificate Revoked',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: target.auxiliary,
      target: `${target.certificateNumber} (${target.participantName})`,
      details: `Revoked certificate. Reason: ${reason}`,
    });

    return updated;
  },

  async verifyByNumber(certificateNumber: string): Promise<BackendRecord | Certificate | null> {
    const token = getAuthToken();
    if (token) {
      return backendFetch<BackendRecord>(`Certificates/verify/${encodeURIComponent(certificateNumber)}`);
    }
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    return certs.find((c) => c.certificateNumber.toUpperCase() === certificateNumber.trim().toUpperCase()) || null;
  },
};

// ---------------------------------------------------------------------------
// REAL BACKEND AUTH (via same-origin proxy at app/api/auth/login/route.ts)
// ---------------------------------------------------------------------------
export interface BackendLoginResponse {
  accessToken: string;
  expiresAt: string;
  role: string; // "SuperAdmin" | "Member"
  auxiliary: string | null;
  profile: {
    membershipId: string;
    fullName: string;
    auxiliary: string | null;
    jamaat: string | null;
    dila: string | null;
    ilaqa: string | null;
    status: string;
  };
}

export async function loginReal(memberId: string, password: string) {
  const cleanId = memberId.trim();
  if (!cleanId || !password) {
    throw new Error('Member ID and password are required.');
  }

  let res: Response;
  try {
    // Same-origin proxy — avoids browser CORS blocks when calling Railway.
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: cleanId, password }),
    });
  } catch (err) {
    const reason = err instanceof Error && err.message ? `: ${err.message}` : '';
    throw new Error(`Cannot reach the server. Check your network and try again${reason}`);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = (await res.json()) as unknown;
      if (typeof errBody === 'object' && errBody !== null) {
        const record = errBody as Record<string, unknown>;
      if (typeof record.detail === 'string' && record.detail) {
        const msg = typeof record.message === 'string' ? record.message : '';
        detail = msg ? `${msg} (${record.detail})` : record.detail;
      } else if (typeof record.message === 'string' && record.message) {
          detail = record.message;
        } else if (typeof record.title === 'string' && record.title) {
          detail = record.title;
        } else if (record.errors && typeof record.errors === 'object') {
          const first = Object.values(record.errors as Record<string, unknown>).flat()[0];
          if (typeof first === 'string') detail = first;
        }
      } else if (typeof errBody === 'string' && errBody) {
        detail = errBody;
      }
    } catch {
      // ignore JSON parse errors, fall through to status-based message
    }
    throw new Error(detail ? `Login failed (${res.status}): ${detail}` : `Login failed (${res.status}).`);
  }

  const data = (await res.json()) as BackendLoginResponse;
  if (!data?.accessToken || !data?.profile?.membershipId) {
    throw new Error('Login failed: unexpected server response.');
  }

  const user: User = {
    id: `backend-${data.profile.membershipId}`,
    memberId: data.profile.membershipId,
    fullName: data.profile.fullName,
    email: `${data.profile.membershipId.toLowerCase()}@jamaat.org`,
    role: (data.role === 'SuperAdmin' ? 'SUPER_ADMIN' : 'GENERAL_ADMIN') as User['role'],
    assignedAuxiliary: (data.auxiliary ||
      data.profile.auxiliary ||
      undefined) as User['assignedAuxiliary'],
    dila: data.profile.dila || undefined,
    jamaat: data.profile.jamaat || undefined,
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('jcs_access_token', data.accessToken);
    sessionStorage.setItem('jcs_expires_at', data.expiresAt);
  }

  return { user, accessToken: data.accessToken };
}
