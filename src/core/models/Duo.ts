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
 * Aberta+Aberta is the only invalid combination — two Aberta riders cannot form a dupla.
 * Every other combination of Aberta/19/Light/Principiante is valid.
 * 1D: Aberta+19, Aberta+Light, 19+19, 19+Light, Light+Light
 * 2D: any pairing involving Principiante (Aberta+Principiante, 19+Principiante,
 *     Light+Principiante, Principiante+Principiante)
 */
export function canPair(catA: RiderCategory, catB: RiderCategory): boolean {
  if (catA === 'Aberta' && catB === 'Aberta') return false;
  return true;
}

export function computeDuoGroup(catA: RiderCategory, catB: RiderCategory): DuoGroup {
  if (catA === 'Principiante' || catB === 'Principiante') return '2D';
  return '1D';
}
