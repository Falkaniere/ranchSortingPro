export type RiderCategory = 'Aberta' | '19' | 'Light' | 'Principiante';

// Migrates legacy category values (2-category model, or raw imports) to the current 4-category model.
// Strips spaces/punctuation so aliases like "Amador/Light" or "Amador 19" normalize the same as "AmadorLight"/"Amador19".
export function normalizeCategory(cat: unknown): RiderCategory {
  // Coerção defensiva: docs legados/adulterados podem trazer valores não-string.
  const v = String(cat ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (v === '19' || v === 'amateur19' || v === 'amador19') return '19';
  if (v === 'light' || v === 'amateurlight' || v === 'amadorlight') return 'Light';
  // Bare "Amador" (old 2-category model) always meant the 2D group, same as "2D"/"Beginner".
  if (v === 'principiante' || v === 'beginner' || v === '2d' || v === 'amador' || v === 'amador2d') return 'Principiante';
  return 'Aberta'; // Aberta, Open, 1D, or any unknown value → Aberta
}

export interface Competitor {
  id: string;
  name: string;
  category: RiderCategory;
  // Number of passes (rounds) this competitor must ride in the qualifier stage
  passes: number;
}
