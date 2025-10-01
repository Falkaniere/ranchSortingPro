import { RiderCategory } from './Competidor';

export type DuoGroup = '1D' | '2D';

export interface Duo {
  id: string;
  riderOneId: string;
  riderTwoId: string;
  group: DuoGroup;
}

export function duoKeyFromRiders(riderAId: string, riderBId: string): string {
  return [riderAId, riderBId].sort().join('🤝');
}

export function computeDuoGroup(
  catA: RiderCategory,
  catB: RiderCategory
): DuoGroup {
  const oneD: Array<[RiderCategory, RiderCategory]> = [
    ['Open', 'Amateur19'],
    ['Open', 'AmateurLight'],
    ['Amateur19', 'AmateurLight'],
  ];

  const twoD: Array<[RiderCategory, RiderCategory]> = [
    ['Open', 'Beginner'],
    ['Amateur19', 'Beginner'],
    ['AmateurLight', 'AmateurLight'],
    ['AmateurLight', 'Beginner'],
    ['Beginner', 'Beginner'],
  ];

  const pair = [catA, catB].sort().toString();
  if (oneD.some(([a, b]) => [a, b].sort().toString() === pair)) return '1D';
  if (twoD.some(([a, b]) => [a, b].sort().toString() === pair)) return '2D';
  return '1D';
}
