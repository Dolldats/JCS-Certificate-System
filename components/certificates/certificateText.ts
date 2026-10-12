import { CertificateTemplate } from '../../types';

const AUX_SALUTATION: Record<string, string> = {
  Atfal: 'Tifl',
  Khuddam: 'Khadim',
  Ansarullah: 'Nasir',
  Lajna: 'Lajna member',
  Nasra: 'Nasirah',
  'atfal-emblem': 'Tifl',
  'khuddam-emblem': 'Khadim',
  'ansarullah-emblem': 'Nasir',
  'lajna-emblem': 'Lajna member',
  'nasra-emblem': 'Nasirah',
};

/** Member salutation per auxiliary (Atfal=Tifl, Khuddam=Khadim, etc.) */
export function getSalutation(template: {
  auxiliary?: CertificateTemplate['auxiliary'];
  logoType?: CertificateTemplate['logoType'];
}): string {
  const auxKey = template.auxiliary ?? '';
  const logoKey = template.logoType ?? '';
  return AUX_SALUTATION[auxKey] || AUX_SALUTATION[logoKey] || 'Tifl';
}

function auxiliaryKey(template: {
  auxiliary?: CertificateTemplate['auxiliary'];
  logoType?: CertificateTemplate['logoType'];
}): string {
  return template.auxiliary || template.logoType || '';
}

/**
 * Top org-unit label for the address hierarchy:
 * Khuddam / Ansarullah / Atfal → "Ilaqa",
 * Lajna / Nasra → "District".
 */
export function getRegionLabel(template: {
  auxiliary?: CertificateTemplate['auxiliary'];
  logoType?: CertificateTemplate['logoType'];
}): 'Ilaqa' | 'District' {
  const key = auxiliaryKey(template);
  return key === 'Lajna' || key === 'Nasra' || key === 'lajna-emblem' || key === 'nasra-emblem'
    ? 'District'
    : 'Ilaqa';
}
