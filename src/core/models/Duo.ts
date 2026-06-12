import { RiderCategory } from './Competidor';

export type DuoGroup = '1D' | '2D';

export interface Duo {
  id: string;
  riderOneId: string;
  riderTwoId: string;
  group: DuoGroup;
  label?: string;
  passNumber?: number;
}

export function duoKeyFromRiders(riderAId: string, riderBId: string): string {
  return [riderAId, riderBId].sort().join('_');
}

/**
 * Pairing compatibility rules.
 * Open (Profissional/1D) can pair with anyone.
 * AmateurLight (Amador/2D) can only pair with AmateurLight.
 * Open + AmateurLight is valid (symmetric check) and results in 1D.
 */
export const VALID_PAIRINGS: Record<RiderCategory, RiderCategory[]> = {
  Open: ['Open', 'AmateurLight'],
  AmateurLight: ['AmateurLight'],
};

export function canPair(catA: RiderCategory, catB: RiderCategory): boolean {
  return VALID_PAIRINGS[catA].includes(catB) || VALID_PAIRINGS[catB].includes(catA);
}

export function computeDuoGroup(catA: RiderCategory, catB: RiderCategory): DuoGroup {
  if (catA === 'Open' || catB === 'Open') return '1D';
  return '2D';
}
