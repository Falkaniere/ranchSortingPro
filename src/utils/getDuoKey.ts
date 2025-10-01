// src/utils/getDuoKey.js
export const getDuoKey = (duo) => duo.map((p) => p.name).join('🤝');

export function duoKeyFromRiders(riderAId: string, riderBId: string): string {
  // Make the key order independent
  return [riderAId, riderBId].sort().join('🤝');
}
