export type Auxiliary = 'Khuddam' | 'Ansarullah' | 'Lajna' | 'Nasra' | 'Atfal';

export type AdminRole = 'SUPER_ADMIN' | 'GENERAL_ADMIN';

export type EventType =
  | 'Ijtema'
  | 'Competition'
  | 'Training'
  | 'Seminar'
  | 'Workshop'
  | 'Other';

export type EventStatus =
  | 'Draft'
  | 'Upcoming'
  | 'In Progress'
  | 'Active'
  | 'Completed'
  | 'Cancelled';

export type VerificationStatus =
  | 'Verified'
  | 'Not Found'
  | 'Invalid'
  | 'Duplicate'
  | 'Verification Failed';

export type CertificateType =
  | 'Certificate of Participation'
  | 'Certificate of Merit'
  | 'Certificate of Excellence'
  | 'Certificate of Appreciation'
  | 'Certificate of Recognition'
  | 'Certificate of Attendance';

export type CertificateStatus = 'Issued' | 'Revoked';

export interface User {
  id: string;
  memberId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: AdminRole;
  assignedAuxiliary?: Auxiliary;
  dila?: string;
  jamaat?: string;
  avatarUrl?: string;
}

export interface JamaatMember {
  memberId: string;
  fullName: string;
  auxiliary: Auxiliary;
  mulkOrDistrict: string;
  ilaqa?: string;
  dila: string;
  jamaat: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'Inactive';
}

export interface Event {
  id: string;
  name: string;
  description: string;
  eventType: EventType;
  date: string;
  endDate?: string;
  venue: string;
  auxiliary: Auxiliary;
  orgLevel: 'Mulk' | 'District' | 'Ilaqa' | 'Dila' | 'Jamaat';
  orgUnitName: string;
  status: EventStatus;
  createdAt: string;
  createdBy: string;
  participantsCount: number;
  verifiedCount: number;
  certificatesIssuedCount: number;
  theme?: string;
}

export interface Participant {
  id: string;
  eventId: string;
  memberId: string;
  fullName: string;
  auxiliary: Auxiliary;
  dila: string;
  ilaqa?: string;
  jamaat: string;
  verificationStatus: VerificationStatus;
  verificationDetails?: string;
  certificateAssigned?: CertificateType;
  certificateId?: string;
  addedAt: string;
  notes?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  auxiliary?: Auxiliary | 'All';
  certificateType: CertificateType;
  orientation: 'landscape' | 'portrait';
  
  // Visual Styling & Branding
  primaryColor: string; // Torus arc & main badge background (e.g. #15803d)
  accentColor: string;  // Highlights, seal border, accent text (e.g. #84cc16)
  neutralColor: string; // Headlines & text (e.g. #0f172a)
  backgroundColor: string; // Background tint (e.g. #fdfbf7 or #f4fbf7)
  showWaveWatermark: boolean;
  showTorusRings: boolean;
  showRosetteBadge: boolean;
  
  // Organization Header
  organizationName: string; // e.g. "MAJLIS ATFAL-UL AHMADIYYA NIGERIA"
  organizationSubtitle: string; // e.g. "(Ahmadiyya Muslims Children Organization)"
  logoType: 'atfal-emblem' | 'khuddam-emblem' | 'lajna-emblem' | 'ansarullah-emblem' | 'nasra-emblem' | 'jamaat-crest' | 'custom';
  logoUrl?: string;

  // Event & Certificate Content
  eventTitle: string; // e.g. "ISLAMIC VACATION COURSE/REGIONAL IJTEMA 2025"
  typeBadgeText: string; // e.g. "CERTIFICATE OF PARTICIPATION"
  themeTitle: string; // e.g. "Theme: My Faith, My Identity."
  programDurationText: string; // e.g. "3rd August to Sunday 10th August, 2025"
  bodyIntroText: string; // e.g. "This is to congratulate and certify that {{Salutation}} {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}} from {{Jamaat}}."
  bodyDescriptionText: string; // e.g. "Participated in a week Islamic Vacation Course which took place at {{Venue}}."
  bodyFocusText: string; // e.g. "The program focussed on enhancing Islamic knowledge, promoting religious tolerance..."

  // Signatory & Authority
  signature1Name: string;
  signature1Title: string;
  signature1Date: string;
  signature1Image?: string;

  isDefault: boolean;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string; // e.g. JCS-ATF-2025-0042
  eventId: string;
  eventName: string;
  eventDate: string;
  venue?: string;
  theme?: string;
  participantId: string;
  participantName: string;
  memberId: string;
  auxiliary: Auxiliary;
  dila: string;
  ilaqa?: string;
  jamaat: string;
  type: CertificateType;
  templateId: string;
  issuedAt: string;
  issuedBy: string;
  status: CertificateStatus;
  revocationReason?: string;
  revokedAt?: string;
  revokedBy?: string;
  verificationHash: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action:
    | 'Login'
    | 'General Admin Assigned'
    | 'General Admin Revoked'
    | 'Event Created'
    | 'Event Updated'
    | 'Participant Import'
    | 'Member Verification'
    | 'Certificate Generated'
    | 'Certificate Revoked'
    | 'Template Modified';
  adminName: string;
  adminRole: AdminRole;
  auxiliary?: Auxiliary;
  target: string;
  details: string;
  ipAddress?: string;
}

export interface BulkVerificationResult {
  totalRows: number;
  verifiedCount: number;
  notFoundCount: number;
  invalidCount: number;
  duplicateCount: number;
  failedCount: number;
  participants: Participant[];
}
