import { RiderCategory } from './Competidor';

export type DuoGroup = '1D' | '2D';

export interface Duo {
  id: string;
  riderOneId: string;
  riderTwoId: string;
  group: DuoGroup;
  /**
   * Dupla Principiante+Principiante: entra no pool geral da final 1D como
   * qualquer outra dupla, mas — diferente de uma dupla 1D "de verdade" — pode
   * cair na final 2D como reserva caso não se classifique na 1D.
   */
  doublePrincipiante?: boolean;
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
 * 1D: Aberta+19, Aberta+Light, 19+19, 19+Light, Light+Light, Principiante+Principiante
 * 2D: pareamento com exatamente um Principiante (Aberta+Principiante, 19+Principiante,
 *     Light+Principiante)
 */
export function canPair(catA: RiderCategory, catB: RiderCategory): boolean {
  if (catA === 'Aberta' && catB === 'Aberta') return false;
  return true;
}

export function computeDuoGroup(catA: RiderCategory, catB: RiderCategory): DuoGroup {
  if (catA === 'Principiante' && catB === 'Principiante') return '1D';
  if (catA === 'Principiante' || catB === 'Principiante') return '2D';
  return '1D';
}

export function isDoublePrincipiante(catA: RiderCategory, catB: RiderCategory): boolean {
  return catA === 'Principiante' && catB === 'Principiante';
}
