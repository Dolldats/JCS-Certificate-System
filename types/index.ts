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
  | 'Pending'
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

// Certificate layout design — user-chosen in Certificate Studio.
// 'modern-rings': mint bg, torus rings, left header
// 'emerald-prestige': deep green header band, gold accents, premium centered body
// 'ivory-minimal': clean ivory canvas, hairline rules, letterspaced label badge
// 'royal-maroon': maroon/gold strips, medallion header, formal centered layout
// 'teal-surge': flowing wave bands, left header, rounded badge
// 'onyx-executive': charcoal/gold hairline frame, formal centered layout
export type CertificateDesign =
  | 'modern-rings'
  | 'emerald-prestige'
  | 'ivory-minimal'
  | 'royal-maroon'
  | 'teal-surge'
  | 'onyx-executive';

export interface User {
  id: string;
  memberId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: AdminRole | 'MEMBER'; // Members use the Member Portal rather than the admin shell.
  assignedAuxiliary?: Auxiliary;
  dila?: string;
  jamaat?: string;
  avatarUrl?: string;
}

export interface JamaatMember {
  memberId: string;
  fullName: string;
  gender?: string;
  auxiliary: Auxiliary;
  // Mulk for Khuddam/Ansarullah/Atfal, District for Lajna/Nasra. Left
  // undefined when the registry does not supply it — never invented.
  mulkOrDistrict?: string;
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
  // Undefined when the backend does not specify one — never defaulted to a
  // real event type, so the record is not filed under the wrong category.
  eventType?: EventType;
  date: string;
  endDate?: string;
  venue: string;
  // Undefined when the record carries no auxiliary. It must never default to
  // a real auxiliary — that would show the record to the wrong group.
  auxiliary?: Auxiliary;
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
  gender?: string;
  email?: string;
  phone?: string;
  auxiliary?: Auxiliary;
  // Mulk for Khuddam/Ansarullah/Atfal, District for Lajna/Nasra. Read from the
  // backend when present; never invented.
  mulkOrDistrict?: string;
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
  design?: CertificateDesign; // layout choice (defaults to 'modern-rings')
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
  // Only an explicitly uploaded logo. Left undefined so the certificate
  // artwork falls back to the auxiliary's own emblem.
  logoUrl?: string;
  // Full certificate background artwork (separate from the logo).
  backgroundImagePath?: string;

  // Event & Certificate Content
  eventTitle: string; // e.g. "ISLAMIC VACATION COURSE/REGIONAL IJTEMA 2025"
  typeBadgeText: string; // e.g. "CERTIFICATE OF PARTICIPATION"
  participationLine?: string; // e.g. "Participated in a week Islamic Vacation Course which took place"
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
  signatureAssetPath?: string;

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
  gender?: string;
  memberId: string;
  auxiliary?: Auxiliary;
  dila: string;
  ilaqa?: string;
  jamaat: string;
  type: CertificateType;
  templateId: string;
  issuedAt: string;
  issuedBy: string;
  status: CertificateStatus;
  filePath?: string;
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
    | 'Event Deleted'
    | 'Participant Import'
    | 'Member Verification'
    | 'Certificate Generated'
    | 'Certificate Updated'
    | 'Certificate Revoked'
    | 'Certificate Deleted'
    | 'Template Modified'
    | 'Template Deleted'
    | 'Template Save Failed';
  adminName: string;
  adminRole: AdminRole | 'Admin' | 'MEMBER';
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
