import type { Auxiliary } from '../types';

export function formatMemberName(
  name: string,
  gender?: string,
  auxiliary?: Auxiliary
): string {
  const cleanName = name.trim();
  if (!cleanName) return cleanName;

  const normalizedName = cleanName.toLowerCase();
  if (/^(brother|bro\.)\s/.test(normalizedName) || /^(sister|sis\.)\s/.test(normalizedName)) {
    return cleanName;
  }

  const normalizedGender = gender?.trim().toLowerCase();
  const female = ['female', 'f', 'girl', 'woman', 'women'].includes(normalizedGender ?? '');
  const male = ['male', 'm', 'boy', 'man', 'men'].includes(normalizedGender ?? '');
  const auxiliaryGender = auxiliary === 'Lajna' || auxiliary === 'Nasra'
    ? 'female'
    : auxiliary === 'Khuddam' || auxiliary === 'Ansarullah' || auxiliary === 'Atfal'
      ? 'male'
      : undefined;
  const title = female ? 'Sister' : male ? 'Brother' : auxiliaryGender === 'female' ? 'Sister' : auxiliaryGender === 'male' ? 'Brother' : undefined;

  return title ? `${title} ${cleanName}` : cleanName;
}
