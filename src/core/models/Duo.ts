import { RiderCategory } from './Competidor';

export type DuoGroup = '1D' | '2D';

export interface Duo {
  id: string;
  riderOneId: string;
  riderTwoId: string;
  group: DuoGroup;
  label?: string;
}

export function duoKeyFromRiders(riderAId: string, riderBId: string): string {
  return [riderAId, riderBId].sort().join('🤝');
}

/**
 * ASQM pairing compatibility rules.
 * Defines which categories can form a duo together.
 * Amateur19 can ONLY pair with Amateur19.
 * AmateurLight can pair with AmateurLight or Beginner.
 * Beginner can ONLY pair with Beginner.
 * Open can pair with anyone (result always counts as Aberta/1D class).
 */
export const VALID_PAIRINGS: Record<RiderCategory, RiderCategory[]> = {
  Open: ['Open', 'Amateur19', 'AmateurLight', 'Beginner'],
  Amateur19: ['Amateur19'],
  AmateurLight: ['AmateurLight', 'Beginner'],
  Beginner: ['Beginner'],
};

export function canPair(catA: RiderCategory, catB: RiderCategory): boolean {
  return VALID_PAIRINGS[catA].includes(catB);
}

export function computeDuoGroup(
  catA: RiderCategory,
  catB: RiderCategory
): DuoGroup {
  // Any duo involving an Open competitor competes in the 1D (Aberta) class
  if (catA === 'Open' || catB === 'Open') return '1D';

  // Amateur19+Amateur19 → 1D (their own Amador class, which is 1D-level)
  if (catA === 'Amateur19' && catB === 'Amateur19') return '1D';

  // AmateurLight+Amateur19 would be invalid per ASQM rules, but if it happens → 1D
  if (catA === 'Amateur19' || catB === 'Amateur19') return '1D';

  // AmateurLight pairs → 2D
  if (catA === 'AmateurLight' || catB === 'AmateurLight') return '2D';

  // Beginner+Beginner → 2D
  return '2D';
}
