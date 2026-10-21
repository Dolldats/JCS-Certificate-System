import { jamaatMemberApi, isLiveJamaatApi } from './jamaatMemberApi';
import { backendDownload, backendFetch, friendlyErrorMessage, getAuthToken } from './backendClient';

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

/** Strips a leading "Theme:" label so stored values print clean and constant. */
export const cleanTheme = (value: unknown): string =>
  bStr(value).trim().replace(/^theme:\s*/i, '');

const PAGE_SIZE = 100;

/**
 * Endpoints the backend documents as paged. A response from one of these
 * should be the paged envelope — if a bare array turns up instead, the list
 * may be silently truncated, so it is reported rather than swallowed.
 */
const PAGED_BACKEND_RESOURCES = new Set([
  'Participants',
  'Certificates',
  'Events',
  'AuditLogs',
]);

/**
 * Reads a list response that may be either a bare array or a paged envelope
 * (`{ items | data, totalCount }`). Every list read goes through here so a
 * paged response can never be mistaken for a complete single page.
 */
function pageItems(value: unknown): BackendRecord[] {
  if (Array.isArray(value)) return value as BackendRecord[];
  const record = bRec(value);
  if (Array.isArray(record?.items)) return record.items as BackendRecord[];
  if (Array.isArray(record?.data)) return record.data as BackendRecord[];
  return [];
}

/**
 * Fetches every page of a list endpoint. Works with the paged envelope and
 * with a bare array, so an endpoint that is not paged yet still returns its
 * full list — but a bare array from an endpoint that IS documented as paged
 * is reported, because that means records can be missing.
 */
/**
 * A page of records plus the paging metadata the backend returns.
 */
export interface PageResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Reads a paged envelope. The backend's 200 body is not documented in the
 * swagger, so several common field names are accepted rather than assuming
 * one shape.
 */
function readPageEnvelope(value: unknown): { items: BackendRecord[]; totalCount: number } {
  const record = bRec(value);
  if (!record) {
    return { items: Array.isArray(value) ? (value as BackendRecord[]) : [], totalCount: 0 };
  }
  const items = (['items', 'data', 'results', 'records', 'content'] as const)
    .map((key) => record[key])
    .find((candidate): candidate is BackendRecord[] => Array.isArray(candidate)) ?? [];
  const totalCount = bNum(
    record.totalCount ?? record.total ?? record.totalItems ?? record.count,
    items.length
  );
  return { items, totalCount };
}

/**
 * Fetches a single page from a paged list endpoint.
 */
async function fetchBackendPage<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  page: number,
  pageSize: number,
  map: (record: BackendRecord) => T
): Promise<PageResult<T>> {
  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('pageSize', String(pageSize));
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const response = await backendFetch<unknown>(`${path}?${search.toString()}`);
  const { items, totalCount } = readPageEnvelope(response);
  return {
    items: items.map(map),
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
  };
}

async function getAllBackendPages(path: string): Promise<BackendRecord[]> {
  const separator = path.includes('?') ? '&' : '?';
  const withPaging = (page: number) =>
    `${path}${separator}page=${page}&pageSize=${PAGE_SIZE}`;
  const first = await backendFetch<unknown>(withPaging(1));
  const firstItems = pageItems(first);
  const resource = path.split('?')[0].split('/').filter(Boolean).pop() ?? '';
  if (Array.isArray(first) && PAGED_BACKEND_RESOURCES.has(resource)) {
    console.warn(
      `Backend ${path} returned a bare array but is documented as paged — the list may be incomplete.`
    );
  }
  const totalCount = bNum(bRec(first)?.totalCount, firstItems.length);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const allItems = [...firstItems];

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await backendFetch<unknown>(withPaging(page));
    allItems.push(...pageItems(response));
  }

  return allItems;
}

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

  try {
    const response = await backendFetch<BackendRecord>(`members/tajneed/${encodeURIComponent(cleanId)}`);
    const profile = bRec(response.member) || bRec(response.profile) || bRec(response.data) || response;
    const fullName = bStr(profile.fullName || profile.name).trim();
    if (fullName && !isGeneratedMemberName(fullName)) {
      return {
        memberId: cleanId,
        fullName,
        email: bStr(profile.email) || undefined,
        phone: bStr(profile.phone || profile.phoneNumber) || undefined,
        auxiliary: (profile.auxiliary || profile.body) as Auxiliary | undefined,
        mulkOrDistrict: bStr(profile.mulkOrDistrict) || undefined,
        dila: bStr(profile.dila || profile.district) || undefined,
        ilaqa: bStr(profile.ilaqa) || undefined,
        jamaat: bStr(profile.jamaat) || undefined,
      };
    }
  } catch {
    // Older deployments may not expose the Tajneed lookup, so try the participant verifier next.
  }

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

/**
 * Namespace for everything this app caches in localStorage. Everything under
 * it is a copy of server data — the server is always the source of truth.
 */
const STORAGE_PREFIX = 'jcs_v2_';

/**
 * The only cached entry kept on logout: the admin's own template designs.
 * Not member data, and the server holds a copy of everything too.
 */
const KEPT_STORAGE_KEYS = new Set([`${STORAGE_PREFIX}template_overrides`]);

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to persist ${key}`, e);
  }
}

/**
 * Called on logout. Removes every cached record so the next person to use this
 * device cannot read member names, phone numbers, emails, certificates or the
 * activity log in DevTools.
 *
 * This sweeps the whole `jcs_v2_` namespace rather than a fixed list, so
 * stale entries left behind by older builds are cleared too.
 */
export function clearLocalRecords(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) keys.push(key);
    }
    for (const key of keys) {
      if (!key.startsWith(STORAGE_PREFIX)) continue;
      if (KEPT_STORAGE_KEYS.has(key)) continue;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore — a blocked storage must not break sign-out.
      }
    }
  } catch {
    // Ignore — a blocked storage must not break sign-out.
  }
}

/**
 * Deterministic verification hash (FNV-1a). A random hash would change on
 * every read, so the QR code on a certificate would point at a different
 * verification link each time the certificate was opened.
 */
function stableVerificationHash(seed: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `v${hash.toString(36).padStart(7, '0')}`.slice(0, 14);
}

// AUDIT API
// Remove known seeded records; old browser caches can outlive the original mock data.
const LEGACY_DEMO_AUDIT_LOG_IDS = new Set(['log-1', 'log-2', 'log-3']);

function removeLegacyDemoAuditLogs(logs: AuditLog[]): AuditLog[] {
  return logs.filter((log) => !LEGACY_DEMO_AUDIT_LOG_IDS.has(log.id));
}

function readableAuditAction(action: string): string {
  // Older backend records stored the raw route; present the business action name.
  if (action.toLowerCase() === 'post /api/participants') return 'Participant Added';
  return action;
}

function readableAuditDetails(action: string, details: string): string {
  if (action.toLowerCase() === 'post /api/participants' && /^HTTP 2\d\d$/i.test(details.trim())) {
    return `Participant request completed successfully (${details}). This older log did not capture the member ID or event.`;
  }
  return details;
}

function mapBackendAuditLog(item: BackendRecord): AuditLog {
  const rawAction = bStr(item.action, 'Login');
  const rawDetails = bStr(item.details || item.description);
  return {
    id: bStr(item.id, `log-${Date.now()}`),
    action: readableAuditAction(rawAction) as AuditLog['action'],
    adminName: bStr(item.performedBy || item.adminName, 'Admin'),
    adminRole: bStr(item.role || item.adminRole, 'Admin') as AuditLog['adminRole'],
    auxiliary: item.auxiliary as Auxiliary | undefined,
    target: bStr(item.target || item.entityId || item.entityName, 'System'),
    details: readableAuditDetails(rawAction, rawDetails),
    timestamp: bStr(item.performedAt || item.timestamp || item.createdAt, new Date().toISOString()),
    ipAddress: bStr(item.ipAddress) || undefined,
  };
}

export const auditApi = {
  async getLogs(auxiliaryFilter?: Auxiliary): Promise<AuditLog[]> {
    const { logs } = await this.getLogsWithStatus(auxiliaryFilter);
    return logs;
  },

  /** One page of the activity log, filtered server-side. */
  async getLogsPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    action?: string;
    auxiliary?: Auxiliary;
  }): Promise<PageResult<AuditLog>> {
    return fetchBackendPage(
      'AuditLogs',
      {
        search: params.search,
        action: params.action,
        auxiliary: params.auxiliary,
      },
      params.page,
      params.pageSize,
      mapBackendAuditLog
    );
  },

  /**
   * Fetches the activity log and reports whether the result came from the
   * server or from the local cache. A cached result must be shown as cached —
   * silently serving yesterday's entries looks like "nothing happened today".
   */
  async getLogsWithStatus(auxiliaryFilter?: Auxiliary): Promise<{ logs: AuditLog[]; stale: boolean }> {
    const token = getAuthToken();
    if (token) {
      try {
        // The backend paginates audit records — fetch every page before
        // caching, so the trail is never silently truncated.
        const allItems = await getAllBackendPages('AuditLogs');
        const mapped = removeLegacyDemoAuditLogs(allItems.map(mapBackendAuditLog));
          setStorage('audit_logs', mapped);
          if (!auxiliaryFilter) return { logs: mapped, stale: false };
          return {
            logs: mapped.filter((l) => !l.auxiliary || l.auxiliary === auxiliaryFilter),
            stale: false,
          };
      } catch (err) {
        console.warn('Backend AuditLogs fetch failed, using cached logs:', err);
      }
    }
    await delay(150);
    // If the API is unavailable, preserve local activity but scrub the legacy sample rows first.
    const cachedLogs = getStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    const logs = removeLegacyDemoAuditLogs(cachedLogs);
    if (logs.length !== cachedLogs.length) setStorage('audit_logs', logs);
    const filtered = auxiliaryFilter
      ? logs.filter((l) => !l.auxiliary || l.auxiliary === auxiliaryFilter)
      : logs;
    // Signed out, or the server could not be reached — these entries are the
    // local copy, not live data.
    return { logs: filtered, stale: true };
  },

  async getById(id: string): Promise<AuditLog> {
    const item = await backendFetch<BackendRecord>(`AuditLogs/${encodeURIComponent(id)}`);
    const rawAction = bStr(item.action, 'Login');
    const rawDetails = bStr(item.details || item.description);
    return {
      id: bStr(item.id, id),
      action: readableAuditAction(rawAction) as AuditLog['action'],
      adminName: bStr(item.performedBy || item.adminName, 'Admin'),
      adminRole: bStr(item.role || item.adminRole, 'Admin') as AuditLog['adminRole'],
      auxiliary: item.auxiliary as Auxiliary | undefined,
      target: bStr(item.entityId || item.entityName || item.target, 'System'),
      details: readableAuditDetails(rawAction, rawDetails),
      timestamp: bStr(item.performedAt || item.timestamp || item.createdAt, new Date().toISOString()),
      ipAddress: bStr(item.ipAddress) || undefined,
    };
  },

  async recordLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const token = getAuthToken();
    if (token) {
      try {
        const saved = await backendFetch<BackendRecord>('AuditLogs', {
          method: 'POST',
          body: JSON.stringify({
            action: entry.action,
            performedBy: entry.adminName,
            auxiliary: entry.auxiliary ?? null,
            entityName: entry.target,
            entityId: null,
            details: `${entry.details}${entry.adminRole ? ` (Role: ${entry.adminRole})` : ''}`,
          }),
        });
        return {
          ...entry,
          id: bStr(saved.id, `log-${Date.now()}`),
          timestamp: bStr(saved.performedAt, new Date().toISOString()),
          ipAddress: undefined,
        };
      } catch (err) {
        console.warn('Backend audit log write failed; keeping a local copy:', err);
      }
    }

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

  /**
   * Asks the server whether the stored session is still valid. The role in
   * browser storage is only a convenience for rendering — the server is the
   * authority, so a session it no longer accepts must end the sign-in.
   *
   * Returns true when the server accepted the session, false when it rejected
   * it. A non-401 failure (the endpoint being unavailable, for instance) is
   * not treated as a rejection — a valid admin must not be signed out by a
   * flaky network.
   */
  async validateSession(memberId: string): Promise<boolean> {
    if (!getAuthToken()) return false;
    try {
      // A small, authenticated read. Any 401 means the token is no longer valid.
      await backendFetch<BackendRecord>(
        `members/tajneed/${encodeURIComponent(memberId)}`
      );
      return true;
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401) return false;
      console.warn('Session validation could not reach the server; keeping the session.', err);
      return true;
    }
  },

  async getAllUsers(): Promise<User[]> {
    const token = getAuthToken();
    if (token) {
      try {
        // Read through the shared helper — if the backend later paginates
        // this endpoint, the full list is still fetched.
        const assignments = await getAllBackendPages('AdminAssignments');
        const activeAssignments = assignments.filter((assignment) =>
          bStr(assignment.status).toLowerCase() === 'active'
        );
        const mapped = activeAssignments.map((assignment) => ({
          id: bStr(assignment.id),
          memberId: bStr(assignment.membershipId).toUpperCase(),
          fullName: bStr(assignment.fullName, 'Name unavailable'),
          email: bStr(assignment.email),
          role: 'GENERAL_ADMIN' as const,
          assignedAuxiliary: bStr(assignment.auxiliary) as Auxiliary,
          dila: bStr(assignment.dila) || undefined,
          jamaat: bStr(assignment.jamaat) || undefined,
        }));
        const usersWithNames = await resolveMemberNames(mapped);
        setStorage('users', usersWithNames);
        return usersWithNames;
      } catch (err) {
        console.warn('Backend AdminAssignments fetch failed, using cached list:', err);
      }
    }
    await delay(100);
    const stored = removeLegacyDemoUsers(getStorage<User[]>('users', INITIAL_USERS));
    const usersWithNames = await resolveMemberNames(stored);
    setStorage('users', usersWithNames);
    return usersWithNames;
  },

  async getGeneralAdminById(id: string): Promise<User> {
    const assignment = await backendFetch<BackendRecord>(`AdminAssignments/${encodeURIComponent(id)}`);
    const memberId = bStr(assignment.membershipId).toUpperCase();
    const profile = await lookupMemberProfile(memberId);
    return {
      id: bStr(assignment.id, id),
      memberId,
      fullName: profile?.fullName || 'Name unavailable',
      email: profile?.email || '',
      role: 'GENERAL_ADMIN',
      assignedAuxiliary: bStr(assignment.auxiliary) as Auxiliary,
      dila: profile?.dila,
      jamaat: profile?.jamaat,
    };
  },

  async updateGeneralAdmin(id: string, auxiliary: Auxiliary, performedBy: User): Promise<void> {
    const existing = await backendFetch<BackendRecord>(`AdminAssignments/${encodeURIComponent(id)}`);
    await backendFetch<BackendRecord>(`AdminAssignments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        auxiliary,
        role: 'GeneralAdmin',
        status: bStr(existing.status, 'Active'),
        revokedBy: null,
      }),
    });
    const users = getStorage<User[]>('users', INITIAL_USERS);
    setStorage('users', users.map((user) => user.id === id
      ? { ...user, assignedAuxiliary: auxiliary }
      : user));
    await auditApi.recordLog({
      action: 'General Admin Assigned',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary,
      target: id,
      details: `Updated an administrator assignment to ${auxiliary}.`,
    });
  },

  async assignGeneralAdmin(memberId: string, auxiliary: Auxiliary, performedBy: User): Promise<User> {
    const cleanId = memberId.trim().toUpperCase();
    const token = getAuthToken();
    const users = removeLegacyDemoUsers(getStorage<User[]>('users', INITIAL_USERS));
    const existing = users.find((u) => u.memberId.toUpperCase() === cleanId);
    const directoryMember = await lookupMemberProfile(cleanId);
    let assignment: BackendRecord | undefined;

    if (token) {
      try {
        await backendFetch<BackendRecord>(`AdminAssignments/active/${encodeURIComponent(cleanId)}`);
        throw new Error('This member already has an active administrator assignment.');
      } catch (err) {
        // "No active assignment" is a 404 — that is the expected path, not a
        // failure. Check the HTTP status, not the message text: the friendly
        // error text no longer carries the "(404)" suffix, so matching on the
        // message made every assignment fail.
        const status = (err as { status?: number } | null)?.status;
        const alreadyAssigned =
          err instanceof Error &&
          err.message === 'This member already has an active administrator assignment.';
        if (alreadyAssigned) throw err;
        if (status !== 404) throw err;
      }
      assignment = await backendFetch<BackendRecord>('AdminAssignments', {
        method: 'POST',
        body: JSON.stringify({
          membershipId: cleanId,
          auxiliary,
          role: 'GeneralAdmin',
          assignedBy: performedBy.fullName,
        }),
      });
    }

    const resolvedName = directoryMember?.fullName ||
      (existing && !isGeneratedMemberName(existing.fullName) ? existing.fullName : 'Name unavailable');
    const updated: User = {
      id: bStr(assignment?.id, existing?.id || `usr-${Date.now()}`),
      memberId: cleanId,
      fullName: resolvedName,
      email: directoryMember?.email || existing?.email || '',
      role: 'GENERAL_ADMIN',
      assignedAuxiliary: auxiliary,
      dila: directoryMember?.dila || existing?.dila,
      jamaat: directoryMember?.jamaat || existing?.jamaat,
    };
    setStorage('users', [...users.filter((u) => u.memberId.toUpperCase() !== cleanId), updated]);

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
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('Administrator assignment not found.');

    const token = getAuthToken();
    if (token) {
      await backendFetch<BackendRecord>(`AdminAssignments/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          auxiliary: target.assignedAuxiliary,
          role: 'GeneralAdmin',
          status: 'Revoke',
          revokedBy: performedBy.fullName,
        }),
      });
    }

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

  async deleteGeneralAdmin(assignmentId: string, performedBy?: User): Promise<void> {
    const token = getAuthToken();
    if (token) {
      try {
        await backendFetch<void>(`AdminAssignments/${assignmentId}`, { method: 'DELETE' });
      } catch (err) {
        // "Already gone" is still a successful removal from the admin's view.
        const status = (err as { status?: number } | null)?.status;
        const message = err instanceof Error ? err.message : '';
        const alreadyGone = status === 404 || /not found|no such|does not exist/i.test(message);
        if (!alreadyGone) throw err;
      }
    }
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const target = users.find((u) => u.id === assignmentId);
    setStorage('users', users.filter((u) => u.id !== assignmentId));

    // Deleting an assignment used to leave no trace at all.
    if (performedBy) {
      await auditApi.recordLog({
        action: 'General Admin Revoked',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary: target?.assignedAuxiliary,
        target: target ? `${target.fullName} (${target.memberId})` : assignmentId,
        details: `General Admin assignment${target?.assignedAuxiliary ? ` for ${target.assignedAuxiliary}` : ''} was deleted.`,
      });
    }
  },
};

// EVENTS API & MAPPER
// These IDs belonged to retired mock events and may remain in older clients' localStorage.
const LEGACY_DEMO_EVENT_IDS = new Set(['evt-201', 'evt-202', 'evt-203']);

function removeLegacyDemoEvents(events: Event[]): Event[] {
  return events.filter((event) => !LEGACY_DEMO_EVENT_IDS.has(event.id));
}

function mapBackendEventToEvent(raw: BackendRecord): Event {
  const eventDate = bStr(raw.eventDate || raw.date, new Date().toISOString());
  const endDateRaw = bStr(raw.endDate);
  return {
    id: bStr(raw.id, `evt-${Date.now()}`),
    name: bStr(raw.name, 'Untitled Event'),
    description: bStr(raw.description),
    eventType: (raw.eventType === 'WorkShop' ? 'Workshop' : bStr(raw.eventType) || undefined) as EventType | undefined,
    date: eventDate.includes('T') ? eventDate.split('T')[0] : eventDate,
    endDate: endDateRaw ? (endDateRaw.includes('T') ? endDateRaw.split('T')[0] : endDateRaw) : undefined,
    venue: bStr(raw.venue),
    // No invented auxiliary: a record with no auxiliary stays unassigned so
    // it can never surface under the wrong majlis.
    auxiliary: (bStr(raw.auxiliary) || undefined) as Auxiliary | undefined,
    orgLevel: bStr(raw.organizationalLevel || raw.orgLevel, 'Ilaqa') as Event['orgLevel'],
    orgUnitName: bStr(raw.organizationalUnit || raw.orgUnitName, 'General'),
    status: bStr(raw.status, 'Upcoming') as EventStatus,
    createdAt: bStr(raw.createdAt, new Date().toISOString()),
    createdBy: bStr(raw.createdBy, 'System Admin'),
    participantsCount: bNum(raw.participantsCount ?? (Array.isArray(raw.participants) ? raw.participants.length : 0)),
    verifiedCount: bNum(raw.verifiedParticipantsCount ?? raw.verifiedCount ?? 0),
    certificatesIssuedCount: bNum(raw.certificatesIssuedCount ?? raw.certificatesCount ?? 0),
    theme: cleanTheme(raw.theme) || undefined,
  };
}

export const eventsApi = {
  /** One page of events, filtered server-side. */
  async getPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    auxiliary?: Auxiliary;
  }): Promise<PageResult<Event>> {
    return fetchBackendPage(
      'Events',
      {
        search: params.search,
        status: params.status,
        auxiliary: params.auxiliary,
      },
      params.page,
      params.pageSize,
      mapBackendEventToEvent
    );
  },

  async getAll(auxiliary?: Auxiliary): Promise<Event[]> {
    const token = getAuthToken();
    if (token) {
      try {
        // Both reads go through the shared helper so a paged response is never
        // mistaken for the complete list.
        const res = auxiliary
          ? await getAllBackendPages(`Events/auxiliary/${auxiliary}`)
          : await getAllBackendPages('Events');
        const mapped = removeLegacyDemoEvents(res.map(mapBackendEventToEvent));
        // Sync into local storage cache
        setStorage('events', mapped);
        return mapped;
      } catch (err) {
        console.warn('Backend Events fetch failed:', err);
        throw err;
      }
    }
    await delay(150);
    const cachedEvents = getStorage<Event[]>('events', INITIAL_EVENTS);
    const events = removeLegacyDemoEvents(cachedEvents);
    if (events.length !== cachedEvents.length) setStorage('events', events);
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
        console.warn(`Backend Events/${id} fetch failed:`, err);
        throw err;
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
          eventType: data.eventType === 'Workshop' ? 'WorkShop' : data.eventType ?? null,
          eventDate: new Date(data.date).toISOString(),
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          venue: data.venue.trim(),
          auxiliary: data.auxiliary,
          organizationalLevel: data.orgLevel,
          organizationalUnit: data.orgUnitName.trim() || null,
          theme: data.theme?.trim() || null,
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
          eventType: data.eventType === 'Workshop' ? 'WorkShop' : data.eventType ?? null,
          eventDate: data.date ? new Date(data.date).toISOString() : undefined,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          venue: data.venue,
          auxiliary: data.auxiliary,
          organizationalLevel: data.orgLevel,
          organizationalUnit: data.orgUnitName,
          status: data.status,
          theme: data.theme,
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

export const dashboardApi = {
  async getSummary(): Promise<BackendRecord> {
    return backendFetch<BackendRecord>('dashboard/summary');
  },
};

// PARTICIPANTS API & MAPPER
function mapBackendVerificationStatus(status: string | undefined): VerificationStatus {
  if (!status) return 'Pending';
  const clean = status.replace(/[\s_-]+/g, '').toLowerCase();
  if (clean === 'pending') return 'Pending';
  if (clean === 'verified') return 'Verified';
  if (clean === 'notfound') return 'Not Found';
  if (clean === 'invalid') return 'Invalid';
  if (clean === 'duplicate') return 'Duplicate';
  if (clean === 'verificationfailed' || clean === 'failed') return 'Verification Failed';
  return 'Pending';
}

function mapBackendParticipantToParticipant(raw: BackendRecord, fallbackEventId?: string): Participant {
  return {
    id: bStr(raw.id, `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
    eventId: bStr(raw.eventId || fallbackEventId),
    memberId: bStr(raw.membershipId || raw.memberId).toUpperCase(),
    fullName: bStr(raw.fullName, 'Unknown Member'),
    email: bStr(raw.email) || undefined,
    phone: bStr(raw.phone) || undefined,
    // No invented auxiliary: an unassigned participant must not be filed
    // under a real majlis by default.
    auxiliary: (bStr(raw.auxiliary) || undefined) as Auxiliary | undefined,
    // Mulk (Khuddam/Ansarullah/Atfal) or District (Lajna/Nasra) — only when
    // the backend supplies it.
    mulkOrDistrict: bStr(raw.mulkOrDistrict) || undefined,
    // Do not substitute demo locations for missing member-directory data.
    dila: bStr(raw.dila),
    ilaqa: bStr(raw.ilaqa) || undefined,
    jamaat: bStr(raw.jamaat),
    verificationStatus: mapBackendVerificationStatus(bStr(raw.verificationStatus) || (bBool(raw.isVerified, false) ? 'Verified' : 'Pending')),
    verificationDetails: bStr(raw.verificationMessage || raw.verificationDetails) || (bBool(raw.isVerified, false) ? 'Verified via central registry' : undefined),
    certificateAssigned: (bStr(raw.certificateAssigned || raw.certificateType) || undefined) as Participant['certificateAssigned'],
    certificateId: raw.certificateId ? String(raw.certificateId) : undefined,
    addedAt: bStr(raw.createdAt || raw.addedAt, new Date().toISOString()),
    notes: bStr(raw.notes) || undefined,
  };
}

export const participantsApi = {
  async getAll(): Promise<Participant[]> {
    const records = await getAllBackendPages('Participants');
    return records.map((participant) => mapBackendParticipantToParticipant(participant));
  },

  /** One page of participants, filtered server-side. */
  async getPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    auxiliary?: Auxiliary;
    eventId?: string;
  }): Promise<PageResult<Participant>> {
    return fetchBackendPage(
      'Participants',
      {
        search: params.search,
        status: params.status,
        auxiliary: params.auxiliary,
        eventId: params.eventId,
      },
      params.page,
      params.pageSize,
      (record) => mapBackendParticipantToParticipant(record, params.eventId)
    );
  },

  async getById(id: string): Promise<Participant> {
    const record = await backendFetch<BackendRecord>(`Participants/${encodeURIComponent(id)}`);
    return mapBackendParticipantToParticipant(record);
  },

  async getMy(): Promise<Participant[]> {
    // Shared helper — a paged response is never mistaken for the full list.
    const response = await getAllBackendPages('Participants/my');
    return response.map((participant) => mapBackendParticipantToParticipant(participant));
  },

  async getByEvent(eventId: string): Promise<Participant[]> {
    const token = getAuthToken();
    if (token) {
      try {
        // Read through the shared helper so a paged response is never mistaken
        // for the complete roster.
        const res = await getAllBackendPages(`Participants/event/${eventId}`);
        const mapped = res.map((p) => mapBackendParticipantToParticipant(p, eventId));
        const allStored = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
        const others = allStored.filter((p) => p.eventId !== eventId);
        setStorage('participants', [...mapped, ...others]);
        return mapped;
      } catch (err) {
        console.warn(`Backend Participants for event ${eventId} fetch failed:`, err);
        throw err;
      }
    }
    await delay(150);
    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    return participants.filter((p) => p.eventId === eventId);
  },

  async update(participant: Participant, performedBy: User): Promise<Participant> {
    const token = getAuthToken();
    const isBackendId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(participant.id);
    if (!token || !isBackendId) {
      const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
      const updated = { ...participant };
      setStorage('participants', participants.map((item) => item.id === participant.id ? updated : item));
      await auditApi.recordLog({
        action: 'Member Verification',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary: updated.auxiliary,
        target: `${updated.memberId} (${updated.eventId})`,
        details: 'Updated participant details in the local demo roster.',
      });
      return updated;
    }

    const response = await backendFetch<BackendRecord>(`Participants/${encodeURIComponent(participant.id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: participant.fullName,
        email: participant.email ?? null,
        phone: participant.phone ?? null,
        jamaat: participant.jamaat,
        dila: participant.dila,
        ilaqa: participant.ilaqa ?? null,
        auxiliary: participant.auxiliary,
        isVerified: participant.verificationStatus === 'Verified',
        verificationStatus: participant.verificationStatus,
        verificationMessage: participant.verificationDetails ?? null,
      }),
    });
    const updated = mapBackendParticipantToParticipant(response, participant.eventId);
    await auditApi.recordLog({
      action: 'Member Verification',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: updated.auxiliary,
      target: `${updated.memberId} (${updated.eventId})`,
      details: 'Updated participant details through the backend.',
    });
    return updated;
  },

  async delete(id: string, performedBy: User, participant?: Participant): Promise<void> {
    const token = getAuthToken();
    const isBackendId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);
    if (!token || !isBackendId) {
      const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
      const record = participant ?? participants.find((item) => item.id === id);
      if (!record) throw new Error('Participant was not found in the current roster.');
      setStorage('participants', participants.filter((item) => item.id !== id));
      await auditApi.recordLog({
        action: 'Participant Import',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary: record.auxiliary,
        target: `${record.memberId} (${record.eventId})`,
        details: 'Removed participant from the local demo roster.',
      });
      return;
    }

    // Do not pre-fetch the record just to describe it in the audit entry —
    // a detail lookup can 404 even when the enrollment is still there, and
    // that used to abort the delete before it was ever attempted.
    let known = participant;
    if (!known) {
      try {
        known = await this.getById(id);
      } catch {
        known = undefined;
      }
    }

    try {
      await backendFetch<void>(`Participants/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      // "Already gone" is still a successful removal from the admin's view.
      const status = (err as { status?: number } | null)?.status;
      const message = err instanceof Error ? err.message : '';
      const alreadyGone = status === 404 || /not found|no such|does not exist/i.test(message);
      if (!alreadyGone) throw err;
      console.warn(`Participant ${id} was already absent on the backend.`);
    }

    await auditApi.recordLog({
      action: 'Participant Import',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: known?.auxiliary,
      target: known ? `${known.memberId} (${known.eventId})` : id,
      details: 'Removed participant enrollment.',
    });
  },

  async verifyMemberId(memberId: string, auxiliary?: Auxiliary): Promise<{
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
          const status = mapBackendVerificationStatus(bStr(res.status || res.verificationStatus) || 'Pending');
          return {
            status,
            details: bStr(res.message || res.verificationMessage, status === 'Verified' ? 'Verified via central Jama\'at member registry' : 'Member verification did not return a verified status.'),
            member: {
              memberId: cleanId,
              fullName: bStr(res.fullName, `Brother ${cleanId}`),
              auxiliary: (res.auxiliary || auxiliary) as Auxiliary,
              // Left undefined when the registry omits it — 'National HQ' was
              // an invented value printed on certificates.
              mulkOrDistrict: bStr(res.mulkOrDistrict) || undefined,
              ilaqa: bStr(res.ilaqa) || undefined,
              dila: bStr(res.dila),
              jamaat: bStr(res.jamaat),
              email: bStr(res.email) || undefined,
              phone: bStr(res.phone) || undefined,
              status: 'Active',
            },
          };
        }
      } catch (err) {
        console.warn(`Backend verify/${cleanId} failed:`, err);
        throw err;
      }
    }

    // Fallback to local registry adapter. The central Jama'at member API is
    // not connected yet, so this only ever runs in the signed-out demo mode —
    // but the result must say so, otherwise a local/demo lookup is
    // indistinguishable from a real central verification.
    const fallback = await jamaatMemberApi.verifyMember(cleanId, auxiliary);
    if (!isLiveJamaatApi()) {
      return {
        ...fallback,
        details: `${fallback.details} (verified against the local registry — the central Jama'at member API is not connected)`,
      };
    }
    return fallback;
  },
  async addSingle(eventId: string, memberId: string, performedBy: User): Promise<Participant> {
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const cleanId = memberId.trim().toUpperCase();
    const token = getAuthToken();
    const currentRoster = token
      ? await this.getByEvent(eventId)
      : getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS).filter((participant) => participant.eventId === eventId);
    if (currentRoster.some((participant) => participant.memberId.trim().toUpperCase() === cleanId)) {
      throw new Error(`${cleanId} is already enrolled in this event.`);
    }

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
          email: memberData.email || null,
          phone: memberData.phone || null,
          jamaat: memberData.jamaat || null,
          dila: memberData.dila || null,
          ilaqa: memberData.ilaqa || null,
          auxiliary: event.auxiliary,
        };

        const res = await backendFetch<BackendRecord>('Participants', {
          method: 'POST',
          body: JSON.stringify(backendPayload),
        });

        const newParticipant = mapBackendParticipantToParticipant(res || { ...backendPayload, id: `part-${Date.now()}` }, eventId);
        if (!res?.verificationStatus && !res?.isVerified) {
          newParticipant.verificationStatus = verification.status;
          newParticipant.verificationDetails = verification.details;
        }

        const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
        setStorage('participants', [newParticipant, ...participants.filter((p) => p.id !== newParticipant.id)]);

        // The signed-in path must be audited too — only the offline path
        // used to write this entry, so real enrollments went unrecorded.
        await auditApi.recordLog({
          action: 'Member Verification',
          adminName: performedBy.fullName,
          adminRole: performedBy.role,
          auxiliary: event.auxiliary,
          target: `${cleanId} (${event.name})`,
          details: `Enrolled participant: Status ${verification.status}`,
        });

        return newParticipant;
      } catch (err) {
        console.warn('Backend create participant failed:', err);
        throw err;
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
      dila: memberData.dila || '',
      ilaqa: memberData.ilaqa || '',
      jamaat: memberData.jamaat || '',
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
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    if (getAuthToken()) {
      const existing = await this.getByEvent(eventId);
      const knownIds = new Set(existing.map((participant) => participant.memberId.trim().toUpperCase()));
      const newlyAdded: Participant[] = [];
      let verifiedCount = 0;
      let notFoundCount = 0;
      let invalidCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;
      const failures: string[] = [];

      for (const rawId of memberIds) {
        const cleanId = rawId.trim().toUpperCase();
        if (!cleanId) continue;
        if (knownIds.has(cleanId)) {
          duplicateCount += 1;
          continue;
        }
        knownIds.add(cleanId);

        // Every row is independent: a failed lookup or create must not abort
        // the whole batch, otherwise one bad Member ID discards every row.
        try {
          const verification = await this.verifyMemberId(cleanId, event.auxiliary);
          if (verification.status === 'Not Found') {
            notFoundCount += 1;
            continue;
          }
          if (verification.status === 'Invalid') {
            invalidCount += 1;
            continue;
          }
          if (verification.status !== 'Verified') {
            failedCount += 1;
            continue;
          }
          if (verification.member?.auxiliary && verification.member.auxiliary !== event.auxiliary) {
            invalidCount += 1;
            continue;
          }

          const member = verification.member;
          const response = await backendFetch<BackendRecord>('Participants', {
            method: 'POST',
            body: JSON.stringify({
              eventId,
              membershipId: cleanId,
              fullName: member?.fullName || `Member ${cleanId}`,
              email: member?.email || null,
              phone: member?.phone || null,
              jamaat: member?.jamaat || null,
              dila: member?.dila || null,
              ilaqa: member?.ilaqa || null,
              auxiliary: event.auxiliary,
            }),
          });
          newlyAdded.push(mapBackendParticipantToParticipant(response, eventId));
          verifiedCount += 1;
        } catch (error) {
          failedCount += 1;
          const reason = error instanceof Error ? error.message : 'Unknown error';
          failures.push(`${cleanId}: ${reason}`);
        }
      }

      // Always write the summary — even when nothing was added — so the
      // attempt itself stays auditable and no rows are silently dropped.
      await auditApi.recordLog({
        action: 'Participant Import',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary: event.auxiliary,
        target: `${newlyAdded.length} Participants (${event.name})`,
        details: `Bulk verified import: ${verifiedCount} verified, ${notFoundCount} not found, ${invalidCount} invalid, ${duplicateCount} duplicate, ${failedCount} failed.${failures.length ? ` Errors: ${failures.slice(0, 5).join('; ')}` : ''}`,
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
    }

    await delay(400);

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
        continue;
      } else {
        existingSet.add(cleanId);
        // Same per-row isolation as the signed-in path.
        try {
          const res = await this.verifyMemberId(cleanId, event.auxiliary);
          status = res.status;
          details = res.details;
          if (res.member) memberInfo = res.member;
        } catch (error) {
          status = 'Verification Failed';
          details = error instanceof Error ? error.message : 'Member verification failed.';
          failedCount++;
          continue;
        }

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
        dila: memberInfo.dila || '',
        ilaqa: memberInfo.ilaqa || '',
        jamaat: memberInfo.jamaat || '',
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

interface AuxiliaryTemplateDefaults {
  organizationName: string;
  organizationSubtitle: string;
  logoType: CertificateTemplate['logoType'];
  eventTitle: string;
  typeBadgeText: string;
  participationLine: string;
  themeTitle: string;
  programDurationText: string;
  bodyIntroText: string;
  bodyDescriptionText: string;
  bodyFocusText: string;
  signature1Date: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

/**
 * Fallback artwork per auxiliary. One system serves all five auxiliaries, so a
 * template that omits these fields must never inherit another majlis' name,
 * salutation or event wording — that would print the wrong organisation (and
 * previously a named individual) on an official certificate.
 */
const AUXILIARY_TEMPLATE_DEFAULTS: Record<Auxiliary | 'All', AuxiliaryTemplateDefaults> = {
  All: {
    organizationName: "AHMADIYYA JAMA'AT",
    organizationSubtitle: '(Certificate of Participation)',
    logoType: 'jamaat-crest',
    eventTitle: 'CERTIFICATE OF PARTICIPATION',
    typeBadgeText: 'CERTIFICATE OF PARTICIPATION',
    participationLine: 'Participated in the programme which took place',
    themeTitle: 'Faith, Discipline and Service.',
    programDurationText: '',
    bodyIntroText: 'This is to certify that {{ParticipantName}}, Dilla {{Dilla}}, from {{Jamaat}}.',
    bodyDescriptionText: 'Participated in the programme which took place at {{Venue}}.',
    bodyFocusText: 'In recognition of commitment to faith, discipline and service to the nation.',
    signature1Date: '',
    primaryColor: '#0f766e',
    accentColor: '#d97706',
    backgroundColor: '#ffffff',
  },
  Atfal: {
    organizationName: 'MAJLIS ATFAL-UL AHMADIYYA NIGERIA',
    organizationSubtitle: '(Ahmadiyya Muslims Children Organization)',
    logoType: 'atfal-emblem',
    eventTitle: 'ISLAMIC VACATION COURSE/REGIONAL IJTEMA 2025',
    typeBadgeText: 'CERTIFICATE OF PARTICIPATION',
    participationLine: 'Participated in a week Islamic Vacation Course which took place',
    themeTitle: 'My Faith, My Identity.',
    programDurationText: '3rd August to Sunday 10th August, 2025',
    bodyIntroText: 'This is to congratulate and certify that Tifl {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}} from {{Jamaat}}.',
    bodyDescriptionText: 'Participated in a week Islamic Vacation Course which took place at {{Venue}}.',
    bodyFocusText: 'The program focussed on enhancing Islamic knowledge, promoting religious tolerance, and fostering nation-building by raising children who will contribute to peace and societal growth.',
    signature1Date: '10th August, 2025',
    primaryColor: '#15803d',
    accentColor: '#84cc16',
    backgroundColor: '#ffffff',
  },
  Khuddam: {
    organizationName: 'MAJLIS KHUDDAM-UL-AHMADIYYA',
    organizationSubtitle: '(Ahmadiyya Muslim Youth Association)',
    logoType: 'khuddam-emblem',
    eventTitle: 'ANNUAL NATIONAL IJTEMA 2026',
    typeBadgeText: 'CERTIFICATE OF EXCELLENCE',
    participationLine: 'Participated in the Annual National Ijtema which took place',
    themeTitle: 'Honor Thy Pledge',
    programDurationText: '18th to 20th September, 2026',
    bodyIntroText: 'Awarded with high distinction to Khadim {{ParticipantName}}, Dilla {{Dilla}}, representing {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'For securing exceptional academic merit and outstanding commitment during the National Ijtema at {{Venue}}.',
    bodyFocusText: 'In recognition of steadfast dedication to moral excellence, discipline, and selfless service to faith and nation.',
    signature1Date: '20th September, 2026',
    primaryColor: '#046a38',
    accentColor: '#d97706',
    backgroundColor: '#fcfdfb',
  },
  Ansarullah: {
    organizationName: 'MAJLIS ANSARULLAH NIGERIA',
    organizationSubtitle: '(Ahmadiyya Muslim Elders Association)',
    logoType: 'ansarullah-emblem',
    eventTitle: 'NATIONAL IJTEMA & TARBIYYAT CONVENTION 2026',
    typeBadgeText: 'CERTIFICATE OF RECOGNITION',
    participationLine: 'Participated in the Annual National Ijtema which took place',
    themeTitle: 'Steadfast Servants of Allah',
    programDurationText: '22nd to 24th November, 2026',
    bodyIntroText: 'This is to proudly certify and honour Nasir {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}}, from {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'For his distinguished participation in the National Ijtema & Tarbiyyat Convention held at {{Venue}}.',
    bodyFocusText: 'A gathering dedicated to upholding the highest ideals of service, wisdom, and unwavering faith in Ahmadiyyat — for the glory of Islam and the service of humanity.',
    signature1Date: '24th November, 2026',
    primaryColor: '#1e3a8a',
    accentColor: '#d97706',
    backgroundColor: '#eff6ff',
  },
  Lajna: {
    organizationName: "LAJNA IMA'ILLAH",
    organizationSubtitle: "(Ahmadiyya Muslim Women's Association)",
    logoType: 'lajna-emblem',
    eventTitle: 'NATIONAL TARBIYYAT & ACADEMIC SEMINAR 2026',
    typeBadgeText: 'CERTIFICATE OF APPRECIATION',
    participationLine: 'Participated in the National Tarbiyyat Seminar which took place',
    themeTitle: 'Women as Pillars of Peace',
    programDurationText: '15th October, 2026',
    bodyIntroText: 'Warmly presented to Lajna member {{ParticipantName}}, Dilla {{Dilla}}, {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'In gracious appreciation for her active participation and presentation at {{Venue}}.',
    bodyFocusText: 'Exemplifying virtue, spiritual leadership, and devotion in educating future generations.',
    signature1Date: '15th October, 2026',
    primaryColor: '#0f766e',
    accentColor: '#f59e0b',
    backgroundColor: '#fafcfb',
  },
  Nasra: {
    organizationName: 'MAJLIS NASRA-TUL-AHMADIYYA NIGERIA',
    organizationSubtitle: "(Ahmadiyya Muslim Boys' Association)",
    logoType: 'nasra-emblem',
    eventTitle: 'NATIONAL NASRA IJTEMA & SKILLS EXPOSITION 2026',
    typeBadgeText: 'CERTIFICATE OF MERIT',
    participationLine: 'Participated in a week Islamic Vacation Course which took place',
    themeTitle: 'Young Minds, Strong Iman',
    programDurationText: '8th to 10th December, 2026',
    bodyIntroText: 'This is to commend and certify Nasirah {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}}, from {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'For commendable participation and dedication displayed at the National Nasra Ijtema held at {{Venue}}.',
    bodyFocusText: 'Championing youth excellence, spiritual growth, and practical service — building a generation of young Ahmadi men rooted in faith and prepared to serve the nation.',
    signature1Date: '10th December, 2026',
    primaryColor: '#6d28d9',
    accentColor: '#a78bfa',
    backgroundColor: '#faf5ff',
  },
};

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

  const auxiliary = (bStr(raw.auxiliary, 'All')) as Auxiliary | 'All';
  // Fallbacks follow the template's own auxiliary, so a Khuddam design never
  // inherits Atfal's organisation name, salutation or event wording.
  const defaults = AUXILIARY_TEMPLATE_DEFAULTS[auxiliary] ?? AUXILIARY_TEMPLATE_DEFAULTS.All;

  return {
    id: bStr(raw.id, `tmpl-${Date.now()}`),
    name: bStr(raw.name, 'Official Template'),
    auxiliary,
    certificateType: fromBackendCertType(bStr(raw.certificateType || config.certificateType) || undefined),
    design: bStr(config.design, 'modern-rings') as CertificateTemplate['design'],
    orientation,
    primaryColor: bStr(config.primaryColor, defaults.primaryColor),
    accentColor: bStr(config.accentColor, defaults.accentColor),
    neutralColor: bStr(config.neutralColor, '#0f172a'),
    backgroundColor: bStr(config.backgroundColor, defaults.backgroundColor),
    showWaveWatermark: bBool(config.showWaveWatermark, true),
    showTorusRings: bBool(config.showTorusRings, true),
    showRosetteBadge: bBool(config.showRosetteBadge, true),
    organizationName: bStr(config.organizationName, defaults.organizationName),
    organizationSubtitle: bStr(config.organizationSubtitle, defaults.organizationSubtitle),
    logoType: bStr(config.logoType, defaults.logoType) as CertificateTemplate['logoType'],
    // Only an explicitly uploaded logo belongs here. The background artwork is
    // a different asset, and defaulting to the Ahmadiyya mark made every
    // template render the mosque instead of its own auxiliary emblem.
    logoUrl: bStr(config.logoUrl || raw.filePath) || undefined,
    backgroundImagePath: bStr(raw.backgroundImagePath) || undefined,
    eventTitle: bStr(config.eventTitle, defaults.eventTitle),
    typeBadgeText: bStr(config.typeBadgeText, defaults.typeBadgeText),
    participationLine: bStr(config.participationLine, defaults.participationLine),
    themeTitle: bStr(config.themeTitle, defaults.themeTitle),
    programDurationText: bStr(config.programDurationText, defaults.programDurationText),
    bodyIntroText: bStr(config.bodyIntroText, defaults.bodyIntroText),
    bodyDescriptionText: bStr(config.bodyDescriptionText, defaults.bodyDescriptionText),
    bodyFocusText: bStr(config.bodyFocusText, defaults.bodyFocusText),
    signature1Name: bStr(config.signature1Name, 'National Sadr'),
    signature1Title: bStr(config.signature1Title, defaults.organizationName),
    signature1Date: bStr(config.signature1Date, defaults.signature1Date),
    signature1Image: bStr(config.signature1Image) || undefined,
    signatureAssetPath: bStr(config.signatureAssetPath) || undefined,
    isDefault: bBool(raw.isActive, false),
    updatedAt: bStr(raw.updatedAt, new Date().toISOString()),
  };
}

/**
 * The generic Ahmadiyya mark was once used as the default `logoUrl` for every
 * template, and the certificate background artwork was briefly written into
 * the same field. Neither is a real per-auxiliary logo, so both are treated as
 * "no logo set" — the artwork then falls back to the auxiliary's own emblem.
 */
const NON_LOGO_URLS = new Set([
  '/ahmadiyyah_logo.png',
  '/certificate-design1.png',
  '/certificate-design2.png',
]);

/**
 * Every certificate is signed by the National Sadr of the auxiliary body that
 * issued it, and carries that auxiliary's emblem as its logo. Applies the
 * standardized signature name/title + logoType so cached/local overrides and
 * backend records can't keep stale person-specific names or the wrong majlis
 * logo.
 */
function normalizeTemplateSignature(tmpl: CertificateTemplate): CertificateTemplate {
  const titleByAuxiliary: Record<Auxiliary | 'All', string> = {
    All: 'Majlis Atfal-ul-Ahmadiyya',
    Khuddam: 'Majlis Khuddam-ul-Ahmadiyya',
    Atfal: 'Majlis Atfal-ul-Ahmadiyya',
    Ansarullah: 'Majlis Ansarullah Nigeria',
    Lajna: 'Lajna Ima\'illah',
    Nasra: 'Nasra-tul-Ahmadiyya',
  };
  const emblemByAuxiliary: Record<Auxiliary | 'All', string | undefined> = {
    All: undefined,
    Khuddam: 'khuddam-emblem',
    Atfal: 'atfal-emblem',
    Ansarullah: 'ansarullah-emblem',
    Lajna: 'lajna-emblem',
    Nasra: 'nasra-emblem',
  };
  const auxiliary = tmpl.auxiliary ?? 'All';
  // A generic mark or a background artwork is not a logo — drop it so the
  // auxiliary emblem (header logo + watermark) is used instead.
  const logoUrl =
    tmpl.logoUrl && !NON_LOGO_URLS.has(tmpl.logoUrl) ? tmpl.logoUrl : undefined;
  return {
    ...tmpl,
    signature1Name: 'National Sadr',
    signature1Title: titleByAuxiliary[auxiliary] ?? 'Majlis Atfal-ul-Ahmadiyya',
    logoUrl,
    ...(!logoUrl && emblemByAuxiliary[auxiliary]
      ? { logoType: emblemByAuxiliary[auxiliary] as CertificateTemplate['logoType'] }
      : {}),
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
    // CertificateDto exposes the participant ID as participantMembershipId.
    memberId: bStr(part?.membershipId || raw.participantMembershipId || raw.memberId),
    // The event owns its auxiliary; fall back to the participant only when
    // the event itself is missing one. Never invent a value.
    auxiliary: (bStr(raw.auxiliary) || bStr(evt?.auxiliary) || bStr(part?.auxiliary) || undefined) as Auxiliary | undefined,
    dila: bStr(part?.dila || raw.dila),
    ilaqa: bStr(part?.ilaqa || raw.ilaqa) || undefined,
    jamaat: bStr(part?.jamaat || raw.jamaat),
    type: certType,
    templateId: bStr(raw.certificateTemplateId || raw.templateId, 'tmpl-01'),
    issuedAt: bStr(raw.issuedAt || raw.createdAt, new Date().toISOString()),
    issuedBy: bStr(raw.issuedBy, 'System Admin'),
    status,
    filePath: bStr(raw.filePath) || undefined,
    revocationReason: bStr(raw.revocationReason) || undefined,
    revokedAt: bStr(raw.revokedAt) || undefined,
    revokedBy: bStr(raw.revokedBy) || undefined,
    // The backend issues the verification hash. Never invent one for a
    // server-issued certificate — a made-up hash would point at a link the
    // server knows nothing about.
    verificationHash: bStr(raw.verificationHash || raw.qrCodeUrl),
    theme: cleanTheme(evt?.theme || raw.theme) || undefined,
  };
}

// TEMPLATES API
export const templatesApi = {
  async getAll(auxiliary?: Auxiliary): Promise<CertificateTemplate[]> {
    const token = getAuthToken();
    if (token) {
      try {
        // NOTE: like every other list endpoint, the backend wraps results
        // (paged envelope), so unwrap with getAllBackendPages — a bare
        // Array.isArray check misses everything.
        const records = await getAllBackendPages('CertificateTemplates');
        if (records.length > 0) {
          const mapped = records.map(mapBackendTemplateToTemplate);
          const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
          const byId = new Map(mapped.map((tmpl) => [tmpl.id, tmpl]));
          // Local Studio saves (edits + seed presets missing from the
          // backend) stay visible alongside backend templates. Overrides
          // are full templates, so ones with no base are appended as-is.
          for (const [id, override] of Object.entries(savedOverrides)) {
            const base = byId.get(id) ?? INITIAL_TEMPLATES.find((t) => t.id === id);
            byId.set(id, base ? { ...base, ...override } : override);
          }
          for (const seed of INITIAL_TEMPLATES) {
            if (!byId.has(seed.id)) {
              const override = savedOverrides[seed.id];
              byId.set(seed.id, override ? { ...seed, ...override } : seed);
            }
          }
          // Every certificate is signed by the National Sadr of the auxiliary
          // body, and carries that auxiliary's emblem. `map`, not `forEach` —
          // forEach discards the returned object and never applied this.
          const merged = [...byId.values()].map(normalizeTemplateSignature);
          if (!auxiliary) return merged;
          return merged.filter((t) => !t.auxiliary || t.auxiliary === 'All' || t.auxiliary === auxiliary);
        }
      } catch (err) {
        console.warn('Backend CertificateTemplates fetch failed, falling back to local list:', err);
      }
    }

    await delay(100);
    const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
    const merged: CertificateTemplate[] = [
      ...INITIAL_TEMPLATES.map((tmpl) =>
        savedOverrides[tmpl.id] ? { ...tmpl, ...savedOverrides[tmpl.id] } : tmpl
      ),
      // Brand-new local designs (no seed base, backend unreachable/empty).
      ...Object.values(savedOverrides).filter(
        (o) => !INITIAL_TEMPLATES.some((t) => t.id === o.id)
      ),
    ].map(normalizeTemplateSignature);

    if (!auxiliary) return merged;
    return merged.filter(
      (t) => !t.auxiliary || t.auxiliary === 'All' || t.auxiliary === auxiliary
    );
  },

  async getActive(auxiliary?: Auxiliary): Promise<CertificateTemplate[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const suffix = auxiliary ? `?auxiliary=${encodeURIComponent(auxiliary)}` : '';
        const response = await backendFetch<unknown>(`CertificateTemplates/active${suffix}`);
        const items = pageItems(response);
        return items.map(mapBackendTemplateToTemplate);
      } catch (error) {
        console.warn('Backend active templates fetch failed:', error);
        throw error;
      }
    }
    return (await this.getAll(auxiliary)).filter((template) => template.isDefault);
  },

  async getById(id: string): Promise<CertificateTemplate> {
    const response = await backendFetch<BackendRecord>(`CertificateTemplates/${encodeURIComponent(id)}`);
    return normalizeTemplateSignature(mapBackendTemplateToTemplate(response));
  },

  async delete(id: string, performedBy?: User, templateName?: string): Promise<void> {
    let deletedName = templateName;
    if (!deletedName) {
      try {
        const existing = await this.getById(id);
        deletedName = existing.name;
      } catch {
        // The template may already be gone from the backend; the id is enough
        // to write an accurate audit entry.
      }
    }
    try {
      await backendFetch<void>(`CertificateTemplates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      // "Not found" (whatever status the API used for it) means it is already
      // gone on the server — often a design that only ever existed in this
      // browser's localStorage. That is still a successful delete from the
      // admin's point of view, so fall through to the local cleanup.
      const status = (err as { status?: number } | null)?.status;
      const message = err instanceof Error ? err.message : '';
      const alreadyGone = status === 404 || /not found|no such|does not exist/i.test(message);
      if (!alreadyGone) throw err;
      console.warn(`Template ${id} was already absent on the backend; removing local copy only.`);
    }
    // Drop the local shadow copy as well. getAll() merges `template_overrides`
    // back into the list, so a deleted design would come back from localStorage
    // and every later click on it would 404 on the detail fetch.
    const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
    if (savedOverrides[id]) {
      delete savedOverrides[id];
      setStorage('template_overrides', savedOverrides);
    }

    // Deleting a design is an auditable action — it used to leave no trace.
    if (performedBy) {
      await auditApi.recordLog({
        action: 'Template Deleted',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        target: deletedName || id,
        details: `Deleted certificate template "${deletedName || id}". Certificates already issued with it are unaffected.`,
      });
    }
  },

  async uploadAsset(file: File, folder: 'templates' | 'signatures' | 'logos' = 'templates'): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const response = await backendFetch<BackendRecord>('CertificateTemplates/assets', {
      method: 'POST',
      body: form,
    });
    return bStr(response.path);
  },

  async preview(template: CertificateTemplate): Promise<string> {
    const configurationJson = JSON.stringify({
      textElements: [
        { placeholder: 'EventName', x: 561, y: 210, fontFamily: 'Arial', fontSize: 30, bold: true, textColor: template.neutralColor, alignment: 'Center' },
        { placeholder: 'ParticipantName', x: 561, y: 340, fontFamily: 'Arial', fontSize: 26, bold: true, textColor: template.primaryColor, alignment: 'Center' },
        { placeholder: 'CertificateNumber', x: 561, y: 610, fontFamily: 'Arial', fontSize: 14, textColor: template.neutralColor, alignment: 'Center' },
      ],
      imageElements: [],
    });
    return backendFetch<string>('CertificateTemplates/preview', {
      method: 'POST',
      body: JSON.stringify({
        configurationJson,
        width: 1122,
        height: 793,
        backgroundImagePath: template.backgroundImagePath || template.logoUrl || null,
      }),
    });
  },

  async save(templateData: CertificateTemplate, performedBy: User): Promise<CertificateTemplate> {
    // Set when the server rejects the save — the local copy is kept but the
    // failure is surfaced instead of being logged as a success.
    let backendSaveError: string | null = null;
    let updatedTemplate: CertificateTemplate = {
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
          // Never persist a generic mark or background artwork as this
          // template's logo — it would override the auxiliary's own emblem on
          // every render.
          logoUrl:
            templateData.logoUrl && !NON_LOGO_URLS.has(templateData.logoUrl)
              ? templateData.logoUrl
              : undefined,
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
          signatureAssetPath: templateData.signatureAssetPath,
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
        const response = templateData.id && templateData.id.includes('-') && templateData.id.length > 20
          ? await backendFetch<BackendRecord>(`CertificateTemplates/${templateData.id}`, {
            method: 'PUT',
            body: JSON.stringify(backendPayload),
          })
          : await backendFetch<BackendRecord>('CertificateTemplates', {
            method: 'POST',
            body: JSON.stringify(backendPayload),
          });
        if (response.id) updatedTemplate = { ...updatedTemplate, id: bStr(response.id) };
      } catch (err) {
        // The server rejected the save. Keep the local copy so no work is
        // lost, but record the real failure and tell the caller — logging
        // "Template Modified" here would claim a success that never happened
        // and the admin would only discover the problem later, when
        // certificate generation refuses the template.
        const reason = err instanceof Error ? err.message : 'Unknown error';
        console.warn('Failed to save template to backend, saving locally:', err);
        backendSaveError = reason;
      }
    }

    const normalizedTemplate = normalizeTemplateSignature(updatedTemplate);

    const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});
    savedOverrides[normalizedTemplate.id] = normalizedTemplate;
    setStorage('template_overrides', savedOverrides);

    if (backendSaveError) {
      await auditApi.recordLog({
        action: 'Template Save Failed',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary:
          updatedTemplate.auxiliary === 'All'
            ? undefined
            : (updatedTemplate.auxiliary as Auxiliary),
        target: updatedTemplate.name,
        details: `Server rejected the template save: ${backendSaveError}. The design was kept on this device only and cannot be used for certificate generation until the server save succeeds.`,
      });
      throw new Error(
        `The server rejected this template save: ${backendSaveError}. Your design was kept on this device, but it cannot be used to generate certificates until the server save succeeds.`
      );
    }

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

    return normalizedTemplate;
  },
};

// CERTIFICATES API
// The retired sample event shipped with two certificates; remove direct IDs and event-linked copies.
const LEGACY_DEMO_CERTIFICATE_IDS = new Set(['cert-201-1', 'cert-201-2']);
const LEGACY_DEMO_CERTIFICATE_EVENT_IDS = new Set(['evt-201', 'evt-202', 'evt-203']);

function removeLegacyDemoCertificates(certificates: Certificate[]): Certificate[] {
  return certificates.filter((certificate) =>
    !LEGACY_DEMO_CERTIFICATE_IDS.has(certificate.id) &&
    !LEGACY_DEMO_CERTIFICATE_EVENT_IDS.has(certificate.eventId)
  );
}

export const certificatesApi = {
  /** One page of certificates, filtered server-side. */
  async getPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    auxiliary?: Auxiliary;
    eventId?: string;
  }): Promise<PageResult<Certificate>> {
    return fetchBackendPage(
      'Certificates',
      {
        search: params.search,
        status: params.status,
        auxiliary: params.auxiliary,
        eventId: params.eventId,
      },
      params.page,
      params.pageSize,
      mapBackendCertificateToCertificate
    );
  },

  async getAll(auxiliary?: Auxiliary): Promise<Certificate[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await getAllBackendPages('Certificates');
        const mapped = removeLegacyDemoCertificates(res.map(mapBackendCertificateToCertificate));
        setStorage('certificates', mapped);
        if (!auxiliary) return mapped;
        return mapped.filter((c) => c.auxiliary === auxiliary);
      } catch (err) {
        console.warn('Backend Certificates fetch failed:', err);
        throw err;
      }
    }

    await delay(100);
    const cachedCertificates = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const certs = removeLegacyDemoCertificates(cachedCertificates);
    if (certs.length !== cachedCertificates.length) setStorage('certificates', certs);
    if (!auxiliary) return certs;
    return certs.filter((c) => c.auxiliary === auxiliary);
  },

  async getById(id: string): Promise<Certificate> {
    const response = await backendFetch<BackendRecord>(`Certificates/${encodeURIComponent(id)}`);
    return mapBackendCertificateToCertificate(response);
  },

  async getByEvent(eventId: string): Promise<Certificate[]> {
    // Shared helper — a paged response is never mistaken for the full list.
    const response = await getAllBackendPages(`Certificates/event/${encodeURIComponent(eventId)}`);
    return response.map(mapBackendCertificateToCertificate);
  },

  async getMy(): Promise<BackendRecord[]> {
    // Shared helper — a paged response is never mistaken for the full list.
    return getAllBackendPages('Certificates/my');
  },

  async download(id: string): Promise<Blob> {
    return backendDownload(`Certificates/${encodeURIComponent(id)}/download`);
  },

  async generateFile(id: string): Promise<Blob> {
    const token = getAuthToken();
    const headers = new Headers({ Accept: 'application/pdf' });
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`/api/backend/Certificates/${encodeURIComponent(id)}/generate`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error(`Certificate generation failed (${response.status}).`);
    return response.blob();
  },

  async generateAllForEvent(eventId: string): Promise<BackendRecord> {
    return backendFetch<BackendRecord>(`Certificates/event/${encodeURIComponent(eventId)}/generate-all`, {
      method: 'POST',
    });
  },

  async downloadAllForEvent(eventId: string): Promise<Blob> {
    return backendDownload(`Certificates/event/${encodeURIComponent(eventId)}/download-all-pdf`);
  },

  async delete(id: string, performedBy?: User, certificate?: Certificate): Promise<void> {
    const isBackendId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);
    if (getAuthToken() && isBackendId) {
      // No detail pre-fetch — it can 404 and block the delete.
      let known = certificate;
      if (!known) {
        try {
          known = await this.getById(id);
        } catch {
          known = undefined;
        }
      }
      try {
        await backendFetch<void>(`Certificates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (err) {
        // "Already gone" is still a successful deletion from the admin's view.
        const status = (err as { status?: number } | null)?.status;
        const message = err instanceof Error ? err.message : '';
        const alreadyGone = status === 404 || /not found|no such|does not exist/i.test(message);
        if (!alreadyGone) throw err;
        console.warn(`Certificate ${id} was already absent on the backend.`);
      }
      if (performedBy) {
        await auditApi.recordLog({
          action: 'Certificate Deleted',
          adminName: performedBy.fullName,
          adminRole: performedBy.role,
          auxiliary: known?.auxiliary,
          target: known?.certificateNumber || id,
          details: 'Deleted revoked certificate record.',
        });
      }
      return;
    }
    const cached = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const cachedCertificate = cached.find((item) => item.id === id);
    if (!cachedCertificate) throw new Error('Certificate was not found.');
    setStorage('certificates', cached.filter((item) => item.id !== id));
    if (performedBy) {
      await auditApi.recordLog({
        action: 'Certificate Deleted',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary: cachedCertificate.auxiliary,
        target: cachedCertificate.certificateNumber,
        details: 'Deleted revoked certificate from local storage.',
      });
    }
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
      const isGuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
      if (!isGuid(templateId)) throw new Error('Select a saved backend certificate template before generating certificates.');
      if (participantIds.some((participantId) => !isGuid(participantId))) {
        throw new Error('Only participants saved to the backend can receive backend certificates.');
      }
      const backendCertType = toBackendCertType(certificateType);
      try {
        for (const pId of participantIds) {
        const res = await backendFetch<BackendRecord>('Certificates', {
          method: 'POST',
          body: JSON.stringify({
            eventId,
            participantId: pId,
            certificateTemplateId: templateId,
            certificateType: backendCertType,
          }),
        });
        if (!res?.id) throw new Error('The backend did not return a certificate record.');
        newlyGenerated.push(mapBackendCertificateToCertificate(res));
        }
      } catch (error) {
        if (newlyGenerated.length > 0) {
          const cached = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
          setStorage('certificates', [...newlyGenerated, ...cached]);
        }
        // A batch that fails partway through must still leave a trace of what
        // was issued before the failure — the admin needs to know which
        // certificates exist so they can be retried or revoked.
        await auditApi.recordLog({
          action: 'Certificate Generated',
          adminName: performedBy.fullName,
          adminRole: performedBy.role,
          target: `Batch of ${newlyGenerated.length} Certificates (partial)`,
          details: `Batch generation failed partway: ${newlyGenerated.length} certificate(s) were issued before the error. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        throw error;
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
      }
      return newlyGenerated;
    }

    // Fallback generation
    await delay(400);
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    // Falls back to a neutral prefix when the event carries no auxiliary.
    const auxCode = event.auxiliary ? event.auxiliary.slice(0, 3).toUpperCase() : 'GEN';
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
        verificationHash: stableVerificationHash(certNumber),
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
    const isBackendId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(certificateId);
    if (token && isBackendId) {
      const response = await backendFetch<BackendRecord>(`Certificates/${encodeURIComponent(certificateId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Revoked',
          revocationReason: reason,
          revokedBy: performedBy.fullName,
        }),
      });
      const updated = mapBackendCertificateToCertificate(response);
      const cached = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
      setStorage('certificates', cached.map((certificate) => certificate.id === certificateId ? updated : certificate));
      await auditApi.recordLog({
        action: 'Certificate Revoked',
        adminName: performedBy.fullName,
        adminRole: performedBy.role,
        auxiliary: updated.auxiliary,
        target: `${updated.certificateNumber} (${updated.participantName})`,
        details: `Revoked certificate. Reason: ${reason}`,
      });
      return updated;
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
    // Always ask the server. Reading the local cache here could "verify" a
    // certificate that the server has never issued (or has revoked).
    return backendFetch<BackendRecord>(`Certificates/verify/${encodeURIComponent(certificateNumber)}`);
  },
};

// ---------------------------------------------------------------------------
// REAL BACKEND AUTH (via same-origin proxy at app/api/auth/login/route.ts)
// ---------------------------------------------------------------------------
export interface BackendLoginResponse {
  accessToken: string;
  expiresAt: string;
  role: string; // "SuperAdmin" | "GeneralAdmin" | "Member"
  auxiliary: string | null;
  profile: {
    membershipId: string;
    fullName: string | null;
    auxiliary: string | null;
    jamaat: string | null;
    dila: string | null;
    ilaqa: string | null;
    status: string;
    // Optional — the registry may omit it. Never invented.
    email?: string | null;
  };
  events?: unknown;
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
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  if (!res.ok) {
    // A 401 only means the credentials were rejected; it cannot safely tell the user which field was wrong.
    if (res.status === 401) {
      throw new Error('Login failed. Check your Chanda number and password, then try again.');
    }

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
    throw new Error(friendlyErrorMessage(res.status, detail, 'Incorrect Member ID or password. Please try again.'));
  }

  const data = (await res.json()) as BackendLoginResponse;
  if (!data?.accessToken || !data?.profile?.membershipId) {
    throw new Error('We could not sign you in. Please try again.');
  }

  const normalizedRole = data.role.trim().toLowerCase();
  const role: User['role'] | undefined = normalizedRole === 'superadmin'
    ? 'SUPER_ADMIN'
    : normalizedRole === 'generaladmin'
      ? 'GENERAL_ADMIN'
      : normalizedRole === 'member'
        ? 'MEMBER'
        : undefined;

  if (!role) {
    throw new Error('Your account role is not recognized. Please contact support.');
  }

  const user: User = {
    id: `backend-${data.profile.membershipId}`,
    memberId: data.profile.membershipId,
    fullName: data.profile.fullName?.trim() || data.profile.membershipId,
    // Never invent an address — use the one the registry returned, or none.
    email: bStr(data.profile.email),
    role,
    assignedAuxiliary: (data.auxiliary ||
      data.profile.auxiliary ||
      undefined) as User['assignedAuxiliary'],
    dila: data.profile.dila || undefined,
    jamaat: data.profile.jamaat || undefined,
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('jcs_access_token', data.accessToken);
    sessionStorage.setItem('jcs_expires_at', data.expiresAt);
    if (role === 'MEMBER') {
      // The backend login response already includes this member's event and certificate summary.
      sessionStorage.setItem('jcs_member_events', JSON.stringify(data.events ?? []));
    } else {
      sessionStorage.removeItem('jcs_member_events');
    }
  }

  return { user, accessToken: data.accessToken };
}
