import {
  User,
  Event,
  Participant,
  CertificateTemplate,
  Certificate,
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
  JAMAAT_MEMBER_DATABASE,
} from './mockData';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

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
    await delay(150);
    const logs = getStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    if (!auxiliaryFilter) return logs;
    return logs.filter((l) => !l.auxiliary || l.auxiliary === auxiliaryFilter);
  },

  async recordLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const logs = getStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
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
  async getCurrentUser(): Promise<User> {
    await delay(100);
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const activeUserId = getStorage<string>('active_user_id', users[0].id);
    return users.find((u) => u.id === activeUserId) || users[0];
  },

  async switchUser(userId: string): Promise<User> {
    await delay(100);
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found');
    setStorage('active_user_id', target.id);
    await auditApi.recordLog({
      action: 'Login',
      adminName: target.fullName,
      adminRole: target.role,
      auxiliary: target.assignedAuxiliary,
      target: 'Dashboard Session',
      details: `Switched active session to ${target.fullName} (${target.role})`,
    });
    return target;
  },

  async register(input: {
    fullName: string;
    memberId: string;
    auxiliary: Auxiliary;
    jamaat?: string;
    dila?: string;
  }): Promise<User> {
    await delay(300);
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const cleanId = input.memberId.trim().toUpperCase();
    if (!cleanId) throw new Error('Member ID is required.');
    if (users.some((u) => u.memberId.toUpperCase() === cleanId)) {
      throw new Error('An account with this Member ID already exists. Please sign in instead.');
    }
    const member = JAMAAT_MEMBER_DATABASE.find((m) => m.memberId.toUpperCase() === cleanId);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      memberId: cleanId,
      fullName: input.fullName.trim(),
      email: member?.email || `${cleanId.toLowerCase()}@jamaat.org`,
      role: 'GENERAL_ADMIN',
      assignedAuxiliary: input.auxiliary,
      dila: input.dila?.trim() || member?.dila,
      jamaat: input.jamaat?.trim() || member?.jamaat,
    };
    setStorage('users', [...users, newUser]);
    setStorage('active_user_id', newUser.id);
    await auditApi.recordLog({
      action: 'Login',
      adminName: newUser.fullName,
      adminRole: newUser.role,
      auxiliary: newUser.assignedAuxiliary,
      target: 'Dashboard Session',
      details: `Self-registered new ${input.auxiliary} admin account (${cleanId}) and signed in.`,
    });
    return newUser;
  },

  async getAllUsers(): Promise<User[]> {
    await delay(100);
    const stored = getStorage<User[]>('users', INITIAL_USERS);
    // Merge in any seed users added to code later (e.g. new auxiliaries),
    // so existing browsers pick them up without losing saved accounts.
    const ids = new Set(stored.map((u) => u.id));
    const missing = INITIAL_USERS.filter((u) => !ids.has(u.id));
    if (missing.length === 0) return stored;
    const merged = [...stored, ...missing];
    setStorage('users', merged);
    return merged;
  },

  async assignGeneralAdmin(memberId: string, auxiliary: Auxiliary, performedBy: User): Promise<User> {
    await delay(250);
    const users = getStorage<User[]>('users', INITIAL_USERS);
    const member = JAMAAT_MEMBER_DATABASE.find((m) => m.memberId.toUpperCase() === memberId.toUpperCase());
    const existing = users.find((u) => u.memberId.toUpperCase() === memberId.toUpperCase());

    let updated: User;
    if (existing) {
      updated = { ...existing, role: 'GENERAL_ADMIN', assignedAuxiliary: auxiliary };
      setStorage('users', users.map((u) => (u.id === existing.id ? updated : u)));
    } else {
      updated = {
        id: `usr-${Date.now()}`,
        memberId: memberId.toUpperCase(),
        fullName: member?.fullName || `Brother ${memberId}`,
        email: member?.email || `${memberId.toLowerCase()}@jamaat.org`,
        role: 'GENERAL_ADMIN',
        assignedAuxiliary: auxiliary,
        dila: member?.dila,
        jamaat: member?.jamaat,
      };
      setStorage('users', [...users, updated]);
    }

    await auditApi.recordLog({
      action: 'General Admin Assigned',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary,
      target: `${updated.fullName} (${memberId})`,
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

// EVENTS API
export const eventsApi = {
  async getAll(auxiliary?: Auxiliary): Promise<Event[]> {
    await delay(150);
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    if (!auxiliary) return events;
    return events.filter((e) => e.auxiliary === auxiliary);
  },

  async getById(id: string): Promise<Event | null> {
    await delay(100);
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    return events.find((e) => e.id === id) || null;
  },

  async create(
    data: Omit<Event, 'id' | 'createdAt' | 'participantsCount' | 'verifiedCount' | 'certificatesIssuedCount'>,
    performedBy: User
  ): Promise<Event> {
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
};

// PARTICIPANTS API
export const participantsApi = {
  async getByEvent(eventId: string): Promise<Participant[]> {
    await delay(150);
    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    return participants.filter((p) => p.eventId === eventId);
  },

  // Verification goes through the Jama'at member adapter: mock registry
  // today, real central API automatically once NEXT_PUBLIC_JAMAAT_API_URL
  // is set. Callers stay unchanged.
  async verifyMemberId(memberId: string, auxiliary: Auxiliary): Promise<{
    status: Participant['verificationStatus'];
    details: string;
    member?: JamaatMember;
  }> {
    return jamaatMemberApi.verifyMember(memberId, auxiliary);
  },

  async addSingle(eventId: string, memberId: string, performedBy: User): Promise<Participant> {
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    const cleanId = memberId.trim().toUpperCase();

    const isDuplicate = participants.some((p) => p.eventId === eventId && p.memberId.toUpperCase() === cleanId);
    let status: Participant['verificationStatus'] = 'Verified';
    let details = 'Verified successfully';
    let memberData: Partial<JamaatMember> = { fullName: `Member ${cleanId}` };

    if (isDuplicate) {
      status = 'Duplicate';
      details = 'Participant is already enrolled in this event';
    } else {
      const result = await this.verifyMemberId(cleanId, event.auxiliary);
      status = result.status;
      details = result.details;
      if (result.member) memberData = result.member;
    }

    const newParticipant: Participant = {
      id: `part-${Date.now()}`,
      eventId,
      memberId: cleanId,
      fullName: memberData.fullName || `Member ${cleanId}`,
      auxiliary: (memberData.auxiliary as Auxiliary) || event.auxiliary,
      dila: memberData.dila || 'Lagos',
      ilaqa: memberData.ilaqa || 'South West',
      jamaat: memberData.jamaat || 'Headquarters',
      verificationStatus: status,
      verificationDetails: details,
      addedAt: new Date().toISOString(),
    };

    setStorage('participants', [newParticipant, ...participants]);

    // Update event counter
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    setStorage(
      'events',
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              participantsCount: e.participantsCount + 1,
              verifiedCount: status === 'Verified' ? e.verifiedCount + 1 : e.verifiedCount,
            }
          : e
      )
    );

    await auditApi.recordLog({
      action: 'Member Verification',
      adminName: performedBy.fullName,
      adminRole: performedBy.role,
      auxiliary: event.auxiliary,
      target: `${cleanId} (${event.name})`,
      details: `Enrolled participant: Status ${status}`,
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
};

// TEMPLATES API
export const templatesApi = {
  async getAll(auxiliary?: Auxiliary): Promise<CertificateTemplate[]> {
    await delay(100);

    // Load user-saved overrides (keyed by template id)
    const savedOverrides = getStorage<Record<string, CertificateTemplate>>('template_overrides', {});

    // Merge: always start from the full INITIAL_TEMPLATES list so new
    // templates added to code always show up, then apply any saved
    // customisations on top.
    const merged: CertificateTemplate[] = INITIAL_TEMPLATES.map((tmpl) =>
      savedOverrides[tmpl.id] ? { ...tmpl, ...savedOverrides[tmpl.id] } : tmpl
    );

    if (!auxiliary) return merged;
    return merged.filter(
      (t) => !t.auxiliary || t.auxiliary === 'All' || t.auxiliary === auxiliary
    );
  },

  async save(templateData: CertificateTemplate, performedBy: User): Promise<CertificateTemplate> {
    await delay(200);

    const updatedTemplate: CertificateTemplate = {
      ...templateData,
      updatedAt: new Date().toISOString(),
    };

    // Persist only the overrides (delta), not the full list, so new
    // templates added to INITIAL_TEMPLATES always appear for everyone.
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
    await delay(400);
    const event = await eventsApi.getById(eventId);
    if (!event) throw new Error('Event not found');

    const participants = getStorage<Participant[]>('participants', INITIAL_PARTICIPANTS);
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const newlyGenerated: Certificate[] = [];
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

    // Update event counter
    const events = getStorage<Event[]>('events', INITIAL_EVENTS);
    setStorage(
      'events',
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              certificatesIssuedCount: e.certificatesIssuedCount + newlyGenerated.length,
            }
          : e
      )
    );

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
    await delay(200);
    const certs = getStorage<Certificate[]>('certificates', INITIAL_CERTIFICATES);
    const target = certs.find((c) => c.id === certificateId);
    if (!target) throw new Error('Certificate not found');

    // Serial number, member link, issuer and timestamps stay fixed —
    // only the printed details are editable.
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
    await delay(200);
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
};
