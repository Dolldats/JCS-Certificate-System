import {
  User,
  JamaatMember,
  Event,
  Participant,
  CertificateTemplate,
  Certificate,
  AuditLog,
} from '../types';

// All seed data has been removed — all data is fetched from the live backend.
// Empty arrays are kept so existing imports in api.ts and other files compile cleanly.
// Exception: certificate TEMPLATE presets are design assets (not backend data), so
// they stay local as a fallback for the Certificate Studio when the backend
// returns no templates yet. Backend templates always take precedence.

export const INITIAL_USERS: User[] = [];

export const JAMAAT_MEMBER_DATABASE: JamaatMember[] = [];

export const INITIAL_EVENTS: Event[] = [];

export const INITIAL_PARTICIPANTS: Participant[] = [];

// Design presets for the Certificate Studio — used only when the backend
// returns no templates. Backend templates always take precedence.
export const INITIAL_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'tmpl-nigeria-atfal',
    name: 'Atfal Islamic Vacation Course (Official Green)',
    auxiliary: 'Atfal',
    certificateType: 'Certificate of Participation',
    orientation: 'landscape',
    design: 'modern-rings',
    primaryColor: '#15803d', // Vibrant green torus and badge
    accentColor: '#84cc16',  // Lime highlight and gold-green gradient
    neutralColor: '#0f172a', // Dark charcoal text
    backgroundColor: '#ffffff',
    showWaveWatermark: true,
    showTorusRings: true,
    showRosetteBadge: true,
    organizationName: 'MAJLIS ATFAL-UL AHMADIYYA NIGERIA',
    organizationSubtitle: '(Ahmadiyya Muslims Children Organization)',
    logoType: 'atfal-emblem',
    eventTitle: 'ISLAMIC VACATION COURSE/REGIONAL IJTEMA 2025',
    typeBadgeText: 'CERTIFICATE OF PARTICIPATION',
    themeTitle: 'Theme: My Faith, My Identity.',
    participationLine: 'Participated in a week Islamic Vacation Course which took place',
    programDurationText: '3rd August to Sunday 10th August, 2025',
    bodyIntroText: 'This is to congratulate and certify that Tifl {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}} from {{Jamaat}}.',
    bodyDescriptionText: 'Participated in a week Islamic Vacation Course which took place at {{Venue}} from 3rd August to Sunday 10th August, 2025.',
    bodyFocusText: 'The program focussed on enhancing Islamic knowledge, promoting religious tolerance, and fostering nation-building by raising children who will contribute to peace and societal growth.',
    signature1Name: 'Abdur Raob Akhryemi',
    signature1Title: 'Sadr Majlis Khuddamul Ahmadiyya Nigeria',
    signature1Date: '10th August, 2025',
    isDefault: true,
    updatedAt: '2025-08-10T12:00:00Z',
  },
  {
    id: 'tmpl-khuddam-royal',
    name: 'Khuddam Royal Emerald & Gold',
    auxiliary: 'Khuddam',
    certificateType: 'Certificate of Excellence',
    orientation: 'landscape',
    design: 'modern-rings',
    primaryColor: '#046a38',
    accentColor: '#d97706',
    neutralColor: '#0f172a',
    backgroundColor: '#fcfdfb',
    showWaveWatermark: true,
    showTorusRings: true,
    showRosetteBadge: true,
    organizationName: 'MAJLIS KHUDDAM-UL-AHMADIYYA',
    organizationSubtitle: '(Ahmadiyya Muslim Youth Association)',
    logoType: 'khuddam-emblem',
    eventTitle: 'ANNUAL NATIONAL IJTEMA COMPETITION 2026',
    typeBadgeText: 'CERTIFICATE OF EXCELLENCE',
    themeTitle: 'Theme: Honor Thy Pledge',
    participationLine: 'Participated in the Annual National Ijtema which took place',
    programDurationText: '18th to 20th September, 2026',
    bodyIntroText: 'Awarded with high distinction to Khadim {{ParticipantName}}, Dilla {{Dilla}}, representing {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'For securing exceptional academic merit and outstanding commitment during the National Ijtema at {{Venue}}.',
    bodyFocusText: 'In recognition of steadfast dedication to moral excellence, discipline, and selfless service to faith and nation.',
    signature1Name: 'National Sadr',
    signature1Title: 'Majlis Khuddam-ul-Ahmadiyya',
    signature1Date: '20th September, 2026',
    isDefault: false,
    updatedAt: '2026-08-01T12:00:00Z',
  },
  {
    id: 'tmpl-lajna-regal',
    name: 'Lajna Floral Regal Teal & Gold',
    auxiliary: 'Lajna',
    certificateType: 'Certificate of Appreciation',
    orientation: 'landscape',
    primaryColor: '#0f766e', // Deep Teal
    accentColor: '#f59e0b', // Amber
    neutralColor: '#0f172a',
    backgroundColor: '#fafcfb',
    showWaveWatermark: true,
    showTorusRings: true,
    showRosetteBadge: true,
    organizationName: 'LAJNA IMA\'ILLAH',
    organizationSubtitle: '(Ahmadiyya Muslim Women\'s Association)',
    logoType: 'lajna-emblem',
    eventTitle: 'NATIONAL TARBIYYAT & ACADEMIC SEMINAR 2026',
    typeBadgeText: 'CERTIFICATE OF APPRECIATION',
    themeTitle: 'Theme: Women as Pillars of Peace',
    participationLine: 'Participated in the National Tarbiyyat Seminar which took place',
    programDurationText: '15th October, 2026',
    bodyIntroText: 'Warmly presented to Lajna member {{ParticipantName}}, Dilla {{Dilla}}, {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'In gracious appreciation for her active participation and presentation at {{Venue}}.',
    bodyFocusText: 'Exemplifying virtue, spiritual leadership, and devotion in educating future generations.',
    signature1Name: 'Sadr Lajna Ima\'illah',
    signature1Title: 'National President',
    signature1Date: '15th October, 2026',
    isDefault: false,
    updatedAt: '2026-08-15T12:00:00Z',
  },
  {
    id: 'tmpl-ansarullah-navy',
    name: 'Ansarullah Navy & Gold (Official)',
    auxiliary: 'Ansarullah',
    certificateType: 'Certificate of Recognition',
    orientation: 'landscape',
    primaryColor: '#1e3a8a', // Deep Navy Blue
    accentColor: '#d97706', // Rich Gold
    neutralColor: '#0f172a',
    backgroundColor: '#eff6ff', // Soft Blue-White
    showWaveWatermark: true,
    showTorusRings: true,
    showRosetteBadge: true,
    organizationName: 'MAJLIS ANSARULLAH NIGERIA',
    organizationSubtitle: '(Ahmadiyya Muslim Elders Association)',
    logoType: 'ansarullah-emblem',
    eventTitle: 'NATIONAL IJTEMA & TARBIYYAT CONVENTION 2026',
    typeBadgeText: 'CERTIFICATE OF RECOGNITION',
    themeTitle: 'Theme: Steadfast Servants of Allah',
    participationLine: 'Participated in the Annual National Ijtema which took place',
    programDurationText: '22nd to 24th November, 2026',
    bodyIntroText: 'This is to proudly certify and honour Nasir {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}}, from {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'For his distinguished participation in the National Ijtema & Tarbiyyat Convention held at {{Venue}}.',
    bodyFocusText: 'A gathering dedicated to upholding the highest ideals of service, wisdom, and unwavering faith in Ahmadiyyat — for the glory of Islam and the service of humanity.',
    signature1Name: 'Sadr Majlis Ansarullah Nigeria',
    signature1Title: 'National President, Ansarullah Nigeria',
    signature1Date: '24th November, 2026',
    isDefault: false,
    updatedAt: '2026-08-20T12:00:00Z',
  },
  {
    id: 'tmpl-nasra-purple',
    name: 'Nasra Royal Purple & Silver (Official)',
    auxiliary: 'Nasra',
    certificateType: 'Certificate of Merit',
    orientation: 'landscape',
    primaryColor: '#6d28d9', // Deep Purple / Violet
    accentColor: '#a78bfa', // Soft Lavender Accent
    neutralColor: '#1e1b4b',
    backgroundColor: '#faf5ff', // Light Lavender White
    showWaveWatermark: true,
    showTorusRings: true,
    showRosetteBadge: true,
    organizationName: 'MAJLIS NASRA-TUL-AHMADIYYA NIGERIA',
    organizationSubtitle: '(Ahmadiyya Muslim Boys\' Association)',
    logoType: 'nasra-emblem',
    eventTitle: 'NATIONAL NASRA IJTEMA & SKILLS EXPOSITION 2026',
    typeBadgeText: 'CERTIFICATE OF MERIT',
    themeTitle: 'Theme: Young Minds, Strong Iman',
    participationLine: 'Participated in a week Islamic Vacation Course which took place',
    programDurationText: '8th to 10th December, 2026',
    bodyIntroText: 'This is to commend and certify Nasirah {{ParticipantName}}, Dilla {{Dilla}}, Ilaqa {{Ilaqa}}, from {{Jamaat}} Jama\'at.',
    bodyDescriptionText: 'For commendable participation and dedication displayed at the National Nasra Ijtema held at {{Venue}}.',
    bodyFocusText: 'Championing youth excellence, spiritual growth, and practical service — building a generation of young Ahmadi men rooted in faith and prepared to serve the nation.',
    signature1Name: 'Sadr Majlis Nasra-tul-Ahmadiyya',
    signature1Title: 'National President, Nasra Nigeria',
    signature1Date: '10th December, 2026',
    isDefault: false,
    updatedAt: '2026-09-01T12:00:00Z',
  },
];

export const INITIAL_CERTIFICATES: Certificate[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
