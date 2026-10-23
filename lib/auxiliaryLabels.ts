import type { Auxiliary } from '../types';

const AUXILIARY_LABELS: Record<Auxiliary, string> = {
  Khuddam: 'Majlis Khuddam-ul-Ahmadiyyah',
  Atfal: 'Majlis Atfal-ul-Ahmadiyyah',
  Ansarullah: 'Majlis Ansarullah',
  Lajna: 'Lajna Imaillah',
  Nasra: 'Nasratul-ul-Ahmadiyyah',
};

export function getAuxiliaryLabel(auxiliary: Auxiliary | 'All'): string {
  return auxiliary === 'All' ? 'All 5 Auxiliaries' : AUXILIARY_LABELS[auxiliary];
}
