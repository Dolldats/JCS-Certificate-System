import { CertificateTemplate } from '../../types';

/** Certificate honorific follows the auxiliary's audience. */
export function getSalutation(template: {
  auxiliary?: CertificateTemplate['auxiliary'];
  logoType?: CertificateTemplate['logoType'];
}): string {
  const key = template.auxiliary || template.logoType || '';
  return ['Lajna', 'Nasra', 'lajna-emblem', 'nasra-emblem'].includes(key)
    ? 'Sister'
    : 'Brother';
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
