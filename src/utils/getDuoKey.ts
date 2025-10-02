// src/utils/getDuoKey.ts
import { Competitor } from 'core/models/Competidor';

export const getDuoKey = (duo: Competitor[]): string =>
  duo.map((p: Competitor) => p.name).join('🤝');

export function duoKeyFromRiders(riderAId: string, riderBId: string): string {
  return [riderAId, riderBId].sort().join('🤝');
}
